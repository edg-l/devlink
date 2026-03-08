import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionManager } from '$lib/server/session-manager';
import { sendMessage } from '$lib/server/session-spawn';
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

	const { message } = await event.request.json();

	if (!message || typeof message !== 'string') {
		return json({ error: 'message must be a non-empty string' }, { status: 400 });
	}

	log.sessions.info({ sessionId: id, messageLength: message.length }, 'user message sent');
	sendMessage(session, message);

	return json({ ok: true });
};
