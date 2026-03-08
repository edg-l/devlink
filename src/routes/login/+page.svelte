<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign In | Devlink</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-bg-surface">
	<div class="w-full max-w-md rounded-xl bg-bg-overlay p-8 shadow-sm ring-1 ring-border">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-fg-bright">Devlink</h1>
			<p class="mt-1 text-sm text-fg-muted">Sign in to your account</p>
		</div>

		{#if form?.message}
			<div class="mb-4 rounded-lg bg-status-error/10 px-4 py-3 text-sm text-status-error">
				{form.message}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-fg">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					class="mt-1 block w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-fg placeholder-fg-faint shadow-sm focus:border-fg-accent focus:ring-1 focus:ring-fg-accent focus:outline-none"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-fg">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
					class="mt-1 block w-full rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-fg placeholder-fg-faint shadow-sm focus:border-fg-accent focus:ring-1 focus:ring-fg-accent focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded-lg bg-fg-accent px-4 py-2 text-sm font-semibold text-btn-primary-fg shadow-sm hover:bg-fg-accent focus:ring-2 focus:ring-fg-accent focus:ring-offset-2 focus:outline-none"
			>
				Sign In
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-fg-muted">
			Setting up a new device?
			<a href={resolve('/pair')} class="font-medium text-fg-accent hover:text-fg-accent"
				>Pair a New Device</a
			>
		</p>
	</div>
</div>
