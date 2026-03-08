<script lang="ts">
	interface Project {
		id: string;
		path: string;
		name: string;
	}

	let {
		projects,
		onchange
	}: {
		projects: Project[];
		onchange?: (projects: Project[]) => void;
	} = $props();

	let showAddForm = $state(false);
	let newPath = $state('');
	let newName = $state('');
	let adding = $state(false);
	let error = $state('');

	async function addProject() {
		if (!newPath.trim()) return;
		adding = true;
		error = '';
		try {
			const res = await fetch('/api/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ path: newPath.trim(), name: newName.trim() || undefined })
			});
			if (!res.ok) {
				const data = await res.json();
				error = data.error ?? 'Failed to add project';
			} else {
				const created: Project = await res.json();
				onchange?.([...projects, created]);
				newPath = '';
				newName = '';
				showAddForm = false;
			}
		} catch {
			error = 'Network error';
		} finally {
			adding = false;
		}
	}
</script>

<div class="flex flex-col gap-1">
	<div class="flex items-center justify-between px-1 py-1">
		<p class="text-xs font-semibold tracking-wider text-fg-muted uppercase">Projects</p>
		<button
			onclick={() => (showAddForm = !showAddForm)}
			class="text-xs text-fg-muted hover:text-fg"
			title="Add project"
		>
			{showAddForm ? '✕' : '＋'}
		</button>
	</div>

	{#each projects as proj (proj.id)}
		<div class="flex items-center gap-2 rounded px-2 py-1 text-sm text-fg-muted">
			<span class="text-xs">📁</span>
			<span class="truncate">{proj.name}</span>
		</div>
	{/each}

	{#if projects.length === 0 && !showAddForm}
		<p class="px-2 py-1 text-xs text-fg-faint">No projects added</p>
	{/if}

	{#if showAddForm}
		<div class="mt-1 flex flex-col gap-1 px-1">
			<input
				type="text"
				bind:value={newPath}
				placeholder="/absolute/path"
				class="w-full rounded border border-border bg-bg-overlay px-2 py-1 text-xs text-fg placeholder-fg-faint focus:border-border-active focus:outline-none"
			/>
			<input
				type="text"
				bind:value={newName}
				placeholder="Name (optional)"
				class="w-full rounded border border-border bg-bg-overlay px-2 py-1 text-xs text-fg placeholder-fg-faint focus:border-border-active focus:outline-none"
			/>
			{#if error}
				<p class="text-xs text-status-error">{error}</p>
			{/if}
			<button
				onclick={addProject}
				disabled={adding || !newPath.trim()}
				class="rounded bg-btn-secondary-bg px-2 py-1 text-xs text-fg hover:bg-bg-active disabled:opacity-50"
			>
				{adding ? 'Adding…' : 'Add'}
			</button>
		</div>
	{/if}
</div>
