<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ user } = data);
	$: console.log('user', user);
</script>

{#if user}
	<h1>Logged in as: {user.login}</h1>
	<img src={user.avatar_url} alt="Github Avatar" />
{/if}
