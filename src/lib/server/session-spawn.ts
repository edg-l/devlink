import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createInterface } from 'readline';
import { sessionManager, type Session, type StreamEvent } from './session-manager';

const DEVLINK_PORT = process.env.DEVLINK_PORT || process.env.PORT || '3000';
export const INTERNAL_SECRET = crypto.randomUUID();

function createMcpConfig(sessionId: string): string {
	const mcpServerScript = join(process.cwd(), 'src', 'lib', 'server', 'mcp-permission-server.mjs');
	const config = {
		mcpServers: {
			devlink: {
				command: 'node',
				args: [mcpServerScript],
				env: {
					DEVLINK_SESSION_ID: sessionId,
					DEVLINK_PORT: DEVLINK_PORT,
					DEVLINK_INTERNAL_SECRET: INTERNAL_SECRET
				}
			}
		}
	};
	const dir = mkdtempSync(join(tmpdir(), 'devlink-mcp-'));
	const configPath = join(dir, 'mcp.json');
	writeFileSync(configPath, JSON.stringify(config));
	return configPath;
}

export function spawnSession(session: Session, prompt: string, resumeSessionId?: string): void {
	const mcpConfigPath = createMcpConfig(session.id);

	const args = [
		'-p',
		'--output-format',
		'stream-json',
		'--input-format',
		'stream-json',
		'--verbose',
		'--permission-prompt-tool',
		'mcp__devlink__permission_prompt',
		'--mcp-config',
		mcpConfigPath
	];

	if (session.model) {
		args.push('--model', session.model);
	}

	if (resumeSessionId) {
		args.push('--resume', resumeSessionId);
	}

	args.push(prompt);

	let child: ReturnType<typeof spawn>;
	try {
		child = spawn('claude', args, {
			cwd: session.projectPath,
			stdio: ['pipe', 'pipe', 'pipe'],
			env: { ...process.env, CLAUDECODE: undefined }
		});
	} catch (err) {
		try { unlinkSync(mcpConfigPath); } catch {}
		sessionManager.setStatus(session.id, 'error');
		sessionManager.addEvent(session.id, {
			type: 'session_status',
			status: 'error',
			error: err instanceof Error ? err.message : 'Failed to spawn claude'
		});
		return;
	}

	session.process = child;
	sessionManager.setStatus(session.id, 'running');

	// Parse stdout as NDJSON
	const rl = createInterface({ input: child.stdout! });
	rl.on('line', (line) => {
		try {
			const event: StreamEvent = JSON.parse(line);

			// Capture claude session ID from init event
			if (event.type === 'system' && (event as { subtype?: string }).subtype === 'init') {
				session.claudeSessionId = (event as { session_id?: string }).session_id;
			}

			// Capture cost from result events
			if (event.type === 'result') {
				session.totalCost = (event as { total_cost_usd?: number }).total_cost_usd;
			}

			sessionManager.addEvent(session.id, event);
		} catch {
			// Non-JSON line, ignore
		}
	});

	// Capture stderr for debugging
	const stderrRl = createInterface({ input: child.stderr! });
	stderrRl.on('line', (line) => {
		sessionManager.addEvent(session.id, {
			type: 'stderr',
			content: line
		});
	});

	child.on('exit', (code) => {
		sessionManager.setStatus(session.id, code === 0 ? 'idle' : 'error');
		session.process = null;

		// Clean up MCP config
		try {
			unlinkSync(mcpConfigPath);
		} catch {}

		sessionManager.addEvent(session.id, {
			type: 'session_status',
			status: code === 0 ? 'idle' : 'error',
			exitCode: code
		});
	});
}

export function sendMessage(session: Session, message: string): void {
	if (!session.process?.stdin?.writable) return;
	const payload = JSON.stringify({
		type: 'user',
		message: { role: 'user', content: message }
	});
	session.process.stdin.write(payload + '\n');
}

export function stopSession(session: Session): void {
	if (session.process) {
		session.process.kill('SIGINT');
	}
}
