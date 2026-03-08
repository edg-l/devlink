<script lang="ts">
	const themes = [
		{ value: 'theme-dark', label: 'Dark' },
		{ value: 'theme-mirage', label: 'Mirage' },
		{ value: 'theme-light', label: 'Light' }
	];

	let current = $state('theme-dark');

	if (typeof window !== 'undefined') {
		current = localStorage.getItem('theme') || 'theme-dark';
	}

	function setTheme(theme: string) {
		current = theme;
		document.documentElement.classList.remove('theme-dark', 'theme-mirage', 'theme-light');
		document.documentElement.classList.add(theme);
		localStorage.setItem('theme', theme);
	}
</script>

<div class="flex rounded border border-border bg-bg-overlay">
	{#each themes as t, i (t.value)}
		<button
			type="button"
			onclick={() => setTheme(t.value)}
			class="flex-1 px-2 py-1 text-xs transition-colors
				{current === t.value ? 'bg-bg-active text-fg-bright' : 'text-fg-muted hover:text-fg'}
				{i === 0 ? 'rounded-l' : ''}
				{i === themes.length - 1 ? 'rounded-r' : ''}
			">{t.label}</button
		>
	{/each}
</div>
