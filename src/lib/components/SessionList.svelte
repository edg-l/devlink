<script lang="ts">
	import { untrack } from 'svelte';

	interface ActiveSession {
		id: string;
		projectId: string;
		projectPath: string;
		status: string;
		permissionMode: string;
		model?: string;
		summary?: string;
		createdAt: string;
		lastActivity: string;
		totalCost?: number;
	}

	interface HistoricalSession {
		sessionId: string;
		claudeSessionId?: string;
		projectPath: string;
		model?: string;
		status: string;
		totalCost?: number | null;
		createdAt: string;
		endedAt: string;
		summary: string;
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
				return 'bg-status-ok';
			case 'error':
				return 'bg-status-error';
			default:
				return 'bg-fg-muted';
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

	interface ProjectGroup {
		projectPath: string;
		activeSessions: ActiveSession[];
		historicalSessions: HistoricalSession[];
		hasActive: boolean;
	}

	let groups = $derived.by(() => {
		const map = new Map<string, ProjectGroup>();

		for (const s of activeSessions) {
			const key = s.projectPath;
			if (!map.has(key)) {
				map.set(key, {
					projectPath: key,
					activeSessions: [],
					historicalSessions: [],
					hasActive: false
				});
			}
			const g = map.get(key)!;
			g.activeSessions.push(s);
			g.hasActive = true;
		}

		for (const s of historicalSessions) {
			const key = s.projectPath;
			if (!map.has(key)) {
				map.set(key, {
					projectPath: key,
					activeSessions: [],
					historicalSessions: [],
					hasActive: false
				});
			}
			map.get(key)!.historicalSessions.push(s);
		}

		return [...map.values()].sort((a, b) => {
			if (a.hasActive !== b.hasActive) return a.hasActive ? -1 : 1;
			return a.projectPath.localeCompare(b.projectPath);
		});
	});

	// Track open/closed state per project; active projects auto-open but user toggles are preserved
	let openProjects = $state<Set<string>>(new Set());
	let seenProjects = new Set<string>();

	// Only auto-open NEW active projects, never reset user's manual toggles
	$effect(() => {
		// Read groups (reactive dependency)
		const currentGroups = groups;
		// Don't track openProjects reads to avoid circular dependency
		untrack(() => {
			let changed = false;
			for (const g of currentGroups) {
				if (g.hasActive && !seenProjects.has(g.projectPath)) {
					changed = true;
				}
				seenProjects.add(g.projectPath);
			}
			if (changed) {
				const next = new Set(openProjects);
				for (const g of currentGroups) {
					if (g.hasActive) next.add(g.projectPath);
				}
				openProjects = next;
			}
		});
	});

	function toggleProject(path: string) {
		const next = new Set(openProjects);
		if (next.has(path)) {
			next.delete(path);
		} else {
			next.add(path);
		}
		openProjects = next;
	}
</script>

<div class="flex flex-col">
	{#if groups.length === 0}
		<p class="px-3 py-4 text-xs text-fg-faint">No sessions yet</p>
	{:else}
		{#each groups as group (group.projectPath)}
			{@const isOpen = openProjects.has(group.projectPath)}
			{@const total = group.activeSessions.length + group.historicalSessions.length}
			<button
				class="flex w-full items-center gap-2 px-3 pt-3 pb-1 text-left"
				onclick={() => toggleProject(group.projectPath)}
			>
				<span class="text-xs text-fg-muted transition-transform {isOpen ? 'rotate-90' : ''}"
					>&#9656;</span
				>
				<p class="truncate text-xs font-semibold tracking-wider text-fg-muted uppercase">
					{projectName(group.projectPath)}
					<span class="font-normal">({total})</span>
				</p>
			</button>

			{#if isOpen}
				{#each group.activeSessions as session (session.id)}
					<button
						class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-bg-overlay"
						onclick={() => onselect?.(session.id)}
					>
						<span class="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full {statusDotClass(session.status)}"
						></span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm text-fg">
								{session.summary || 'Session'}
							</span>
							<span class="flex gap-2 text-xs text-fg-muted">
								<span>{elapsed(session.lastActivity)}</span>
								<span>{session.status}</span>
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

				{#each group.historicalSessions as session (session.sessionId)}
					<button
						class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-bg-overlay"
						onclick={() => onselect?.(session.sessionId)}
					>
						<span
							class="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full {session.status === 'error'
								? 'bg-status-error'
								: 'bg-fg-faint'}"
						></span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm text-fg">
								{session.summary || 'Session'}
							</span>
							<span class="flex gap-2 text-xs text-fg-muted">
								<span>{formatDate(session.createdAt)}</span>
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
		{/each}
	{/if}
</div>
