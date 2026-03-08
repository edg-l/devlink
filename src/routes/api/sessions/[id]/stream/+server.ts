import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionManager } from '$lib/server/session-manager';
import { sseResponse } from '$lib/server/sse';
import { log } from '$lib/server/logger';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = event.params;
	const session = sessionManager.get(id);
	if (!session) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	log.sse.info({ sessionId: id, bufferedEvents: session.events.length }, 'SSE client connected');

	return sseResponse(event, (send) => {
		// Replay buffered events
		for (const buffered of session.events) {
			send(buffered.type, buffered);
		}

		// Stream new events until client disconnects
		return new Promise<void>((resolve) => {
			const onEvent = (ev: { type: string; [key: string]: unknown }) => {
				send(ev.type, ev);
			};

			session.emitter.on('event', onEvent);

			event.request.signal.addEventListener('abort', () => {
				log.sse.info({ sessionId: id }, 'SSE client disconnected');
				session.emitter.off('event', onEvent);
				resolve();
			});
		});
	});
};
