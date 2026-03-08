<script lang="ts">
	import type { Block } from '$lib/client/event-parser';
	import MarkdownBlock from './MarkdownBlock.svelte';
	import ThinkingBlock from './ThinkingBlock.svelte';
	import ToolCard from './ToolCard.svelte';
	import PermissionPrompt from './PermissionPrompt.svelte';

	let {
		blocks,
		sessionId,
		pendingPermission,
		status = 'idle'
	}: {
		blocks: Block[];
		sessionId: string;
		pendingPermission?: { toolName: string; input: Record<string, unknown> } | null;
		status?: string;
	} = $props();

	// Show processing indicator when running and last block is a user message (waiting for response)
	let showProcessing = $derived.by(() => {
		if (status !== 'running' && status !== 'starting') return false;
		if (blocks.length === 0) return status === 'running' || status === 'starting';
		const last = blocks[blocks.length - 1];
		return last.type === 'user-message' || last.type === 'session-init';
	});

	let container: HTMLDivElement | undefined = $state();
	let userScrolledUp = $state(false);

	function isNearBottom(el: Element, threshold = 80): boolean {
		return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
	}

	function handleScroll() {
		const scrollParent = container?.parentElement;
		if (scrollParent) {
			userScrolledUp = !isNearBottom(scrollParent);
		}
	}

	// Attach scroll listener to the scroll parent
	$effect(() => {
		const scrollParent = container?.parentElement;
		if (!scrollParent) return;
		scrollParent.addEventListener('scroll', handleScroll);
		return () => scrollParent.removeEventListener('scroll', handleScroll);
	});

	// Auto-scroll to bottom when new blocks arrive or processing starts (unless user scrolled up)
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		blocks.length;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		showProcessing;
		const scrollParent = container?.parentElement;
		if (scrollParent && !userScrolledUp) {
			scrollParent.scrollTop = scrollParent.scrollHeight;
		}
	});

	// Always scroll to bottom when permission prompt appears (user needs to see it)
	$effect(() => {
		if (pendingPermission) {
			const scrollParent = container?.parentElement;
			if (scrollParent) {
				userScrolledUp = false;
				scrollParent.scrollTop = scrollParent.scrollHeight;
			}
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
				agentChildren={block.children}
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

	<!-- Processing indicator -->
	{#if showProcessing}
		<div class="flex items-center gap-2 py-2 text-sm text-fg-muted">
			<span class="flex items-center gap-1">
				<span class="thinking-dot" style="animation-delay: 0ms"></span>
				<span class="thinking-dot" style="animation-delay: 200ms"></span>
				<span class="thinking-dot" style="animation-delay: 400ms"></span>
			</span>
			<span>Thinking…</span>
		</div>
	{/if}

	<!-- Inline permission prompt if pending -->
	{#if pendingPermission}
		<PermissionPrompt
			toolName={pendingPermission.toolName}
			input={pendingPermission.input}
			{sessionId}
		/>
	{/if}
</div>

<style>
	.thinking-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-fg-faint, #666);
		animation: pulse 1.4s ease-in-out infinite;
		opacity: 0.3;
	}

	@keyframes pulse {
		0%,
		80%,
		100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		40% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
