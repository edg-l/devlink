import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionManager, type PermissionMode } from '$lib/server/session-manager';
import { log } from '$lib/server/logger';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = event.params;
	const session = sessionManager.get(id);
	if (!session) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	const { mode } = (await event.request.json()) as { mode: PermissionMode };

	const VALID_MODES = new Set(['plan', 'ask', 'auto-edit', 'auto']);
	if (!VALID_MODES.has(mode)) {
		return json({ error: 'Invalid permission mode' }, { status: 400 });
	}

	log.sessions.info({ sessionId: id, mode }, 'permission mode change requested');
	sessionManager.setPermissionMode(id, mode);

	return json({ ok: true });
};
