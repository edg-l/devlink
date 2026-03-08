<script lang="ts">
	import type { PermissionMode } from '$lib/types';

	let {
		mode,
		sessionId,
		onchange
	}: {
		mode: PermissionMode;
		sessionId: string;
		onchange?: (mode: PermissionMode) => void;
	} = $props();

	let current = $state<PermissionMode>('ask');
	let loading = $state(false);

	$effect(() => {
		current = mode;
	});

	const modes: { value: PermissionMode; label: string }[] = [
		{ value: 'plan', label: '📋 Plan' },
		{ value: 'ask', label: '🔒 Ask' },
		{ value: 'auto-edit', label: '📝 Auto-Edit' },
		{ value: 'auto', label: '⚡ Auto' }
	];

	async function setMode(newMode: PermissionMode) {
		if (newMode === current || loading) return;
		loading = true;
		try {
			const res = await fetch(`/api/sessions/${sessionId}/mode`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mode: newMode })
			});
			if (res.ok) {
				current = newMode;
				onchange?.(newMode);
			}
		} catch {
			// Ignore network errors
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex rounded border border-zinc-700 bg-zinc-800">
	{#each modes as m, i (m.value)}
		<button
			type="button"
			onclick={() => setMode(m.value)}
			disabled={loading}
			class="flex-1 px-2 py-1 text-xs transition-colors disabled:opacity-60
				{current === m.value ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}
				{i === 0 ? 'rounded-l' : ''}
				{i === modes.length - 1 ? 'rounded-r' : ''}
			">{m.label}</button
		>
	{/each}
</div>
