import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { claudeSession as session } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = event.params;
	const [row] = db.select().from(session).where(eq(session.id, id)).limit(1).all();

	if (!row) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	let events: unknown[] = [];
	if (row.events) {
		try {
			events = JSON.parse(row.events);
		} catch {
			// ignore malformed events
		}
	}

	return json({
		sessionId: row.id,
		claudeSessionId: row.claudeSessionId,
		projectPath: row.projectPath,
		model: row.model,
		status: row.status,
		totalCost: row.totalCost ? row.totalCost / 10000 : null,
		createdAt: row.createdAt?.toISOString() ?? '',
		endedAt: row.endedAt?.toISOString() ?? '',
		events
	});
};
