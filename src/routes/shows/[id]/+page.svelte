<script lang="ts">
	import Tip from '$lib/Tip.svelte';
	import { type Room, LiveList, type Client, createClient } from '@liveblocks/client';
	import { onDestroy, onMount } from 'svelte';
	export let data;
	$: ({ meta, notes, raw, raw_notes, path } = data);

	// Presence represents the properties that will exist on every User in the
	// Room and that will automatically be kept in sync. Accessible through the
	// `user.presence` property. Must be JSON-serializable.
	type Presence = {
		// cursor: { x: number, y: number } | null,
		// ...
		isTyping: boolean;
	};
	// Optionally, Storage represents the shared document that persists in the
	// Room, even after all Users leave. Fields under Storage typically are
	// LiveList, LiveMap, LiveObject instances, for which updates are
	// automatically persisted and synced to all connected clients.
	type Storage = {
		doc: LiveList<string>;
	};
	let client: Client;
	let room: Room<Presence, Storage>;
	let roomId = 'live-avatars';
	let initial_list = [notes];
	let doc = new LiveList(initial_list);
	// Set up the client on load
	// Check inside src/routes/api/auth.ts for the serverless function
	onMount(async () => {
		overrideRoomId();
		client = createClient({
			authEndpoint: '/api/auth'
		});
		room = client.enter<Presence, Storage>(roomId, {
			initialPresence: {
				isTyping: false
			},
			initialStorage: {
				doc
			}
		});
	});
	onDestroy(() => {
		if (client && room) {
			client.leave(roomId);
		}
	});
	/**
	 * This function is used when deploying an example on liveblocks.io.
	 * You can ignore it completely if you run the example locally.
	 */
	function overrideRoomId() {
		const query = new URLSearchParams(window?.location?.search);
		const roomIdSuffix = query.get('roomId');
		if (roomIdSuffix) {
			roomId = `${roomId}-${roomIdSuffix}`;
		}
	}
</script>

<div class="container">
	<!-- {#if room}
		<App {room} />
	{/if} -->
	<!-- <Monoco meta={data.meta} notes={data.notes} raw={data.raw} /> -->
	{#if room}
		<Tip {meta} {notes} {raw} {raw_notes} {path} {room} />
	{/if}
</div>
