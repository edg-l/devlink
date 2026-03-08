import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generatePairingCode } from '$lib/server/pairing';

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		error(401, 'Unauthorized');
	}

	const code = generatePairingCode();
	return json({ code });
};
