import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionManager, type PermissionResponse } from '$lib/server/session-manager';
import { INTERNAL_SECRET } from '$lib/server/session-spawn';

const READ_ONLY_TOOLS = new Set(['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch']);
const FILE_TOOLS = new Set(['Read', 'Edit', 'Write', 'Glob', 'Grep']);

export const POST: RequestHandler = async ({ request }) => {
	const secret = request.headers.get('x-devlink-secret');
	if (secret !== INTERNAL_SECRET) {
		return json({ behavior: 'deny', message: 'Unauthorized' }, { status: 401 });
	}

	const { sessionId, toolName, input, reason } = await request.json();

	const session = sessionManager.get(sessionId);
	if (!session) {
		return json({ behavior: 'deny', message: 'Session not found' });
	}

	const mode = session.permissionMode;

	// Plan mode: allow reads, deny everything else
	if (mode === 'plan') {
		if (READ_ONLY_TOOLS.has(toolName)) {
			return json({ behavior: 'allow', updatedInput: input });
		}
		return json({ behavior: 'deny', message: 'Plan mode — read only' });
	}

	// Full auto: allow everything
	if (mode === 'auto') {
		return json({ behavior: 'allow', updatedInput: input });
	}

	// Auto-edit: allow file tools, ask for rest
	if (mode === 'auto-edit') {
		if (FILE_TOOLS.has(toolName)) {
			return json({ behavior: 'allow', updatedInput: input });
		}
		// Fall through to ask the user
	}

	// Ask mode (or auto-edit for non-file tools): push to browser and wait
	const response = await new Promise<PermissionResponse>((resolve) => {
		const timer = setTimeout(() => {
			sessionManager.setPendingPermission(sessionId, undefined);
			resolve({ behavior: 'deny', message: 'Permission request timed out (5 minutes)' });
		}, 5 * 60 * 1000);

		sessionManager.setPendingPermission(sessionId, {
			resolve: (r: PermissionResponse) => {
				clearTimeout(timer);
				resolve(r);
			},
			toolName,
			input,
		});

		// Push permission request to connected clients
		sessionManager.addEvent(sessionId, {
			type: 'permission_request',
			toolName,
			input,
			reason,
		});
	});

	return json(response);
};
