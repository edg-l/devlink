<script lang="ts">
	import type { PermissionMode } from '$lib/types';

	interface Project {
		id: string;
		path: string;
		name: string;
	}

	let {
		projects,
		onsubmit
	}: {
		projects: Project[];
		onsubmit?: (params: {
			prompt: string;
			projectId: string;
			model: string;
			permissionMode: PermissionMode;
		}) => void;
	} = $props();

	let prompt = $state('');
	let projectId = $state('');
	let model = $state('claude-sonnet-4-6');
	let permissionMode = $state<PermissionMode>('ask');
	let submitting = $state(false);

	// Keep projectId in sync if projects load after mount
	$effect(() => {
		if (!projectId && projects.length > 0) {
			projectId = projects[0].id;
		}
	});

	const models = [
		{ value: 'claude-opus-4-6', label: 'Opus' },
		{ value: 'claude-sonnet-4-6', label: 'Sonnet' },
		{ value: 'claude-haiku-4-5', label: 'Haiku' }
	];

	const modes: { value: PermissionMode; label: string }[] = [
		{ value: 'plan', label: 'Plan' },
		{ value: 'ask', label: 'Ask' },
		{ value: 'auto-edit', label: 'Auto-Edit' },
		{ value: 'auto', label: 'Auto' }
	];

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	}

	function handleSubmit() {
		if (!prompt.trim() || !projectId || submitting) return;
		submitting = true;
		onsubmit?.({ prompt: prompt.trim(), projectId, model, permissionMode });
		prompt = '';
		submitting = false;
	}

	// Auto-grow textarea
	function autogrow(node: HTMLTextAreaElement) {
		function resize() {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		}
		node.addEventListener('input', resize);
		resize();
		return {
			destroy() {
				node.removeEventListener('input', resize);
			}
		};
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Project picker -->
	<div class="flex flex-col gap-1">
		<label class="text-xs font-medium text-zinc-400" for="project-select">Project</label>
		<select
			id="project-select"
			bind:value={projectId}
			class="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:border-zinc-500 focus:outline-none"
		>
			{#each projects as proj (proj.id)}
				<option value={proj.id}>{proj.name}</option>
			{/each}
			{#if projects.length === 0}
				<option value="" disabled>No projects — add one in sidebar</option>
			{/if}
		</select>
	</div>

	<!-- Model selector -->
	<div class="flex flex-col gap-1">
		<label class="text-xs font-medium text-zinc-400" for="model-select">Model</label>
		<select
			id="model-select"
			bind:value={model}
			class="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:border-zinc-500 focus:outline-none"
		>
			{#each models as m (m.value)}
				<option value={m.value}>{m.label}</option>
			{/each}
		</select>
	</div>

	<!-- Permission mode -->
	<div class="flex flex-col gap-1">
		<span class="text-xs font-medium text-zinc-400">Permission Mode</span>
		<div class="flex rounded border border-zinc-700 bg-zinc-800">
			{#each modes as m, i (m.value)}
				<button
					type="button"
					onclick={() => (permissionMode = m.value)}
					class="flex-1 px-2 py-1.5 text-xs transition-colors
						{permissionMode === m.value ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}
						{i === 0 ? 'rounded-l' : ''}
						{i === modes.length - 1 ? 'rounded-r' : ''}
					">{m.label}</button
				>
			{/each}
		</div>
	</div>

	<!-- Prompt textarea -->
	<div class="flex flex-col gap-1">
		<label class="text-xs font-medium text-zinc-400" for="prompt-input">Prompt</label>
		<textarea
			id="prompt-input"
			bind:value={prompt}
			use:autogrow
			onkeydown={handleKeydown}
			placeholder="What should Claude do? (Ctrl+Enter to submit)"
			rows="3"
			class="min-h-[72px] w-full resize-none rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
		></textarea>
	</div>

	<!-- Start button -->
	<button
		type="button"
		onclick={handleSubmit}
		disabled={!prompt.trim() || !projectId || submitting}
		class="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40"
	>
		{submitting ? 'Starting…' : 'Start Session'}
	</button>
</div>
