<script lang="ts">
	import ToolCard from './ToolCard.svelte';

	let {
		input,
		result
	}: {
		input: { file_path: string; offset?: number; limit?: number };
		result?: string;
	} = $props();

	let lineCount = $derived(result ? result.split('\n').length : 0);
</script>

<ToolCard toolName="Read" {input} {result}>
	<div class="space-y-2 px-3 py-2">
		<p class="text-xs text-fg-muted">
			<span class="text-fg-muted">file:</span>
			<span class="font-mono text-fg">{input.file_path}</span>
		</p>
		{#if input.offset !== undefined || input.limit !== undefined}
			<p class="text-xs text-fg-muted">
				{#if input.offset !== undefined}lines from {input.offset}{/if}
				{#if input.limit !== undefined}, limit {input.limit}{/if}
			</p>
		{/if}

		{#if result}
			<div>
				<p class="mb-1 text-xs text-fg-muted">{lineCount} lines</p>
				<pre
					class="max-h-64 overflow-x-auto overflow-y-auto rounded bg-bg-surface p-3 font-mono text-xs text-fg-bright">{result}</pre>
			</div>
		{/if}
	</div>
</ToolCard>
