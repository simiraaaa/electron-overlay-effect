<script>
	import { onMount } from 'svelte';
	import './styles.css';
	import { init } from '$lib/scripts/app';

	let initialized = false;
	onMount(async () => {
		await init();
		initialized = true;
	});
</script>

<div class="app">
	{#if initialized}
		<main>
			<slot />
		</main>
	{/if}
</div>

<style>
	.app {
		padding: 8px;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
