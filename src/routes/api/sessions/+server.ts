import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { sessionManager, type PermissionMode } from '$lib/server/session-manager';
import { spawnSession } from '$lib/server/session-spawn';
import { log } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const sessions = sessionManager.getAll().map((s) => ({
		id: s.id,
		claudeSessionId: s.claudeSessionId,
		projectId: s.projectId,
		projectPath: s.projectPath,
		status: s.status,
		permissionMode: s.permissionMode,
		model: s.model,
		summary: s.summary ?? '',
		createdAt: s.createdAt,
		lastActivity: s.lastActivity,
		totalCost: s.totalCost
	}));

	return json(sessions);
};

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await event.request.json();
	const {
		prompt,
		projectId,
		model,
		permissionMode = 'ask',
		resume
	} = body as {
		prompt: string;
		projectId: string;
		model?: string;
		permissionMode?: PermissionMode;
		resume?: string;
	};

	if ((!prompt && !resume) || !projectId) {
		return json({ error: 'prompt and projectId are required' }, { status: 400 });
	}

	const VALID_MODES = new Set(['plan', 'ask', 'auto-edit', 'auto']);
	if (permissionMode && !VALID_MODES.has(permissionMode)) {
		return json({ error: 'Invalid permission mode' }, { status: 400 });
	}

	const [proj] = await db.select().from(project).where(eq(project.id, projectId)).limit(1);
	if (!proj) {
		log.sessions.warn({ projectId }, 'session creation failed: project not found');
		return json({ error: 'Project not found' }, { status: 404 });
	}

	const session = sessionManager.create({
		projectId,
		projectPath: proj.path,
		permissionMode,
		model
	});

	spawnSession(session, prompt, resume);

	return json(
		{
			id: session.id,
			claudeSessionId: session.claudeSessionId,
			projectId: session.projectId,
			projectPath: session.projectPath,
			status: session.status,
			permissionMode: session.permissionMode,
			model: session.model,
			summary: session.summary ?? '',
			createdAt: session.createdAt,
			lastActivity: session.lastActivity,
			totalCost: session.totalCost
		},
		{ status: 201 }
	);
};
