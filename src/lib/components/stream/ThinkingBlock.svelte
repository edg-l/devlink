<script lang="ts">
	let { content }: { content: string } = $props();

	let expanded = $state(false);
</script>

<div class="my-2 rounded-lg border border-border bg-bg-overlay/50">
	<button
		class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg-muted hover:text-fg"
		onclick={() => (expanded = !expanded)}
		type="button"
	>
		<span class="text-xs">{expanded ? '▼' : '▶'}</span>
		<span class="font-medium">Thinking...</span>
		{#if !expanded}
			<span class="ml-auto truncate text-xs text-fg-muted italic">
				{content.slice(0, 80)}{content.length > 80 ? '…' : ''}
			</span>
		{/if}
	</button>

	{#if expanded}
		<div class="border-t border-border px-3 py-3">
			<p class="text-sm whitespace-pre-wrap text-fg-muted italic">{content}</p>
		</div>
	{/if}
</div>
