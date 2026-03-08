<script lang="ts" module>
	import { marked } from 'marked';

	// Configure renderer once at module level, not per component instance
	const renderer = new marked.Renderer();
	renderer.code = ({ text, lang }) => {
		const escapedText = text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		return `<pre class="bg-zinc-900 text-zinc-100 rounded-lg p-4 overflow-x-auto text-sm my-3"><code class="language-${lang || 'text'}">${escapedText}</code></pre>`;
	};
	marked.use({ renderer });
</script>

<script lang="ts">
	let { content }: { content: string } = $props();
	let html = $derived(marked.parse(content) as string);
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<div class="prose prose-sm dark:prose-invert max-w-none">{@html html}</div>
