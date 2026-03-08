<script lang="ts">
	import ToolCard from './ToolCard.svelte';

	let {
		input,
		result
	}: {
		input: { pattern: string; path?: string; glob?: string };
		result?: string;
	} = $props();
</script>

<ToolCard toolName="Grep" {input} {result}>
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
			{#if input.glob}
				<span class="text-fg-muted">
					<span class="text-fg-muted">glob:</span>
					<span class="font-mono text-fg">{input.glob}</span>
				</span>
			{/if}
		</div>

		{#if result}
			<pre
				class="max-h-64 overflow-x-auto overflow-y-auto rounded bg-bg-surface p-3 font-mono text-xs text-fg-bright">{result}</pre>
		{/if}
	</div>
</ToolCard>
