<script lang="ts">
	import './style.css';
</script>

<header>
	<h1>Syntax</h1>
	<nav>
		<a href="/shows">◀️ Shows</a>
	</nav>
</header>

<slot />

<style>
	h1 {
		font-size: var(--font-size-base);
	}
</style>
