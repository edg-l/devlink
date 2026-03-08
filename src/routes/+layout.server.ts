import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const load: LayoutServerLoad = async (event) => {
	const result = await db.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM "user"`);
	if (!result || result.count === 0) {
		const url = event.url;
		if (url.pathname !== '/setup') {
			redirect(303, '/setup');
		}
	}
	return { user: event.locals.user };
};
