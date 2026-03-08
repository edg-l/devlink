<script lang="ts">
	import AnsiToHtml from 'ansi-to-html';
	import ToolCard from './ToolCard.svelte';

	let {
		input,
		result
	}: {
		input: { command: string; description?: string; timeout?: number };
		result?: string;
	} = $props();

	const converter = new AnsiToHtml({ newline: true, escapeXML: true });
	let resultHtml = $derived(result ? converter.toHtml(result) : '');
</script>

<ToolCard toolName="Bash" {input} {result}>
	<div class="space-y-2 px-3 py-2">
		{#if input.description}
			<p class="text-xs text-zinc-400 italic">{input.description}</p>
		{/if}

		<pre
			class="overflow-x-auto rounded bg-zinc-900 p-3 font-mono text-xs text-zinc-100">{input.command}</pre>

		{#if input.timeout}
			<p class="text-xs text-zinc-500">timeout: {input.timeout}ms</p>
		{/if}

		{#if result}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<div
				class="max-h-80 overflow-x-auto overflow-y-auto rounded bg-black p-3 font-mono text-xs text-zinc-100"
			>
				{@html resultHtml}
			</div>
		{/if}
	</div>
</ToolCard>
