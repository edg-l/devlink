<script lang="ts">
	import ToolCard from './ToolCard.svelte';

	const MAX_PREVIEW_LINES = 20;

	let {
		input,
		result
	}: {
		input: { file_path: string; content: string };
		result?: string;
	} = $props();

	let allLines = $derived(input.content.split('\n'));
	let previewLines = $derived(allLines.slice(0, MAX_PREVIEW_LINES));
	let remainingCount = $derived(Math.max(0, allLines.length - MAX_PREVIEW_LINES));
	let previewText = $derived(previewLines.join('\n'));
</script>

<ToolCard toolName="Write" {input} {result}>
	<div class="space-y-2 px-3 py-2">
		<p class="text-xs text-fg-muted">
			<span class="text-fg-muted">file:</span>
			<span class="font-mono text-fg">{input.file_path}</span>
		</p>

		<div>
			<pre
				class="max-h-64 overflow-x-auto overflow-y-auto rounded bg-bg-surface p-3 font-mono text-xs text-fg-bright">{previewText}</pre>
			{#if remainingCount > 0}
				<p class="mt-1 text-xs text-fg-muted">… {remainingCount} more lines</p>
			{/if}
		</div>

		{#if result}
			<p class="text-xs text-fg-muted">{result}</p>
		{/if}
	</div>
</ToolCard>
