<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-gray-900">Set Up Devlink</h1>
			<p class="mt-1 text-sm text-gray-500">Create your admin account</p>
		</div>

		{#if form?.message}
			<div class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
				{form.message}
			</div>
		{/if}

		<form method="POST" use:enhance class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					autocomplete="email"
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="new-password"
					class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				Create Account
			</button>
		</form>
	</div>
</div>
