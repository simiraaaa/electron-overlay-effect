<script>
	import Keyboard from "$components/Keyboard.svelte";


	/** @type {string[]} */
	let keyNames = [];

	/** @type {(e: KeyboardEvent) => void } */
	const onKeydown = (e) => {
		console.log(e.key);
		keyNames.push(e.key);
		keyNames = keyNames;
	};

</script>

<svelte:window on:keydown={onKeydown}></svelte:window>

<svelte:head>
	<title>Overlay effect</title>
	<meta name="description" content="Overlay effect" />
</svelte:head>

<section>
	<div>
		{#each keyNames as key_name }
			<Keyboard keyName={key_name}></Keyboard>
		{/each}
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
		flex-grow: 1;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>
