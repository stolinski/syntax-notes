<script lang="ts">
	import Tip from '$lib/Tip.svelte';

	export let data;

	$: ({ meta, notes, raw, raw_notes, path } = data);
</script>

<div class="container">
	<!-- {#if room}
		<App {room} />
	{/if} -->
	<!-- <Monoco meta={data.meta} notes={data.notes} raw={data.raw} /> -->
	<Tip {meta} {notes} {raw} {raw_notes} {path} />
</div>
