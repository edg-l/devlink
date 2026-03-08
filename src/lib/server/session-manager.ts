import { type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type { PermissionMode } from '$lib/types';
import { log } from './logger';

export type { PermissionMode };

export type SessionStatus = 'starting' | 'running' | 'idle' | 'error';

export interface StreamEvent {
	type: string;
	[key: string]: unknown;
}

export interface Session {
	id: string;
	claudeSessionId?: string;
	projectId: string;
	projectPath: string;
	status: SessionStatus;
	permissionMode: PermissionMode;
	process: ChildProcess | null;
	events: StreamEvent[];
	emitter: EventEmitter;
	model?: string;
	summary?: string;
	createdAt: Date;
	lastActivity: Date;
	totalCost?: number;
	pendingPermission?: {
		resolve: (response: PermissionResponse) => void;
		toolName: string;
		input: Record<string, unknown>;
	};
}

export interface PermissionResponse {
	behavior: 'allow' | 'deny';
	updatedInput?: Record<string, unknown>;
	message?: string;
}

class SessionManager {
	private sessions = new Map<string, Session>();

	create(params: {
		projectId: string;
		projectPath: string;
		permissionMode: PermissionMode;
		model?: string;
	}): Session {
		const id = crypto.randomUUID();
		const session: Session = {
			id,
			projectId: params.projectId,
			projectPath: params.projectPath,
			status: 'starting',
			permissionMode: params.permissionMode,
			process: null,
			events: [],
			emitter: new EventEmitter(),
			model: params.model,
			createdAt: new Date(),
			lastActivity: new Date()
		};
		this.sessions.set(id, session);
		log.sessions.info(
			{
				sessionId: id,
				projectId: params.projectId,
				projectPath: params.projectPath,
				model: params.model,
				mode: params.permissionMode
			},
			'session created'
		);
		return session;
	}

	get(id: string): Session | undefined {
		return this.sessions.get(id);
	}

	getAll(): Session[] {
		return Array.from(this.sessions.values());
	}

	addEvent(sessionId: string, event: StreamEvent): void {
		const session = this.sessions.get(sessionId);
		if (!session) return;
		session.events.push(event);
		session.lastActivity = new Date();
		session.emitter.emit('event', event);
	}

	setStatus(sessionId: string, status: SessionStatus): void {
		const session = this.sessions.get(sessionId);
		if (!session) return;
		const prev = session.status;
		session.status = status;
		log.sessions.info({ sessionId, from: prev, to: status }, 'status changed');
		session.emitter.emit('status', status);
		session.emitter.emit('event', { type: 'session_status', status });
	}

	setModel(sessionId: string, model: string): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			const prev = session.model;
			session.model = model;
			log.sessions.info({ sessionId, from: prev, to: model }, 'model changed');
		}
	}

	setPermissionMode(sessionId: string, mode: PermissionMode): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			const prev = session.permissionMode;
			session.permissionMode = mode;
			log.sessions.info({ sessionId, from: prev, to: mode }, 'permission mode changed');
		}
	}

	setPendingPermission(sessionId: string, pending: Session['pendingPermission']): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.pendingPermission = pending;
			if (pending) {
				log.permissions.info({ sessionId, toolName: pending.toolName }, 'permission pending');
			} else {
				log.permissions.debug({ sessionId }, 'permission cleared');
			}
		}
	}

	resolvePermission(sessionId: string, response: PermissionResponse): boolean {
		const session = this.sessions.get(sessionId);
		if (!session?.pendingPermission) {
			log.permissions.warn({ sessionId }, 'resolvePermission: no pending permission');
			return false;
		}
		log.permissions.info(
			{ sessionId, toolName: session.pendingPermission.toolName, behavior: response.behavior },
			'permission resolved'
		);
		session.pendingPermission.resolve(response);
		session.pendingPermission = undefined;
		return true;
	}

	remove(id: string): void {
		const session = this.sessions.get(id);
		if (session) {
			log.sessions.info({ sessionId: id }, 'session removed');
			session.emitter.removeAllListeners();
			this.sessions.delete(id);
		}
	}
}

export const sessionManager = new SessionManager();
