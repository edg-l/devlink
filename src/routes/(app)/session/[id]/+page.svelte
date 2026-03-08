<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
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
	let mode = $state<'active' | 'history'>('active');
	let historyProjectPath = $state('');
	let historyClaudeSessionId = $state('');

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
				// Don't retry if we're in history mode or session doesn't exist
				if (mode === 'history') return;
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
				const found = sessions.find((s) => s.id === sessionId);
				if (found) {
					sessionMeta = found;
					status = found.status;
					mode = 'active';
					return;
				}
			}
		} catch {
			// Ignore
		}

		// Not found in active sessions — try history DB
		try {
			const res = await fetch(`/api/sessions/${sessionId}/history`);
			if (res.ok) {
				const data = (await res.json()) as {
					sessionId: string;
					claudeSessionId?: string;
					projectPath: string;
					model?: string;
					status: string;
					totalCost?: number | null;
					createdAt: string;
					endedAt: string;
				};
				mode = 'history';
				status = 'history';
				historyProjectPath = data.projectPath;
				historyClaudeSessionId = data.claudeSessionId ?? '';
				sessionMeta = {
					id: sessionId,
					projectPath: data.projectPath,
					status: 'history',
					permissionMode: 'ask',
					model: data.model,
					createdAt: data.createdAt,
					lastActivity: data.endedAt || data.createdAt,
					totalCost: data.totalCost ?? undefined
				};
				return;
			}
		} catch {
			// Ignore
		}

		// Neither active nor history — mark as not found
		mode = 'history';
		status = 'not-found';
	}

	async function sendMessage() {
		if (!promptText.trim() || sending) return;
		const msg = promptText.trim();
		promptText = '';
		sending = true;

		// Show user message in the stream immediately
		addRawBlocks([
			{
				id: `block-user-${Date.now()}`,
				type: 'user-message',
				timestamp: new Date(),
				content: msg
			}
		]);

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

	async function resumeSession() {
		const prompt = promptText.trim();

		// Find the projectId matching the historyProjectPath
		let projectId = '';
		try {
			const res = await fetch('/api/projects');
			if (res.ok) {
				const projects = (await res.json()) as Array<{ id: string; path: string }>;
				const match = projects.find((p) => p.path === historyProjectPath);
				if (match) projectId = match.id;
			}
		} catch {
			// Ignore
		}

		if (!projectId) return;

		try {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					prompt: prompt || undefined,
					projectId,
					resume: historyClaudeSessionId || sessionId
				})
			});
			if (res.ok) {
				const newSession = (await res.json()) as { id: string };
				goto(`/session/${newSession.id}`);
			}
		} catch {
			// Ignore
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (mode === 'history') {
				resumeSession();
			} else {
				sendMessage();
			}
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
			mode = 'active';
			loadSession().then(() => {
				if (mode === 'active') connectStream();
			});
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
							: status === 'history'
								? 'bg-zinc-600'
								: 'bg-zinc-500'}
				"
				></span>
				<span class="truncate text-sm font-medium text-zinc-200">
					{sessionMeta?.projectPath?.split('/').filter(Boolean).pop() ?? sessionId}
				</span>
				{#if sessionMeta?.model}
					<span class="text-xs text-zinc-500">{sessionMeta.model}</span>
				{/if}
				{#if mode === 'active'}
					<span class="text-xs text-zinc-600">{elapsedDisplay}</span>
				{/if}
			</div>
			{#if sessionMeta?.projectPath}
				<p class="mt-0.5 truncate text-xs text-zinc-600">{sessionMeta.projectPath}</p>
			{/if}
		</div>

		{#if mode === 'history'}
			<button
				onclick={resumeSession}
				class="flex-shrink-0 rounded border border-zinc-600 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
			>
				Resume
			</button>
		{/if}

		<!-- Permission mode toggle (active sessions only) -->
		{#if sessionMeta && mode === 'active'}
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
	<div class="min-h-0 flex-1 overflow-y-auto">
		<StreamView {blocks} {sessionId} {pendingPermission} />
	</div>

	<!-- Status bar -->
	<div
		class="flex flex-shrink-0 items-center gap-4 border-t border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-500"
	>
		<span>status: {status}</span>
		{#if lastResult}
			{@const totalTokens = lastResult.usage.inputTokens + lastResult.usage.outputTokens}
			{@const ctxPercent = Math.round((lastResult.usage.inputTokens / 200000) * 100)}
			<span>context: {ctxPercent}% ({totalTokens.toLocaleString()} tokens)</span>
		{/if}
		{#if mode === 'active'}
			<div class="ml-auto">
				<button
					onclick={stopSession}
					disabled={status !== 'running' && status !== 'starting'}
					class="rounded border border-red-700 px-2 py-0.5 text-xs text-red-400 hover:bg-red-950 disabled:opacity-30"
					>Stop</button
				>
			</div>
		{/if}
	</div>

	<!-- Prompt input bar (active) or resume bar (history) -->
	{#if mode === 'active'}
		<div class="flex flex-shrink-0 items-end gap-2 border-t border-zinc-800 bg-zinc-900 px-4 py-3">
			<textarea
				bind:value={promptText}
				use:autogrow
				onkeydown={handleKeydown}
				placeholder="Send a message… (Shift+Enter for newline)"
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
	{:else}
		<div class="flex flex-shrink-0 items-end gap-2 border-t border-zinc-800 bg-zinc-900 px-4 py-3">
			<textarea
				bind:value={promptText}
				use:autogrow
				onkeydown={handleKeydown}
				placeholder="Optional message to resume with… (Ctrl+Enter)"
				rows="1"
				class="min-h-[36px] flex-1 resize-none rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
			></textarea>
			<button
				onclick={resumeSession}
				class="flex-shrink-0 rounded bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
			>
				Resume
			</button>
		</div>
	{/if}
</div>
