<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { connectSSE } from '$lib/client/sse';
	import { parseEvent, mergeToolResults, type Block } from '$lib/client/event-parser';
	import StreamView from '$lib/components/stream/StreamView.svelte';
	import PermissionModeToggle from '$lib/components/PermissionModeToggle.svelte';
	import type { PermissionMode } from '$lib/types';

	let sessionId = $derived($page.params.id ?? '');

	// Session metadata
	interface SessionMeta {
		id: string;
		projectPath: string;
		status: string;
		permissionMode: PermissionMode;
		model?: string;
		createdAt: string;
		lastActivity: string;
		totalCost?: number;
	}

	interface PendingPermission {
		toolName: string;
		input: Record<string, unknown>;
	}

	let sessionMeta = $state<SessionMeta | null>(null);
	let blocks = $state<Block[]>([]);
	let rawBlocks: Block[] = [];
	let pendingPermission = $state<PendingPermission | null>(null);
	let status = $state<string>('connecting');

	// Prompt input
	let promptText = $state('');
	let sending = $state(false);

	// Latest result block for status bar
	let lastResult = $derived(
		[...blocks].reverse().find((b) => b.type === 'result') as
			| Extract<Block, { type: 'result' }>
			| undefined
	);

	// Ticking clock for elapsed time display
	let now = $state(Date.now());

	// Session elapsed time
	let elapsedDisplay = $derived.by(() => {
		if (!sessionMeta) return '';
		const ms = now - new Date(sessionMeta.createdAt).getTime();
		const s = Math.floor(ms / 1000);
		if (s < 60) return `${s}s`;
		const m = Math.floor(s / 60);
		if (m < 60) return `${m}m`;
		return `${Math.floor(m / 60)}h${m % 60}m`;
	});

	let sseClose: (() => void) | null = null;

	function addRawBlocks(newBlocks: Block[]) {
		rawBlocks = [...rawBlocks, ...newBlocks];
		blocks = mergeToolResults(rawBlocks);
	}

	function connectStream() {
		status = 'connecting';
		sseClose?.();

		const conn = connectSSE(`/api/sessions/${sessionId}/stream`, {
			onOpen: () => {
				status = sessionMeta?.status ?? 'connected';
			},
			onError: () => {
				status = 'error';
				// Reconnect after 3 seconds
				setTimeout(connectStream, 3000);
			},
			onEvent: (type, data) => {
				const event = { type, ...(data as Record<string, unknown>) };

				// Handle permission requests from SSE
				if (type === 'permission_request') {
					const d = data as { toolName?: string; input?: Record<string, unknown> };
					pendingPermission = {
						toolName: d.toolName ?? '',
						input: d.input ?? {}
					};
					return;
				}

				// Handle session status updates
				if (type === 'session_status') {
					const d = data as { status?: string };
					if (d.status) status = d.status;
					return;
				}

				const parsed = parseEvent(event);
				if (parsed.length > 0) {
					addRawBlocks(parsed);
				}

				// Clear pending permission after result
				if (type === 'result') {
					pendingPermission = null;
				}
			}
		});

		sseClose = conn.close;
	}

	async function loadSession() {
		try {
			const res = await fetch('/api/sessions');
			if (res.ok) {
				const sessions: SessionMeta[] = await res.json();
				sessionMeta = sessions.find((s) => s.id === sessionId) ?? null;
				if (sessionMeta) status = sessionMeta.status;
			}
		} catch {
			// Ignore
		}
	}

	async function sendMessage() {
		if (!promptText.trim() || sending) return;
		const msg = promptText.trim();
		promptText = '';
		sending = true;
		try {
			await fetch(`/api/sessions/${sessionId}/message`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: msg })
			});
		} catch {
			// Ignore
		} finally {
			sending = false;
		}
	}

	async function stopSession() {
		try {
			await fetch(`/api/sessions/${sessionId}/stop`, { method: 'POST' });
		} catch {
			// Ignore
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			sendMessage();
		}
	}

	function handleModeChange(newMode: PermissionMode) {
		if (sessionMeta) sessionMeta = { ...sessionMeta, permissionMode: newMode };
	}

	// Auto-grow textarea
	function autogrow(node: HTMLTextAreaElement) {
		function resize() {
			node.style.height = 'auto';
			node.style.height = Math.min(node.scrollHeight, 200) + 'px';
		}
		node.addEventListener('input', resize);
		resize();
		return {
			destroy() {
				node.removeEventListener('input', resize);
			}
		};
	}

	onMount(() => {
		loadSession();
		const ticker = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => {
			sseClose?.();
			clearInterval(ticker);
		};
	});

	// React to sessionId changes (navigation between sessions)
	$effect(() => {
		const id = sessionId;
		if (id) {
			rawBlocks = [];
			blocks = [];
			pendingPermission = null;
			loadSession().then(() => connectStream());
		}
		return () => {
			sseClose?.();
		};
	});
