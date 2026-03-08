<script lang="ts">
	import ToolCard from './ToolCard.svelte';

	let {
		input,
		result
	}: {
		input: { pattern: string; path?: string };
		result?: string;
	} = $props();

	// Parse result into file list (one path per line, filter empty lines)
	let files = $derived(result ? result.split('\n').filter((l) => l.trim().length > 0) : []);
</script>

<ToolCard toolName="Glob" {input} {result}>
	<div class="space-y-2 px-3 py-2">
		<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
			<span class="text-fg-muted">
				<span class="text-fg-muted">pattern:</span>
				<span class="font-mono text-fg">{input.pattern}</span>
			</span>
			{#if input.path}
				<span class="text-fg-muted">
					<span class="text-fg-muted">path:</span>
					<span class="font-mono text-fg">{input.path}</span>
				</span>
			{/if}
		</div>

		{#if files.length > 0}
			<div class="max-h-48 space-y-0.5 overflow-y-auto rounded bg-bg-surface p-3">
				{#each files as file (file)}
					<p class="font-mono text-xs text-fg">{file}</p>
				{/each}
			</div>
			<p class="text-xs text-fg-muted">{files.length} file{files.length !== 1 ? 's' : ''}</p>
		{:else if result !== undefined}
			<p class="text-xs text-fg-muted">No files found</p>
		{/if}
	</div>
</ToolCard>
