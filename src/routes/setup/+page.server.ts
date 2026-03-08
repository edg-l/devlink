import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const result = await db.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM "user"`);
	if (result && result.count > 0) {
		redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		// Re-check inside action to prevent race
		const check = await db.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM "user"`);
		if (check && check.count > 0) {
			return redirect(303, '/');
		}

		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required' });
		}

		try {
			const result = await auth.api.signUpEmail({
				headers: event.request.headers,
				body: {
					email,
					password,
					name: email.split('@')[0]
				}
			});

			if (!result.token) {
				return fail(400, { message: 'Registration failed' });
			}
		} catch {
			return fail(400, { message: 'Registration failed' });
		}

		redirect(303, '/');
	}
};
