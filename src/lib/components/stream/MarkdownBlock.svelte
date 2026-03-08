<script lang="ts" module>
	import { marked } from 'marked';

	// Configure renderer once at module level, not per component instance
	const renderer = new marked.Renderer();
	renderer.code = ({ text, lang }) => {
		const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return `<pre class="bg-zinc-900 text-zinc-100 rounded-lg p-4 overflow-x-auto text-sm my-3"><code class="language-${lang || 'text'}">${escapedText}</code></pre>`;
	};
	marked.use({ renderer });
</script>

<script lang="ts">
	let { content }: { content: string } = $props();
	let html = $derived(marked.parse(content) as string);
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<div class="markdown-content prose prose-invert prose-sm max-w-none overflow-x-auto">
	{@html html}
</div>

<style>
	.markdown-content :global(code::before),
	.markdown-content :global(code::after) {
		content: '' !important;
	}

	.markdown-content :global(code:not(pre code)) {
		background-color: var(--color-zinc-800);
		padding: 0.15em 0.4em;
		border-radius: 0.25rem;
		font-size: 0.85em;
	}

	.markdown-content :global(p) {
		margin: 0.5em 0;
	}

	.markdown-content :global(table) {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.85em;
	}

	.markdown-content :global(th),
	.markdown-content :global(td) {
		border: 1px solid var(--color-zinc-700);
		padding: 0.4em 0.8em;
		text-align: left;
	}

	.markdown-content :global(th) {
		background-color: var(--color-zinc-800);
		font-weight: 600;
	}

	.markdown-content :global(tr:nth-child(even)) {
		background-color: var(--color-zinc-800, rgba(255, 255, 255, 0.03));
	}
</style>
