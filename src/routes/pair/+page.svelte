<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// State for authenticated user (generate code flow)
	let generatedCode = $state<string | null>(null);
	let generating = $state(false);
	let generateError = $state<string | null>(null);

	// State for unauthenticated user (enter code flow)
	let codeDigits = $state(['', '', '', '', '', '']);
	let deviceName = $state('');
	let validating = $state(false);
	let validateError = $state<string | null>(null);
	let pairingSuccess = $state(false);

	async function handleGenerate() {
		generating = true;
		generateError = null;
		try {
			const res = await fetch('/api/pair/generate', { method: 'POST' });
			if (!res.ok) {
				generateError = 'Failed to generate code';
				return;
			}
			const result = await res.json();
			generatedCode = result.code;
		} catch {
			generateError = 'Network error';
		} finally {
			generating = false;
		}
	}

	async function handleValidate(event: SubmitEvent) {
		event.preventDefault();
		const code = codeDigits.join('');
		if (code.length !== 6) {
			validateError = 'Please enter the 6-digit code';
			return;
		}
		validating = true;
		validateError = null;
		try {
			const res = await fetch('/api/pair/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code, deviceName: deviceName || 'My Device' })
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				validateError = err?.message ?? 'Invalid or expired code';
				return;
			}
			pairingSuccess = true;
		} catch {
			validateError = 'Network error';
		} finally {
			validating = false;
		}
	}

	function handleDigitInput(index: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const val = input.value.replace(/\D/g, '').slice(-1);
		codeDigits[index] = val;
		if (val && index < 5) {
			const next = document.getElementById(`digit-${index + 1}`);
			next?.focus();
		}
	}

	function handleDigitKeydown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
			const prev = document.getElementById(`digit-${index - 1}`);
			prev?.focus();
		}
	}

	function handleDigitPaste(e: ClipboardEvent) {
		const text = e.clipboardData?.getData('text') ?? '';
		const digits = text.replace(/\D/g, '').slice(0, 6).split('');
		digits.forEach((d, i) => {
			if (i < 6) codeDigits[i] = d;
		});
		e.preventDefault();
	}
</script>

<svelte:head>
	<title>Pair Device | Devlink</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg-surface">
	<div class="w-full max-w-md rounded-xl bg-bg-overlay p-8 shadow-sm ring-1 ring-border">
		{#if data.user}
			<!-- Authenticated: generate code -->
			<div class="text-center">
				<h1 class="text-2xl font-bold text-fg-bright">Pair a Device</h1>
				<p class="mt-1 text-sm text-fg-muted">
					Generate a code and enter it on the device you want to pair.
				</p>

				{#if generateError}
					<div class="mt-4 rounded-lg bg-status-error/10 px-4 py-3 text-sm text-status-error">
						{generateError}
					</div>
				{/if}

				{#if generatedCode}
					<div class="mt-8">
						<p class="mb-2 text-sm text-fg-muted">Your pairing code (valid for 5 minutes)</p>
						<div
							class="rounded-xl bg-bg-overlay px-8 py-6 font-mono text-5xl font-bold tracking-widest text-fg-bright"
						>
							{generatedCode}
						</div>
						<button
							onclick={handleGenerate}
							disabled={generating}
							class="mt-4 text-sm text-fg-accent hover:text-fg-accent disabled:opacity-50"
						>
							Generate new code
						</button>
					</div>
				{:else}
					<button
						onclick={handleGenerate}
						disabled={generating}
						class="mt-8 w-full rounded-lg bg-fg-accent px-4 py-2 text-sm font-semibold text-btn-primary-fg shadow-sm hover:bg-fg-accent focus:ring-2 focus:ring-fg-accent focus:ring-offset-2 focus:outline-none disabled:opacity-50"
					>
						{generating ? 'Generating...' : 'Generate Pairing Code'}
					</button>
				{/if}
			</div>
		{:else}
			<!-- Unauthenticated: enter code -->
			<div class="text-center">
				<h1 class="text-2xl font-bold text-fg-bright">Pair This Device</h1>
				<p class="mt-1 text-sm text-fg-muted">
					Enter the 6-digit code from your authenticated device.
				</p>
			</div>

			{#if pairingSuccess}
				<div class="mt-8 text-center">
					<div class="mb-4 rounded-lg bg-status-ok/10 px-4 py-3 text-sm text-status-ok">
						Device paired successfully!
					</div>
					<p class="mb-4 text-sm text-fg-muted">You can now log in with your account.</p>
					<a
						href={resolve('/login')}
						class="inline-block rounded-lg bg-fg-accent px-4 py-2 text-sm font-semibold text-btn-primary-fg shadow-sm hover:bg-fg-accent"
					>
						Go to Login
					</a>
				</div>
			{:else}
				{#if validateError}
					<div class="mt-4 rounded-lg bg-status-error/10 px-4 py-3 text-sm text-status-error">
						{validateError}
					</div>
				{/if}

				<form onsubmit={handleValidate} class="mt-8 space-y-6">
					<div>
						<label for="digit-0" class="mb-3 block text-sm font-medium text-fg">
							Pairing Code
						</label>
						<div class="flex justify-center gap-2">
							{#each codeDigits as digit, i (i)}
								<input
									id="digit-{i}"
									type="text"
									inputmode="numeric"
									maxlength="1"
									value={digit}
									oninput={(e) => handleDigitInput(i, e)}
									onkeydown={(e) => handleDigitKeydown(i, e)}
									onpaste={handleDigitPaste}
									class="h-12 w-10 rounded-lg border border-border bg-bg-input text-center font-mono text-xl font-bold text-fg shadow-sm focus:border-fg-accent focus:ring-1 focus:ring-fg-accent focus:outline-none"
								/>
							{/each}
						</div>
					</div>

					<div>
						<label for="deviceName" class="block text-sm font-medium text-fg"
							>Device Name <span class="text-fg-muted">(optional)</span></label
						>
						<input
							id="deviceName"
							type="text"
							bind:value={deviceName}
							placeholder="e.g. My Laptop"
							class="mt-1 block w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-fg placeholder-fg-faint shadow-sm focus:border-fg-accent focus:ring-1 focus:ring-fg-accent focus:outline-none"
						/>
					</div>

					<button
						type="submit"
						disabled={validating}
						class="w-full rounded-lg bg-fg-accent px-4 py-2 text-sm font-semibold text-btn-primary-fg shadow-sm hover:bg-fg-accent focus:ring-2 focus:ring-fg-accent focus:ring-offset-2 focus:outline-none disabled:opacity-50"
					>
						{validating ? 'Verifying...' : 'Pair Device'}
					</button>
				</form>
			{/if}

			<p class="mt-6 text-center text-sm text-fg-muted">
				Already paired?
				<a href={resolve('/login')} class="font-medium text-fg-accent hover:text-fg-accent"
					>Sign in</a
				>
			</p>
		{/if}
	</div>
</div>
