import type { RequestEvent } from '@sveltejs/kit';

export function sseResponse(
	event: RequestEvent,
	generator: (send: (event: string, data: unknown) => void) => void | Promise<void>
): Response {
	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();
			let closed = false;
			const send = (eventType: string, data: unknown) => {
				if (closed) return;
				try {
					controller.enqueue(
						encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`)
					);
				} catch {
					closed = true;
				}
			};
			Promise.resolve(generator(send))
				.catch(() => {})
				.finally(() => {
					closed = true;
					try {
						controller.close();
					} catch {}
				});
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
}
