<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Document from '@tiptap/extension-document';
	import Link from '@tiptap/extension-link';
	import yaml from 'js-yaml';

	import { html_to_markdown } from './html_to_markdown';
	import { applyAction, deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	export let notes: string;
	export let meta;
	export let raw: string;
	export let raw_notes: string;
	export let url: string;
	export let path: string;

	let is_edited = false;

	let element;
	let editor;

	$: episode_number = meta.number;
	let top_pos = 0;

	function epochToDateInputValue(epoch) {
		console.log('epoch', epoch);
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

	const CustomDocument = Document.extend({
		content: 'heading block*'
	});

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

	async function save() {
		console.log('Saving notes...');
		let markdown_to_server = await html_to_markdown(editor.getHTML());
		const form = document.getElementById('meta');
		const meta_data = getFormData(form);
		const yaml_meta_data = yaml.dump(meta_data);
		console.log('yaml_meta_data', yaml_meta_data);
		const markdown_to_server_with_meta = `---
${yaml_meta_data.trimEnd()}
---


${markdown_to_server}
`;

		const r = await fetch('?/draft', {
			method: 'POST',
			body: JSON.stringify({ markdown_to_server: markdown_to_server_with_meta, url, path })
		});

		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = deserialize(await r.text());

		if (result.type === 'success') {
			// rerun all `load` functions, following the successful update
			await invalidateAll();
		}

		applyAction(result);

		// const response = await fetch('/shows/save', {
		// 	method: 'POST',
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify({ markdown_to_server: markdown_to_server_with_meta, url, data })
		// });

		// const result = await response.json();
	}
</script>

<div class="editbar" style:top={top_pos + -70 + 'px'}>
	{#if editor}
		<button
			on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
			class:active={editor.isActive('heading', { level: 1 })}
		>
			H1
		</button>
		<button
			on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
			class:active={editor.isActive('heading', { level: 2 })}
		>
			H2
		</button>
		<button
			on:click={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
			class:active={editor.isActive('heading', { level: 3 })}
		>
			H3
		</button>
		<button
			on:click={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
			class:active={editor.isActive('heading', { level: 4 })}
		>
			H4
		</button>
		<button
			on:click={() => editor.chain().focus().setParagraph().run()}
			class:active={editor.isActive('paragraph')}
		>
			P
		</button>
		<button
			on:click={() => editor.chain().focus().toggleBold().run()}
			class:active={editor.isActive('bold')}
		>
			Bold
		</button>
		<button
			on:click={() => editor.chain().focus().toggleBulletList().run()}
			class:active={editor.isActive('bulletList')}
		>
			•
		</button>
		<button
			on:click={() => editor.chain().focus().toggleOrderedList().run()}
			class:active={editor.isActive('orderedList')}
		>
			1.
		</button>
	{/if}
</div>

{#if is_edited}
	<div>I've been edited</div>
	<button on:click={save}>Save</button>
{/if}

<form id="meta">
	<label for="">
		Show #:
		<input type="number" name="number" value={episode_number} id="" />
	</label>
	<input name="title" bind:value={meta.title} />
	<input name="url" bind:value={meta.url} />
	<input name="date" type="date" value={epochToDateInputValue(meta.date)} />
</form>
<div class="notes">
	<div bind:this={element} />
</div>

<style>
	.editbar {
		position: absolute;
		background-color: white;
		z-index: 100;
		padding: 10px;
		left: 10px;
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1), 0px 0px 0px 1px rgba(0, 0, 0, 0.05), var(--shadow-6);
		border-radius: 4px;
		transition: 0.3s ease top;
		display: flex;
		gap: 10px;
	}

	button.active {
		background: black;
		color: white;
	}

	:global(.ProseMirror) {
		background: var(--color-background);
		padding: 10px 10px 100px;
		min-height: 80vh;
		margin: 5px;
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1), 0px 0px 0px 1px rgba(0, 0, 0, 0.05);
		border-radius: 4px;
	}
</style>
