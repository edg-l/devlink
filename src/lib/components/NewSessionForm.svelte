<script lang="ts">
	import type { PermissionMode } from '$lib/types';
	import { models, defaultModel } from '$lib/models';

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
	let model = $state(defaultModel);
	let permissionMode = $state<PermissionMode>('ask');
	let submitting = $state(false);

	// Keep projectId in sync if projects load after mount
	$effect(() => {
		if (!projectId && projects.length > 0) {
			projectId = projects[0].id;
		}
	});

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
		<label class="text-xs font-medium text-fg-muted" for="project-select">Project</label>
		<select
			id="project-select"
			bind:value={projectId}
			class="rounded border border-border bg-bg-overlay px-2 py-1.5 text-sm text-fg focus:border-border-active focus:outline-none"
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
		<label class="text-xs font-medium text-fg-muted" for="model-select">Model</label>
		<select
			id="model-select"
			bind:value={model}
			class="rounded border border-border bg-bg-overlay px-2 py-1.5 text-sm text-fg focus:border-border-active focus:outline-none"
		>
			{#each models as m (m.value)}
				<option value={m.value}>{m.label}</option>
			{/each}
		</select>
	</div>

	<!-- Permission mode -->
	<div class="flex flex-col gap-1">
		<span class="text-xs font-medium text-fg-muted">Permission Mode</span>
		<div class="flex rounded border border-border bg-bg-overlay">
			{#each modes as m, i (m.value)}
				<button
					type="button"
					onclick={() => (permissionMode = m.value)}
					class="flex-1 px-2 py-1.5 text-xs transition-colors
						{permissionMode === m.value ? 'bg-bg-active text-fg-bright' : 'text-fg-muted hover:text-fg'}
						{i === 0 ? 'rounded-l' : ''}
						{i === modes.length - 1 ? 'rounded-r' : ''}
					">{m.label}</button
				>
			{/each}
		</div>
	</div>

	<!-- Prompt textarea -->
	<div class="flex flex-col gap-1">
		<label class="text-xs font-medium text-fg-muted" for="prompt-input">Prompt</label>
		<textarea
			id="prompt-input"
			bind:value={prompt}
			use:autogrow
			onkeydown={handleKeydown}
			placeholder="What should Claude do? (Ctrl+Enter to submit)"
			rows="3"
			class="min-h-[72px] w-full resize-none rounded border border-border bg-bg-overlay px-3 py-2 text-sm text-fg placeholder-fg-faint focus:border-border-active focus:outline-none"
		></textarea>
	</div>

	<!-- Start button -->
	<button
		type="button"
		onclick={handleSubmit}
		disabled={!prompt.trim() || !projectId || submitting}
		class="rounded bg-btn-primary-bg px-4 py-2 text-sm font-medium text-btn-primary-fg hover:bg-btn-hover disabled:opacity-40"
	>
		{submitting ? 'Starting…' : 'Start Session'}
	</button>
</div>