</script>

<div class="flex h-full flex-col">
	<!-- Session header -->
	<div class="flex flex-shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3">
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<span
					class="h-2 w-2 flex-shrink-0 rounded-full
					{status === 'running' || status === 'starting'
						? 'bg-green-400'
						: status === 'error'
							? 'bg-red-400'
							: 'bg-zinc-500'}
				"
				></span>
				<span class="truncate text-sm font-medium text-zinc-200">
					{sessionMeta?.projectPath?.split('/').filter(Boolean).pop() ?? sessionId}
				</span>
				{#if sessionMeta?.model}
					<span class="text-xs text-zinc-500">{sessionMeta.model}</span>
				{/if}
				<span class="text-xs text-zinc-600">{elapsedDisplay}</span>
			</div>
			{#if sessionMeta?.projectPath}
				<p class="mt-0.5 truncate text-xs text-zinc-600">{sessionMeta.projectPath}</p>
			{/if}
		</div>

		<!-- Permission mode toggle -->
		{#if sessionMeta}
			<div class="flex-shrink-0">
				<PermissionModeToggle
					mode={sessionMeta.permissionMode}
					{sessionId}
					onchange={handleModeChange}
				/>
			</div>
		{/if}
	</div>

	<!-- Stream area -->
	<div class="min-h-0 flex-1">
		<StreamView {blocks} {sessionId} {pendingPermission} />
	</div>

	<!-- Status bar -->
	<div
		class="flex flex-shrink-0 items-center gap-4 border-t border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-500"
	>
		<span>status: {status}</span>
		{#if lastResult}
			<span>cost: ${lastResult.totalCostUsd.toFixed(4)}</span>
			<span>
				tokens: {(lastResult.usage.inputTokens + lastResult.usage.outputTokens).toLocaleString()}
			</span>
			<span>time: {(lastResult.durationMs / 1000).toFixed(1)}s</span>
		{/if}
		<div class="ml-auto">
			<button
				onclick={stopSession}
				disabled={status !== 'running' && status !== 'starting'}
				class="rounded border border-red-700 px-2 py-0.5 text-xs text-red-400 hover:bg-red-950 disabled:opacity-30"
				>Stop</button
			>
		</div>
	</div>

	<!-- Prompt input bar -->
	<div class="flex flex-shrink-0 items-end gap-2 border-t border-zinc-800 bg-zinc-900 px-4 py-3">
		<textarea
			bind:value={promptText}
			use:autogrow
			onkeydown={handleKeydown}
			placeholder="Send a message… (Ctrl+Enter to send)"
			rows="1"
			class="min-h-[36px] flex-1 resize-none rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
		></textarea>
		<button
			onclick={sendMessage}
			disabled={!promptText.trim() || sending}
			class="flex-shrink-0 rounded bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40"
		>
			{sending ? '…' : 'Send'}
		</button>
	</div>
</div>
