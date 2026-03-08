import { json } from '@sveltejs/kit';
import { getSessionHistory } from '$lib/server/session-history';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const projectPath = event.url.searchParams.get('projectPath') ?? undefined;
	const sessions = getSessionHistory(projectPath);
	return json(sessions);
};
