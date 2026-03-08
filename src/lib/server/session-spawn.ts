import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { appendFileSync } from 'fs';
import {
	sessionManager,
	type Session,
	type StreamEvent,
	type PermissionResponse
} from './session-manager';
import { log } from './logger';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { claudeSession as sessionTable } from './db/schema';

const RAW_LOG_FILE = '/tmp/devlink-claude-raw.log';

function logRaw(sessionId: string, direction: 'IN' | 'OUT', line: string): void {
	try {
		const ts = new Date().toISOString();
		appendFileSync(RAW_LOG_FILE, `[${ts}] [${sessionId.slice(0, 8)}] ${direction}: ${line}\n`);
	} catch {
		// Ignore
	}
}

function saveSessionToDb(session: Session, summary?: string): void {
	try {
		db.insert(sessionTable)
			.values({
				id: session.id,
				claudeSessionId: session.claudeSessionId ?? null,
				projectId: session.projectId,
				projectPath: session.projectPath,
				model: session.model ?? null,
				permissionMode: session.permissionMode,
				status: 'running',
				totalCost: null,
				summary: summary || '',
				createdAt: session.createdAt,
				endedAt: null
			})
			.onConflictDoNothing()
			.run();
		log.spawn.info({ sessionId: session.id }, 'session saved to db');
	} catch (err) {
		log.spawn.error({ sessionId: session.id, err }, 'failed to save session to db');
	}
}

function saveEventsToDb(session: Session): void {
	try {
		db.update(sessionTable)
			.set({ events: JSON.stringify(session.events) })
			.where(eq(sessionTable.id, session.id))
			.run();
	} catch (err) {
		log.spawn.error({ sessionId: session.id, err }, 'failed to persist events');
	}
}

function updateSessionInDb(session: Session, exitStatus: string): void {
	try {
		db.update(sessionTable)
			.set({
				claudeSessionId: session.claudeSessionId ?? null,
				status: exitStatus,
				totalCost: session.totalCost ? Math.round(session.totalCost * 10000) : null,
				endedAt: new Date()
			})
			.where(eq(sessionTable.id, session.id))
			.run();
		log.spawn.info({ sessionId: session.id, status: exitStatus }, 'session updated in db');
	} catch (err) {
		log.spawn.error({ sessionId: session.id, err }, 'failed to update session in db');
	}
}

