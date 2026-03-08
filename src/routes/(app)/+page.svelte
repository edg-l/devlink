<script lang="ts">
	import { goto } from '$app/navigation';
	import NewSessionForm from '$lib/components/NewSessionForm.svelte';

	interface Project {
		id: string;
		path: string;
		name: string;
	}

	let projects = $state<Project[]>([]);
	let loading = $state(true);
	let error = $state('');

	async function loadProjects() {
		try {
			const res = await fetch('/api/projects');
			if (res.ok) projects = await res.json();
		} catch {
			// Ignore
		} finally {
			loading = false;
		}
	}

	async function handleSubmit(params: {
		prompt: string;
		projectId: string;
		model: string;
		permissionMode: string;
	}) {
		error = '';
		try {
			const res = await fetch('/api/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(params)
			});
			if (res.ok) {
				const session = await res.json();
				goto(`/session/${session.id}`);
			} else {
				const data = await res.json();
				error = data.error ?? 'Failed to create session';
			}
		} catch {
			error = 'Network error';
		}
	}

	$effect(() => {
		loadProjects();
	});
</script>

<div class="flex h-full flex-col items-center justify-center px-4">
	<div class="w-full max-w-md">
		<h2 class="mb-6 text-2xl font-bold text-zinc-100">New Session</h2>

		{#if loading}
			<p class="text-sm text-zinc-500">Loading projects…</p>
		{:else}
			<NewSessionForm {projects} onsubmit={handleSubmit} />
			{#if error}
				<p class="mt-3 text-sm text-red-400">{error}</p>
			{/if}
		{/if}
	</div>
</div>
