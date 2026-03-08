import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = event.params;

	await db.delete(project).where(eq(project.id, id));

	return new Response(null, { status: 204 });
};
