<script lang="ts">
	interface Usage {
		inputTokens: number;
		outputTokens: number;
		cacheReadTokens: number;
		cacheCreationTokens: number;
	}

	let {
		success,
		resultText,
		durationMs,
		totalCostUsd,
		usage,
		stopReason
	}: {
		success: boolean;
		resultText: string;
		durationMs: number;
		totalCostUsd: number;
		usage: Usage;
		stopReason: string;
	} = $props();

	let durationSec = $derived((durationMs / 1000).toFixed(1));
	let costStr = $derived(`$${totalCostUsd.toFixed(4)}`);
	let totalTokens = $derived(usage.inputTokens + usage.outputTokens);
</script>

<div
	class="my-3 rounded-lg border px-4 py-3 text-sm {success
		? 'border-green-700 bg-green-950/40'
		: 'border-red-700 bg-red-950/40'}"
>
	<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
		<!-- Status indicator -->
		<span class="flex items-center gap-1.5 font-medium {success ? 'text-green-400' : 'text-red-400'}">
			<span>{success ? '✓' : '✗'}</span>
			<span>{success ? 'Done' : 'Error'}</span>
		</span>

		<!-- Duration -->
		<span class="text-zinc-400">
			<span class="text-zinc-500">time:</span>
			{durationSec}s
		</span>

		<!-- Cost -->
		<span class="text-zinc-400">
			<span class="text-zinc-500">cost:</span>
			{costStr}
		</span>

		<!-- Token counts -->
		<span class="text-zinc-400">
			<span class="text-zinc-500">tokens:</span>
			{totalTokens.toLocaleString()}
			{#if usage.cacheReadTokens > 0 || usage.cacheCreationTokens > 0}
				<span class="text-zinc-500">
					({(usage.cacheReadTokens + usage.cacheCreationTokens).toLocaleString()} cached)
				</span>
			{/if}
		</span>

		<!-- Stop reason -->
		{#if stopReason && stopReason !== 'end_turn'}
			<span class="text-zinc-500 text-xs">stop: {stopReason}</span>
		{/if}
	</div>

	<!-- Error text if present -->
	{#if !success && resultText}
		<p class="mt-2 text-red-300 text-xs">{resultText}</p>
	{/if}
</div>
