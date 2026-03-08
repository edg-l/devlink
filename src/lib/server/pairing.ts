import { log } from './logger';

interface PairingCode {
	code: string;
	expiresAt: Date;
	used: boolean;
}

const activeCodes = new Map<string, PairingCode>();

export function generatePairingCode(): string {
	// Clean expired codes
	for (const [code, data] of activeCodes) {
		if (data.expiresAt < new Date() || data.used) activeCodes.delete(code);
	}

	const code = String(Math.floor(100000 + Math.random() * 900000));
	activeCodes.set(code, {
		code,
		expiresAt: new Date(Date.now() + 5 * 60 * 1000),
		used: false
	});
	log.pairing.info('pairing code generated');
	return code;
}

export function validatePairingCode(code: string): boolean {
	const data = activeCodes.get(code);
	if (!data || data.used || data.expiresAt < new Date()) {
		log.pairing.warn({ expired: !!data?.used, notFound: !data }, 'pairing code validation failed');
		return false;
	}
	data.used = true;
	log.pairing.info('pairing code validated');
	return true;
}
