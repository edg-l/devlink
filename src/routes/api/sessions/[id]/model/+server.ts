import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionManager } from '$lib/server/session-manager';
import { switchModel } from '$lib/server/session-spawn';
import { log } from '$lib/server/logger';

const VALID_MODELS = new Set(['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5']);

export const PATCH: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = event.params;
	const session = sessionManager.get(id);
	if (!session) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	if (!session.process) {
		return json({ error: 'Session has no running process' }, { status: 409 });
	}

	const { model } = (await event.request.json()) as { model: string };
	if (!VALID_MODELS.has(model)) {
		return json({ error: 'Invalid model' }, { status: 400 });
	}

	if (model === session.model) {
		return json({ ok: true, model });
	}

	log.sessions.info({ sessionId: id, from: session.model, to: model }, 'model switch requested');

	try {
		await switchModel(session, model);
		return json({ ok: true, model });
	} catch (err) {
		log.sessions.error({ sessionId: id, err }, 'model switch failed');
		return json(
			{ error: err instanceof Error ? err.message : 'Model switch failed' },
			{ status: 500 }
		);
	}
};
