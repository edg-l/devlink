<script lang="ts">
	import SessionList from '$lib/components/SessionList.svelte';
	import ProjectPicker from '$lib/components/ProjectPicker.svelte';
	import { goto } from '$app/navigation';

	let { children, data } = $props();

	let sidebarOpen = $state(false);

	let activeSessions: ActiveSession[] = $state([]);
	let historicalSessions: HistoricalSession[] = $state([]);
	let projects: Project[] = $state([]);

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
		claudeSessionId?: string;
		projectPath: string;
		model?: string;
		status: string;
		totalCost?: number | null;
		createdAt: string;
		endedAt: string;
		summary: string;
	}

	interface Project {
		id: string;
		path: string;
		name: string;
	}

	async function loadSessions() {
		try {
			const [activeRes, historyRes] = await Promise.all([
				fetch('/api/sessions'),
				fetch('/api/sessions/history')
			]);
			if (activeRes.ok) activeSessions = await activeRes.json();
			if (historyRes.ok) {
				const all: HistoricalSession[] = await historyRes.json();
				const activeIds = new Set(activeSessions.map((s) => s.id));
				historicalSessions = all.filter((s) => !activeIds.has(s.sessionId));
			}
		} catch {
			// Silently ignore fetch errors
		}
	}

	async function loadProjects() {
		try {
			const res = await fetch('/api/projects');
			if (res.ok) projects = await res.json();
		} catch {
			// Silently ignore fetch errors
		}
	}

	function handleSessionSelect(sessionId: string) {
		sidebarOpen = false;
		goto(`/session/${sessionId}`);
	}

	function handleProjectsChange(updated: Project[]) {
		projects = updated;
	}

	$effect(() => {
		loadSessions();
		loadProjects();
		// Poll active sessions every 5 seconds
		const interval = setInterval(loadSessions, 5000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex h-screen bg-zinc-950 text-zinc-100">
	<!-- Desktop Sidebar -->
	<aside
		class="hidden w-72 flex-shrink-0 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-900 lg:flex"
	>
		<div class="border-b border-zinc-800 p-4">
			<a href="/" class="text-lg font-bold tracking-tight hover:text-white">DEVLINK</a>
		</div>
		<div class="flex min-h-0 flex-1 flex-col">
			<div class="flex-1 overflow-y-auto">
				<SessionList {activeSessions} {historicalSessions} onselect={handleSessionSelect} />
			</div>
			<div class="border-t border-zinc-800 p-2">
				<ProjectPicker {projects} onchange={handleProjectsChange} />
			</div>
		</div>
	</aside>

	<!-- Mobile sidebar overlay -->
	{#if sidebarOpen}
		<div class="fixed inset-0 z-40 lg:hidden">
			<button
				class="absolute inset-0 bg-black/50"
				onclick={() => (sidebarOpen = false)}
				onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
				aria-label="Close sidebar"
				type="button"
			></button>
			<aside class="relative z-50 flex h-full w-72 flex-col overflow-y-auto bg-zinc-900">
				<div class="flex items-center justify-between border-b border-zinc-800 p-4">
					<a href="/" class="text-lg font-bold tracking-tight hover:text-white">DEVLINK</a>
					<button
						onclick={() => (sidebarOpen = false)}
						class="text-zinc-400 hover:text-zinc-200"
						aria-label="Close">✕</button
					>
				</div>
				<div class="flex min-h-0 flex-1 flex-col">
					<div class="flex-1 overflow-y-auto">
						<SessionList {activeSessions} {historicalSessions} onselect={handleSessionSelect} />
					</div>
					<div class="border-t border-zinc-800 p-2">
						<ProjectPicker {projects} onchange={handleProjectsChange} />
					</div>
				</div>
			</aside>
		</div>
	{/if}

	<!-- Main content -->
	<main class="flex flex-1 flex-col overflow-hidden">
		<!-- Mobile header -->
		<div class="flex items-center border-b border-zinc-800 bg-zinc-900 p-3 lg:hidden">
			<button
				onclick={() => (sidebarOpen = true)}
				class="mr-3 text-zinc-400 hover:text-zinc-200"
				aria-label="Open sidebar">☰</button
			>
			<span class="font-bold">DEVLINK</span>
		</div>
		{@render children()}
	</main>
</div>