export function spawnSession(session: Session, prompt: string, resumeSessionId?: string): void {
	// Map devlink permission modes to Claude CLI permission modes
	const permissionModeMap: Record<string, string> = {
		plan: 'plan',
		ask: 'default',
		'auto-edit': 'acceptEdits',
		auto: 'bypassPermissions'
	};
	const cliPermissionMode = permissionModeMap[session.permissionMode] ?? 'default';

	const args = [
		'--output-format',
		'stream-json',
		'--input-format',
		'stream-json',
		'--verbose',
		'--permission-prompt-tool',
		'stdio',
		'--permission-mode',
		cliPermissionMode
	];

	if (session.model) {
		args.push('--model', session.model);
	}

	if (resumeSessionId) {
		args.push('--resume', resumeSessionId);
	}

	log.spawn.info(
		{
			sessionId: session.id,
			cwd: session.projectPath,
			model: session.model,
			permissionMode: cliPermissionMode,
			resume: resumeSessionId,
			args
		},
		'spawning claude process'
	);

	let child: ReturnType<typeof spawn>;
	try {
		child = spawn('claude', args, {
			cwd: session.projectPath,
			stdio: ['pipe', 'pipe', 'pipe'],
			env: { ...process.env, CLAUDECODE: undefined }
		});
	} catch (err) {
		log.spawn.error({ sessionId: session.id, err }, 'failed to spawn claude');
		sessionManager.setStatus(session.id, 'error');
		sessionManager.addEvent(session.id, {
			type: 'session_status',
			status: 'error',
			error: err instanceof Error ? err.message : 'Failed to spawn claude'
		});
		return;
	}

	log.spawn.info({ sessionId: session.id, pid: child.pid }, 'claude process started');
	session.process = child;
	sessionManager.setStatus(session.id, 'running');
	const summary = prompt ? prompt.slice(0, 200) : '';
	session.summary = summary;
	saveSessionToDb(session, summary);

	// Periodically persist events to DB so they survive server restarts
	const eventSaveInterval = setInterval(() => {
		if (session.events.length > 0) saveEventsToDb(session);
	}, 10_000);

	// Track whether CLI has initialized (sent the init event)
	let initialized = false;

	if (prompt) {
		const initialMessage = JSON.stringify({
			type: 'user',
			message: { role: 'user', content: prompt }
		});
		logRaw(session.id, 'OUT', initialMessage);
		child.stdin!.write(initialMessage + '\n');
		log.spawn.info(
			{ sessionId: session.id, promptLength: prompt.length },
			'initial prompt sent via stdin'
		);

		// Emit as event so the initial prompt shows in the chat UI
		sessionManager.addEvent(session.id, {
			type: 'user_text',
			content: prompt
		});
	}

	// Parse stdout as NDJSON
	const rl = createInterface({ input: child.stdout! });
	rl.on('line', (line) => {
		logRaw(session.id, 'IN', line);
		try {
			const event: StreamEvent = JSON.parse(line);
			log.spawn.debug({ sessionId: session.id, eventType: event.type }, 'claude event');

			// Handle permission control requests from Claude via stdio
			if (event.type === 'control_request') {
				handleControlRequest(session, event);
				return;
			}

			// Capture claude session ID from init event
			if (event.type === 'system' && (event as { subtype?: string }).subtype === 'init') {
				session.claudeSessionId = (event as { session_id?: string }).session_id;
				initialized = true;
				log.spawn.info(
					{ sessionId: session.id, claudeSessionId: session.claudeSessionId },
					'claude session initialized'
				);
				// Persist claudeSessionId immediately so it survives server restarts
				if (session.claudeSessionId) {
					try {
						db.update(sessionTable)
							.set({ claudeSessionId: session.claudeSessionId })
							.where(eq(sessionTable.id, session.id))
							.run();
					} catch (err) {
						log.spawn.error({ sessionId: session.id, err }, 'failed to persist claudeSessionId');
					}
				}
			}

			// Capture cost from result events and transition to idle
			if (event.type === 'result') {
				const resultEvent = event as {
					total_cost_usd?: number;
					is_error?: boolean;
					error?: string;
				};
				session.totalCost = resultEvent.total_cost_usd;
				sessionManager.setStatus(session.id, 'idle');
				log.spawn.info(
					{
						sessionId: session.id,
						totalCost: session.totalCost,
						isError: resultEvent.is_error,
						error: resultEvent.error
					},
					'session result'
				);
			}

			sessionManager.addEvent(session.id, event);
		} catch {
			log.spawn.debug({ sessionId: session.id, line }, 'non-json stdout line');
		}
	});

	// Capture stderr for debugging
	const stderrRl = createInterface({ input: child.stderr! });
	stderrRl.on('line', (line) => {
		log.spawn.warn({ sessionId: session.id }, `stderr: ${line}`);
		sessionManager.addEvent(session.id, {
			type: 'stderr',
			content: line
		});
	});

	child.on('exit', (code) => {
		clearInterval(eventSaveInterval);
		const status = code === 0 ? 'idle' : 'error';
		log.spawn.info(
			{ sessionId: session.id, pid: child.pid, exitCode: code, status, initialized },
			'claude process exited'
		);
		sessionManager.setStatus(session.id, status);
		session.process = null;
		saveEventsToDb(session);
		updateSessionInDb(session, status);

		const exitEvent: StreamEvent = {
			type: 'session_status',
			status,
			exitCode: code
		};
		// If CLI exited before init, the resume likely failed
		if (!initialized && code !== 0) {
			exitEvent.error = 'Session failed to start (resume may have expired)';
		}
		sessionManager.addEvent(session.id, exitEvent);
	});
}

