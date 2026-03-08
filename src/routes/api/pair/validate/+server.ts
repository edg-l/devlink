import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validatePairingCode } from '$lib/server/pairing';
import { db } from '$lib/server/db';
import { pairedDevice } from '$lib/server/db/schema';
import { log } from '$lib/server/logger';

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json();
	const code: string = body?.code ?? '';
	const deviceName: string = body?.deviceName ?? 'Unknown Device';

	if (!code) {
		error(400, 'Missing code');
	}

	const valid = validatePairingCode(code);
	if (!valid) {
		log.pairing.warn({ deviceName }, 'pairing validation failed');
		error(400, 'Invalid or expired pairing code');
	}

	const device = await db.insert(pairedDevice).values({ name: deviceName }).returning();
	log.pairing.info({ deviceId: device[0].id, deviceName }, 'device paired');

	return json({ success: true, device: device[0] });
};
