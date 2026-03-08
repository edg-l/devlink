<script lang="ts">
	import { untrack } from 'svelte';
	import type { Snippet } from 'svelte';

	let {
		toolName,
		input,
		result,
		isError = false,
		children
	}: {
		toolName: string;
		input: Record<string, unknown>;
		result?: string;
		isError?: boolean;
		children?: Snippet;
	} = $props();

	// Tools that default to expanded because they make important changes
	const expandedByDefault = new Set(['Edit', 'Write', 'Bash']);

	let expanded = $state(untrack(() => expandedByDefault.has(toolName)));

	const toolEmoji: Record<string, string> = {
		Read: '🔧',
		Edit: '✏️',
		Write: '📄',
		Bash: '💻',
		Grep: '🔍',
		Glob: '📂',
		WebFetch: '🌐',
		Agent: '🤖'
	};

	let emoji = $derived(toolEmoji[toolName] ?? '🔧');

	// Derive a short summary line from input based on tool type
	let summary = $derived(
		(() => {
			if (toolName === 'Bash') {
				const cmd = input.command as string | undefined;
				return cmd ? cmd.slice(0, 80) + (cmd.length > 80 ? '…' : '') : '';
			}
			const path =
				(input.file_path as string | undefined) ??
				(input.path as string | undefined) ??
				(input.pattern as string | undefined);
			return path ? path.slice(0, 80) + (path.length > 80 ? '…' : '') : '';
		})()
	);
</script>

<div
	class="my-2 rounded-lg border text-sm {isError
		? 'border-status-error bg-red-950/30'
		: 'border-border bg-bg-overlay/50'}"
>
	<!-- Header / toggle -->
	<button
		class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-bg-active/30"
		onclick={() => (expanded = !expanded)}
		type="button"
	>
		<span>{emoji}</span>
		<span class="font-mono font-medium text-fg">{toolName}</span>
		{#if summary}
			<span class="truncate text-fg-muted">{summary}</span>
		{/if}
		<span class="ml-auto text-xs text-fg-muted">{expanded ? '▼' : '▶'}</span>
	</button>

	{#if expanded}
		<div class="border-t border-border">
			{#if children}
				{@render children()}
			{/if}

			{#if result && !children}
				<div
					class="mt-2 {isError
						? 'bg-red-950/30 text-status-error'
						: 'bg-bg-overlay/50 text-fg'} max-h-48 overflow-x-auto overflow-y-auto rounded p-2 font-mono text-xs whitespace-pre-wrap"
				>
					{result}
				</div>
			{/if}
		</div>
	{/if}
</div>
