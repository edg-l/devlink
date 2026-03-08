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
		? 'border-red-700 bg-red-950/30'
		: 'border-zinc-700 bg-zinc-800/50'}"
>
	<!-- Header / toggle -->
	<button
		class="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700/30"
		onclick={() => (expanded = !expanded)}
		type="button"
	>
		<span>{emoji}</span>
		<span class="font-mono font-medium text-zinc-200">{toolName}</span>
		{#if summary}
			<span class="truncate text-zinc-500">{summary}</span>
		{/if}
		<span class="ml-auto text-xs text-zinc-500">{expanded ? '▼' : '▶'}</span>
	</button>

	{#if expanded}
		<div class="border-t border-zinc-700">
			{#if children}
				{@render children()}
			{/if}

			{#if result && !children}
				<div
					class="mt-2 {isError
						? 'bg-red-950/30 text-red-400'
						: 'bg-zinc-800/50 text-zinc-300'} max-h-48 overflow-x-auto overflow-y-auto rounded p-2 font-mono text-xs whitespace-pre-wrap"
				>
					{result}
				</div>
			{/if}
		</div>
	{/if}
</div>
