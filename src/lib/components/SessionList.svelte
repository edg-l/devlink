<script lang="ts">
	interface ActiveSession {
		id: string;
		projectId: string;
		projectPath: string;
		status: string;
		permissionMode: string;
		model?: string;
		createdAt: string;
		lastActivity: string;
		totalCost?: number;
	}

	interface HistoricalSession {
		sessionId: string;
		firstPrompt: string;
		summary: string;
		messageCount: number;
		created: string;
		modified: string;
		gitBranch: string;
		projectPath: string;
	}

	let {
		activeSessions,
		historicalSessions,
		onselect
	}: {
		activeSessions: ActiveSession[];
		historicalSessions: HistoricalSession[];
		onselect?: (sessionId: string) => void;
	} = $props();

	function statusDotClass(status: string): string {
		switch (status) {
			case 'running':
			case 'starting':
				return 'bg-green-400';
			case 'error':
				return 'bg-red-400';
			default:
				return 'bg-zinc-500';
		}
	}

	function elapsed(dateStr: string): string {
		const ms = Date.now() - new Date(dateStr).getTime();
		const s = Math.floor(ms / 1000);
		if (s < 60) return `${s}s`;
		const m = Math.floor(s / 60);
		if (m < 60) return `${m}m`;
		const h = Math.floor(m / 60);
		return `${h}h`;
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		const days = Math.floor(diff / 86400000);
		if (days === 0) return 'today';
		if (days === 1) return 'yesterday';
		if (days < 7) return `${days}d ago`;
		return d.toLocaleDateString();
	}

	function formatCost(cost?: number): string {
		if (cost == null || cost === 0) return '';
		return `$${cost.toFixed(4)}`;
	}

	function projectName(path: string): string {
		return path.split('/').filter(Boolean).pop() ?? path;
	}
</script>

<div class="flex flex-col">
	<!-- Active Sessions -->
	{#if activeSessions.length > 0}
		<div class="px-3 pt-3 pb-1">
			<p class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Active</p>
		</div>
		{#each activeSessions as session (session.id)}
			<button
				class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800"
				onclick={() => onselect?.(session.id)}
			>
				<span class="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full {statusDotClass(session.status)}"
				></span>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm text-zinc-200">
						{projectName(session.projectPath)}
					</span>
					<span class="flex gap-2 text-xs text-zinc-500">
						<span>{elapsed(session.lastActivity)}</span>
						{#if session.totalCost}
							<span>{formatCost(session.totalCost)}</span>
						{/if}
						{#if session.model}
							<span class="truncate">{session.model.split('-')[0]}</span>
						{/if}
					</span>
				</span>
			</button>
		{/each}
	{/if}

	<!-- Historical Sessions -->
	{#if historicalSessions.length > 0}
		<div class="px-3 pt-3 pb-1">
			<p class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">History</p>
		</div>
		{#each historicalSessions as session (session.sessionId)}
			<button
				class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-800"
				onclick={() => onselect?.(session.sessionId)}
			>
				<span class="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-zinc-600"></span>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm text-zinc-300">
						{session.summary || session.firstPrompt || 'Session'}
					</span>
					<span class="flex gap-2 text-xs text-zinc-500">
						<span>{formatDate(session.modified)}</span>
						{#if session.gitBranch}
							<span class="truncate">{session.gitBranch}</span>
						{/if}
					</span>
				</span>
			</button>
		{/each}
	{/if}

	{#if activeSessions.length === 0 && historicalSessions.length === 0}
		<p class="px-3 py-4 text-xs text-zinc-600">No sessions yet</p>
	{/if}
</div>
