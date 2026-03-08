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
			<span class="text-zinc-400">
				<span class="text-zinc-500">pattern:</span>
				<span class="font-mono text-zinc-200">{input.pattern}</span>
			</span>
			{#if input.path}
				<span class="text-zinc-400">
					<span class="text-zinc-500">path:</span>
					<span class="font-mono text-zinc-200">{input.path}</span>
				</span>
			{/if}
			{#if input.glob}
				<span class="text-zinc-400">
					<span class="text-zinc-500">glob:</span>
					<span class="font-mono text-zinc-200">{input.glob}</span>
				</span>
			{/if}
		</div>

		{#if result}
			<pre
				class="max-h-64 overflow-x-auto overflow-y-auto rounded bg-zinc-900 p-3 font-mono text-xs text-zinc-100">{result}</pre>
		{/if}
	</div>
</ToolCard>
