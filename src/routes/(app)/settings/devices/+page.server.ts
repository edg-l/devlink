import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { pairedDevice } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const devices = await db.select().from(pairedDevice).orderBy(pairedDevice.pairedAt);
	return { devices };
};

export const actions: Actions = {
	revoke: async (event) => {
		const formData = await event.request.formData();
		const id = formData.get('id')?.toString() ?? '';

		if (!id) {
			return fail(400, { message: 'Device ID is required' });
		}

		await db.delete(pairedDevice).where(eq(pairedDevice.id, id));
		return { success: true };
	}
};
