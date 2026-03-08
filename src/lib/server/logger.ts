import pino from 'pino';

export const logger = pino({
	level: process.env.LOG_LEVEL || 'info',
	transport:
		process.env.NODE_ENV !== 'production'
			? { target: 'pino-pretty', options: { colorize: true } }
			: undefined
});

export const auth = logger.child({ module: 'auth' });
export const sessions = logger.child({ module: 'sessions' });
export const spawn = logger.child({ module: 'spawn' });
export const permissions = logger.child({ module: 'permissions' });
export const projects = logger.child({ module: 'projects' });
export const pairing = logger.child({ module: 'pairing' });
export const history = logger.child({ module: 'history' });
export const sse = logger.child({ module: 'sse' });

export const log = {
	auth,
	sessions,
	spawn,
	permissions,
	projects,
	pairing,
	history,
	sse
};
