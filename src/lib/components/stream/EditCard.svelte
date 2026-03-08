<script lang="ts">
	import ToolCard from './ToolCard.svelte';

	let {
		input,
		result
	}: {
		input: { file_path: string; old_string: string; new_string: string };
		result?: string;
	} = $props();

	// Build simple line-by-line diff lines
	let diffLines = $derived((() => {
		const lines: { text: string; kind: 'removed' | 'added' }[] = [];
		for (const line of input.old_string.split('\n')) {
			lines.push({ text: `- ${line}`, kind: 'removed' });
		}
		for (const line of input.new_string.split('\n')) {
			lines.push({ text: `+ ${line}`, kind: 'added' });
		}
		return lines;
	})());
</script>

<ToolCard toolName="Edit" {input} {result}>
	<div class="px-3 py-2 space-y-2">
		<p class="text-xs text-zinc-400">
			<span class="text-zinc-500">file:</span>
			<span class="font-mono text-zinc-200">{input.file_path}</span>
		</p>

		<div class="overflow-x-auto rounded bg-zinc-900 text-xs font-mono">
			{#each diffLines as line, i (i)}
				<div
					class="px-3 py-0.5 whitespace-pre {line.kind === 'removed'
						? 'bg-red-950/60 text-red-300'
						: 'bg-green-950/60 text-green-300'}"
				>{line.text}</div>
			{/each}
		</div>

		{#if result}
			<p class="text-xs text-zinc-500">{result}</p>
		{/if}
	</div>
</ToolCard>
