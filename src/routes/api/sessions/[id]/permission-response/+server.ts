import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionManager, type PermissionResponse } from '$lib/server/session-manager';
import { log } from '$lib/server/logger';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = event.params;
	const body: PermissionResponse = await event.request.json();

	log.permissions.info({ sessionId: id, behavior: body.behavior }, 'user permission response');
	const resolved = sessionManager.resolvePermission(id, body);
	if (!resolved) {
		return json({ error: 'No pending permission for this session' }, { status: 404 });
	}

	return json({ ok: true });
};
