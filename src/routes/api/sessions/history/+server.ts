import { json } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { claudeSession as session } from '$lib/server/db/schema';
import { log } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const projectPath = event.url.searchParams.get('projectPath') ?? undefined;

	let query = db.select().from(session).orderBy(desc(session.createdAt));
	if (projectPath) {
		query = query.where(eq(session.projectPath, projectPath)) as typeof query;
	}

	const sessions = query.all().map((s) => ({
		sessionId: s.id,
		claudeSessionId: s.claudeSessionId,
		projectPath: s.projectPath,
		model: s.model,
		status: s.status,
		totalCost: s.totalCost ? s.totalCost / 10000 : null,
		createdAt: s.createdAt?.toISOString() ?? '',
		endedAt: s.endedAt?.toISOString() ?? '',
		summary: s.summary ?? ''
	}));

	log.history.debug({ count: sessions.length, projectPath }, 'history request served');
	return json(sessions);
};
