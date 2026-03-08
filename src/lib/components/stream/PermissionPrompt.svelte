<script lang="ts">
	let {
		toolName,
		input,
		sessionId
	}: {
		toolName: string;
		input: Record<string, unknown>;
		sessionId: string;
	} = $props();

	let responded = $state<'allowed' | 'denied' | null>(null);
	let loading = $state(false);

	// Show key argument based on tool type
	let keyArg = $derived(
		(() => {
			if (toolName === 'Bash') {
				const cmd = input.command as string | undefined;
				return cmd ? { label: 'command', value: cmd } : null;
			}
			const path = (input.file_path as string | undefined) ?? (input.path as string | undefined);
			if (path) return { label: 'path', value: path };
			const pattern = input.pattern as string | undefined;
			if (pattern) return { label: 'pattern', value: pattern };
			return null;
		})()
	);

	async function respond(behavior: 'allow' | 'deny') {
		loading = true;
		try {
			await fetch(`/api/sessions/${sessionId}/permission-response`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ behavior })
			});
			responded = behavior === 'allow' ? 'allowed' : 'denied';
		} catch {
			// Ignore errors — buttons will re-enable
		} finally {
			loading = false;
		}
	}
</script>

<div class="my-2 rounded-lg border border-yellow-700 bg-yellow-950/30 px-4 py-3 text-sm">
	<div class="mb-2 flex items-center gap-2">
		<span class="text-yellow-400">🔐</span>
		<span class="font-medium text-yellow-300">Permission required</span>
		<span class="font-mono text-yellow-400">{toolName}</span>
	</div>

	{#if keyArg}
		<div class="mb-3 overflow-x-auto rounded bg-bg-surface px-3 py-2">
			<p class="mb-0.5 text-xs text-fg-muted">{keyArg.label}</p>
			<pre class="text-xs break-all whitespace-pre-wrap text-fg">{keyArg.value}</pre>
		</div>
	{/if}

	{#if responded}
		<p
			class="text-sm font-medium {responded === 'allowed' ? 'text-status-ok' : 'text-status-error'}"
		>
			{responded === 'allowed' ? '✓ Allowed' : '✗ Denied'}
		</p>
	{:else}
		<div class="flex gap-2">
			<button
				onclick={() => respond('allow')}
				disabled={loading}
				class="rounded bg-status-ok px-3 py-1.5 text-xs font-medium text-fg-bright hover:bg-status-ok disabled:opacity-50"
				>Allow</button
			>
			<button
				onclick={() => respond('deny')}
				disabled={loading}
				class="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
				>Deny</button
			>
		</div>
	{/if}
</div>
