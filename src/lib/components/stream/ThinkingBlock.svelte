<script lang="ts">
	let { content }: { content: string } = $props();

	let expanded = $state(false);
</script>

<div class="my-2 rounded-lg border border-zinc-700 bg-zinc-800/50">
	<button
		class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-400 hover:text-zinc-200"
		onclick={() => (expanded = !expanded)}
		type="button"
	>
		<span class="text-xs">{expanded ? '▼' : '▶'}</span>
		<span class="font-medium">Thinking...</span>
		{#if !expanded}
			<span class="ml-auto truncate text-xs text-zinc-500 italic">
				{content.slice(0, 80)}{content.length > 80 ? '…' : ''}
			</span>
		{/if}
	</button>

	{#if expanded}
		<div class="border-t border-zinc-700 px-3 py-3">
			<p class="text-sm whitespace-pre-wrap text-zinc-400 italic">{content}</p>
		</div>
	{/if}
</div>
