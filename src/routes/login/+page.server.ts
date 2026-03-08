import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required' });
		}

		try {
			const result = await auth.api.signInEmail({
				headers: event.request.headers,
				body: { email, password }
			});

			if (!result.token) {
				return fail(400, { message: 'Invalid email or password' });
			}
		} catch {
			return fail(400, { message: 'Invalid email or password' });
		}

		redirect(303, '/');
	}
};
