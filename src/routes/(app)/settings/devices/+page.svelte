<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(date: Date | null) {
		if (!date) return 'Never';
		return new Intl.DateTimeFormat('en', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(date));
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900">Paired Devices</h1>
		<p class="mt-1 text-sm text-gray-500">Manage devices that have been paired with Devlink.</p>
	</div>

	{#if data.devices.length === 0}
		<div class="rounded-xl border border-dashed border-gray-300 p-8 text-center">
			<p class="text-sm text-gray-500">No paired devices yet.</p>
			<a
				href={resolve('/pair')}
				class="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
			>
				Pair a device
			</a>
		</div>
	{:else}
		<ul class="divide-y divide-gray-100 rounded-xl ring-1 ring-gray-200">
			{#each data.devices as device (device.id)}
				<li class="flex items-center justify-between px-4 py-4">
					<div class="min-w-0">
						<p class="truncate text-sm font-medium text-gray-900">{device.name}</p>
						<p class="mt-0.5 text-xs text-gray-500">
							Paired {formatDate(device.pairedAt)} &middot; Last seen {formatDate(device.lastSeen)}
						</p>
					</div>
					<form method="POST" action="?/revoke" use:enhance class="ml-4 shrink-0">
						<input type="hidden" name="id" value={device.id} />
						<button
							type="submit"
							class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50 focus:ring-2 focus:ring-red-400 focus:outline-none"
						>
							Revoke
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</div>
