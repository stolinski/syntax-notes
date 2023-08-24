<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Link from '@tiptap/extension-link';
	import yaml from 'js-yaml';

	import { html_to_markdown } from './html_to_markdown';
	import { applyAction, deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Controls from './Controls.svelte';
	export let notes: string;
	export let meta;
	export let raw: string;
	export let raw_notes: string;
	export let url: string;
	export let path: string;

	let is_edited = false;

	let element: Element;
	let editor: Editor;

	$: episode_number = meta.number;
	let top_pos = 0;

	function epochToDateInputValue(epoch: string) {
		const date = new Date(epoch);
		return date.toISOString().substring(0, 10);
	}

	function getFormData(form) {
		const formData = {};
		Array.from(form.elements).forEach((element) => {
			if (element.name && element.type !== 'submit') {
				if (element.type === 'date') {
					// Convert the date value to an epoch timestamp
					formData[element.name] = new Date(element.value).getTime();
				} else if (element.type === 'number') {
					// Convert the date value to an epoch timestamp
					formData[element.name] = parseInt(element.value);
				} else {
					formData[element.name] = element.value;
				}
			}
		});
		return formData;
	}

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit.configure(),
				Link.configure({
					openOnClick: false
				})
			],
			content: notes,

			onTransaction: async () => {
				// force re-render so `editor.isActive` works as expected
				editor = editor;
				html_to_markdown(editor.getHTML()).then((data) => {
					if (data !== raw_notes) {
						is_edited = true;
					}
				});
			}
		});

		var targetedDiv = document.querySelector('.ProseMirror');
		targetedDiv.addEventListener('click', function (event) {
			if (event.target.tagName === 'A') {
				event.preventDefault();
			}
		});

		targetedDiv.addEventListener('mouseup', handleSelectionChange);
		targetedDiv.addEventListener('keyup', handleSelectionChange);
		targetedDiv.addEventListener('click', handleSelectionChange);

		function handleSelectionChange() {
			// Get the position from the top of the browser window
			var selection = window.getSelection();

			if (selection.rangeCount > 0) {
				var range = selection.getRangeAt(0);
				var lineTop = range.getBoundingClientRect().top;
				top_pos = lineTop;
			}
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	async function prepare_markdown() {
		let markdown_to_server = await html_to_markdown(editor.getHTML());
		const form = document.getElementById('meta');
		const meta_data = getFormData(form);
		const yaml_meta_data = yaml.dump(meta_data);
		return `---
${yaml_meta_data.trimEnd()}
---


${markdown_to_server}
`;
	}

	async function save_draft() {
		const markdown_to_server_with_meta = await prepare_markdown();
		console.log('markdown_to_server_with_meta', markdown_to_server_with_meta);
		const r = await fetch('?/draft', {
			method: 'POST',
			body: JSON.stringify({ markdown_to_server: markdown_to_server_with_meta, url, path })
		});

		const result = deserialize(await r.text());

		if (result.type === 'success') {
			// rerun all `load` functions, following the successful update
			await invalidateAll();
		}

		applyAction(result);
	}

	async function publish() {
		const markdown_to_server_with_meta = await prepare_markdown();

		const r = await fetch('?/publish', {
			method: 'POST',
			body: JSON.stringify({ markdown_to_server: markdown_to_server_with_meta, url, path })
		});

		const result = deserialize(await r.text());

		if (result.type === 'success') {
			// rerun all `load` functions, following the successful update
			await invalidateAll();
		}

		applyAction(result);
	}
</script>

<Controls {editor} {top_pos} />

<div class="publish-bar">
	<button on:click={publish}>Publish</button>
	<button on:click={save_draft}>Save Draft</button>
</div>

<form id="meta">
	<input name="title" bind:value={meta.title} />
	<label for="">
		Show #:
		<input type="number" name="number" value={episode_number} id="" />
	</label>
	<input name="url" bind:value={meta.url} />
	<input name="date" type="date" value={epochToDateInputValue(meta.date)} />
</form>
<div class="notes">
	<div bind:this={element} />
</div>

<style>
	:global(.ProseMirror) {
		background: var(--color-background);
		padding: 10px 10px 100px;
		min-height: 80vh;
		margin: 5px;
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1), 0px 0px 0px 1px rgba(0, 0, 0, 0.05);
		border-radius: 4px;
	}

	input[name='title'] {
		width: 100%;
		font-size: 24px;
		font-weight: bold;
	}
</style>