/** Handle control_request messages from Claude (permission prompts via stdio) */
function handleControlRequest(session: Session, event: StreamEvent): void {
	// control_request format: { type: 'control_request', request_id: '...', request: { subtype: 'can_use_tool', tool_name: '...', input: {...} } }
	const requestId = (event as { request_id?: string }).request_id;
	const request = (event as { request?: Record<string, unknown> }).request;
	const subtype = request?.subtype as string | undefined;

	if (subtype !== 'can_use_tool') {
		log.permissions.debug(
			{ sessionId: session.id, subtype, event },
			'unknown control_request subtype'
		);
		return;
	}

	const toolName = (request!.tool_name as string) ?? '';
	const input = (request!.input as Record<string, unknown>) ?? {};

	log.permissions.info(
		{ sessionId: session.id, toolName, requestId },
		'permission request from claude'
	);

	const mode = session.permissionMode;
	const READ_ONLY_TOOLS = new Set(['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch']);
	const FILE_TOOLS = new Set(['Read', 'Edit', 'Write', 'Glob', 'Grep']);

	// Auto-resolve based on permission mode
	if (mode === 'plan' && READ_ONLY_TOOLS.has(toolName)) {
		sendControlResponse(session, requestId, { behavior: 'allow' }, input);
		return;
	}
	if (mode === 'plan') {
		sendControlResponse(session, requestId, { behavior: 'deny', message: 'Plan mode — read only' });
		return;
	}
	if (mode === 'auto') {
		sendControlResponse(session, requestId, { behavior: 'allow' }, input);
		return;
	}
	if (mode === 'auto-edit' && FILE_TOOLS.has(toolName)) {
		sendControlResponse(session, requestId, { behavior: 'allow' }, input);
		return;
	}

	// Ask mode (or auto-edit for non-file tools): push to browser and wait
	log.permissions.info(
		{ sessionId: session.id, toolName, mode },
		'waiting for user permission response'
	);

	const timer = setTimeout(
		() => {
			sessionManager.setPendingPermission(session.id, undefined);
			log.permissions.warn({ sessionId: session.id, toolName }, 'permission request timed out');
			sendControlResponse(session, requestId, {
				behavior: 'deny',
				message: 'Permission request timed out (5 minutes)'
			});
		},
		5 * 60 * 1000
	);

	sessionManager.setPendingPermission(session.id, {
		resolve: (r: PermissionResponse) => {
			clearTimeout(timer);
			sendControlResponse(session, requestId, r, input);
		},
		toolName,
		input
	});

	// Push permission request to connected browser clients
	sessionManager.addEvent(session.id, {
		type: 'permission_request',
		toolName,
		input,
		requestId
	});
}

/** Send a control_response back to Claude via stdin */
function sendControlResponse(
	session: Session,
	requestId: string | undefined,
	response: PermissionResponse,
	originalInput?: Record<string, unknown>
): void {
	if (!session.process?.stdin?.writable) {
		log.permissions.warn(
			{ sessionId: session.id },
			'cannot send control_response: stdin not writable'
		);
		return;
	}

	// control_response format: { type: 'control_response', response: { subtype: 'success', request_id: '...', response: { behavior: 'allow'|'deny', ... } } }
	// Zod schema: allow requires updatedInput (record with original tool input), deny requires message (string)
	const permissionResponse =
		response.behavior === 'allow'
			? { behavior: 'allow' as const, updatedInput: response.updatedInput ?? originalInput ?? {} }
			: { behavior: 'deny' as const, message: response.message ?? 'Denied by user' };

	const payload = JSON.stringify({
		type: 'control_response',
		response: {
			subtype: 'success',
			request_id: requestId,
			response: permissionResponse
		}
	});

	log.permissions.info(
		{ sessionId: session.id, requestId, behavior: response.behavior },
		'sending control_response'
	);

	logRaw(session.id, 'OUT', payload);
	session.process.stdin.write(payload + '\n');
}

export function sendMessage(session: Session, message: string): void {
	if (!session.process?.stdin?.writable) {
		log.spawn.warn({ sessionId: session.id }, 'sendMessage: stdin not writable');
		return;
	}
	log.spawn.info(
		{ sessionId: session.id, messageLength: message.length },
		'sending message to claude'
	);
	const payload = JSON.stringify({
		type: 'user',
		message: { role: 'user', content: message }
	});
	session.process.stdin.write(payload + '\n');
	sessionManager.setStatus(session.id, 'running');
}

export function stopSession(session: Session): void {
	if (session.process) {
		log.spawn.info(
			{ sessionId: session.id, pid: session.process.pid },
			'stopping session (SIGINT)'
		);
		session.process.kill('SIGINT');
	} else {
		log.spawn.warn({ sessionId: session.id }, 'stopSession: no process to stop');
	}
}

export async function switchModel(session: Session, newModel: string): Promise<void> {
	const claudeSessionId = session.claudeSessionId;
	if (!claudeSessionId) {
		throw new Error('Cannot switch model: no claude session ID (session not initialized yet)');
	}

	log.spawn.info(
		{ sessionId: session.id, from: session.model, to: newModel, claudeSessionId },
		'switching model'
	);

	// Stop current process and wait for exit
	if (session.process) {
		const exitPromise = new Promise<void>((resolve) => {
			session.process!.once('exit', () => resolve());
		});
		session.process.kill('SIGINT');
		await exitPromise;
	}

	// Update model
	session.model = newModel;

	// Update DB
	try {
		db.update(sessionTable).set({ model: newModel }).where(eq(sessionTable.id, session.id)).run();
	} catch (err) {
		log.spawn.error({ sessionId: session.id, err }, 'failed to update model in db');
	}

	// Respawn with resume + new model
	spawnSession(session, '', claudeSessionId);
}
