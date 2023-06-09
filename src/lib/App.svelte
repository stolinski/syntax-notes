<script lang="ts">
	import Avatar from './Avatar.svelte';
	import { type Room, type LiveList } from '@liveblocks/client';
	import { onDestroy, onMount } from 'svelte';
	import Block from '$lib/blocks/Block.svelte';
	export let room;

	let doc: LiveList<string>;
	let doc_display: string[];

	// Get initial values for others and self
	let users = room.getOthers();
	let currentUser = room.getSelf();
	let is_typing = false;

	// Subscribe to further changes
	const unsubscribeOthers = room.subscribe('others', (others) => {
		users = others;
		is_typing = others.toArray().find((user) => user.presence?.isTyping);
		console.log('is_typing', is_typing);
	});

	const unsubscribeConnection = room.subscribe('connection', () => {
		currentUser = room.getSelf();
		room.getStorage().then(({ root }) => {
			doc = root.get('doc');
			doc_display = doc.toImmutable();
		});
	});

	onMount(async () => {
		const { root } = await room.getStorage();
		const new_doc = root.get('doc');
		room.subscribe(new_doc, (updates) => {
			doc_display = updates.toImmutable();
		});
	});

	// Unsubscribe when unmounting
	onDestroy(() => {
		unsubscribeOthers();
		unsubscribeConnection();
	});

	$: hasMoreUsers = users ? [...users].length > 3 : false;

	function on_input(e: Event & { currentTarget: HTMLDivElement }, i: number) {
		room.updatePresence({ isTyping: true, on_line: i });
		doc.set(i, e.currentTarget.innerText);
	}
</script>

<header>
	{#if users}
		{#each [...users].slice(0, 3) as { connectionId, info } (connectionId)}
			<Avatar picture={info?.picture} name={info?.name} />
		{/each}
	{/if}

	{#if hasMoreUsers}
		<div class="more">+ {[...users]?.length - 3}</div>
	{/if}

	{#if currentUser}
		<div class="current_user_container">
			<Avatar picture={currentUser.info?.picture} name={currentUser.info?.name} />
		</div>
	{/if}
</header>

<main>
	<section>
		{#if doc}
			{#each doc_display as text, i}
				<Block line_number={String(i)} {on_input} {text} {room} {is_typing} />
			{/each}
		{/if}
	</section>
</main>

<style>
	header {
		padding: 10px;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
	}

	.current_user_container {
		position: relative;
	}

	.more {
		display: flex;
		place-content: center;
		place-items: center;
		position: relative;
		border: 4px solid #fff;
		border-radius: 9999px;
		width: 56px;
		height: 56px;
		background-color: #9ca3af;
		margin-left: -0.75rem;
		color: #fff;
	}

	main {
		background: var(--color-background);
		padding: 20px;
		height: 80vh;
		margin: 5px;
	}
</style>
