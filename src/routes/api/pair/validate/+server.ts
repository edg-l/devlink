import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validatePairingCode } from '$lib/server/pairing';
import { db } from '$lib/server/db';
import { pairedDevice } from '$lib/server/db/schema';

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json();
	const code: string = body?.code ?? '';
	const deviceName: string = body?.deviceName ?? 'Unknown Device';

	if (!code) {
		error(400, 'Missing code');
	}

	const valid = validatePairingCode(code);
	if (!valid) {
		error(400, 'Invalid or expired pairing code');
	}

	const device = await db.insert(pairedDevice).values({ name: deviceName }).returning();

	return json({ success: true, device: device[0] });
};
