<script lang="ts">
	import type { Block } from '$lib/client/event-parser';
	import MarkdownBlock from './MarkdownBlock.svelte';
	import ThinkingBlock from './ThinkingBlock.svelte';
	import ToolCard from './ToolCard.svelte';
	import PermissionPrompt from './PermissionPrompt.svelte';

	let {
		blocks,
		sessionId,
		pendingPermission
	}: {
		blocks: Block[];
		sessionId: string;
		pendingPermission?: { toolName: string; input: Record<string, unknown> } | null;
	} = $props();

	let container: HTMLDivElement | undefined = $state();

	// Auto-scroll to bottom when new blocks arrive
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		blocks.length;
		const scrollParent = container?.parentElement;
		if (scrollParent) {
			scrollParent.scrollTop = scrollParent.scrollHeight;
		}
	});
</script>

<div bind:this={container} class="flex flex-col gap-1 px-4 py-4">
	{#each blocks as block, i (block.id)}
		{#if block.type === 'markdown'}
			<MarkdownBlock content={block.content} />
		{:else if block.type === 'thinking'}
			<ThinkingBlock content={block.content} />
		{:else if block.type === 'tool-use'}
			<ToolCard
				toolName={block.toolName}
				input={block.input}
				result={block.result}
				isError={block.isError}
			/>
		{:else if block.type === 'result'}
			<!-- no visual output -->
		{:else if block.type === 'rate-limit'}
			<!-- no visual output -->
		{:else if block.type === 'user-message'}
			<div class="ml-auto max-w-[80%] rounded-lg bg-bg-overlay px-3 py-2 text-sm text-fg">
				{block.content}
			</div>
		{:else if block.type === 'error'}
			<div
				class="rounded border border-status-error bg-red-950/30 px-3 py-2 text-xs text-status-error"
			>
				{block.message}
			</div>
		{:else if block.type === 'session-init'}
			{#if i === 0}
				<div class="text-xs text-fg-faint">
					Session started — model: {block.model}, cwd: {block.cwd}
				</div>
			{/if}
		{/if}
	{/each}

	<!-- Inline permission prompt if pending -->
	{#if pendingPermission}
		<PermissionPrompt
			toolName={pendingPermission.toolName}
			input={pendingPermission.input}
			{sessionId}
		/>
	{/if}
</div>
