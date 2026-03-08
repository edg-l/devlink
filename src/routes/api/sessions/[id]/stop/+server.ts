import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionManager } from '$lib/server/session-manager';
import { stopSession } from '$lib/server/session-spawn';
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

	log.sessions.info({ sessionId: id }, 'stop requested');
	stopSession(session);

	return json({ ok: true });
};
