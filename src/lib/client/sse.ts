export type SSEHandler = {
	onEvent: (type: string, data: unknown) => void;
	onError?: (error: Event) => void;
	onOpen?: () => void;
};

// Common event types emitted by the claude CLI stream-json format
const EVENT_TYPES = [
	'system',
	'assistant',
	'user',
	'user_text',
	'result',
	'rate_limit_event',
	'permission_request',
	'session_status',
	'error',
	'stderr'
];

export function connectSSE(url: string, handler: SSEHandler): { close: () => void } {
	const es = new EventSource(url);

	es.onopen = () => handler.onOpen?.();
	es.onerror = (e) => handler.onError?.(e);

	for (const type of EVENT_TYPES) {
		es.addEventListener(type, (e: MessageEvent) => {
			try {
				handler.onEvent(type, JSON.parse(e.data));
			} catch {}
		});
	}

	return {
		close: () => es.close()
	};
}
