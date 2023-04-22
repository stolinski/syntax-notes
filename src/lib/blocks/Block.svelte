<script lang="ts">
	import Avatar from '$lib/Avatar.svelte';
	import { fade } from 'svelte/transition';

	export let room;
	export let line_number = ' • ';
	export let on_input: (e: Event & { currentTarget: HTMLDivElement }, i: number) => void;
	export let text: string;
	export let is_typing;

	function on_blur() {
		room.updatePresence({
			isTyping: false,
			on_line: -1
		});
	}
</script>

<div class="block">
	<span class="line">
		{#if String(is_typing?.presence?.on_line) === line_number}
			<div class="is_typing_avatar" transition:fade>
				<Avatar avatar_size={30} picture={is_typing.info?.picture} name={is_typing.info?.name} />
			</div>
		{:else}
			{'#' + line_number}
		{/if}
	</span>
	<div on:blur={on_blur} on:input={(e) => on_input(e, Number(line_number))} contenteditable="true">
		{text}
	</div>
</div>

<style>
	.block {
		display: grid;
		grid-template-columns: 30px 1fr;
		outline: 1px solid transparent;
		line-height: 1.5;
		font-size: 16px;
		align-items: baseline;
	}

	.is_typing_avatar {
		position: absolute;
		top: -2px;
		left: -13px;
	}

	.line {
		display: block;
		color: var(--color-primary-faded);
		font-size: 12px;
		position: relative;
		height: 100%;
	}

	.block:has(div:focus) {
		outline-color: #ddd;
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1), 0px 0px 0px 1px rgba(0, 0, 0, 0.05);
	}

	div:focus {
		outline: none;
	}
</style>
