<script>
	import Keyboard from "$components/Keyboard.svelte";
	import { onMount } from "svelte";
	/** @type {string[]} */
	let logs = ['hoge'];

	onMount(() => {
		electron.onLog((v) => {
			console.log('hoge')
			logs.push(v);
			logs = logs;
		});
		electron.onGlobalKeyboard((_e = {}, /** @type {import('node-global-key-listener').IGlobalKeyEvent} **/ e, /** @type {import('node-global-key-listener').IGlobalKeyDownMap} */ down) => {
			console.log(e, down);
			if (e.state==='DOWN'){
				keyNames.push(e.rawKey?.name);
				keyNames = keyNames;
			} 
		});
	});
	/** @type {string[]} */
	let keyNames = [];

	/** @type {(e: KeyboardEvent) => void } */
	// const onKeydown = (e) => {
	// 	console.log(e.key);
	// 	keyNames.push(e.key);
	// 	keyNames = keyNames;
	// 	electron.setTitle(e.key);
	// };

</script>

<!-- <svelte:window on:keydown={onKeydown}></svelte:window> -->

<svelte:head>
	<title>Overlay effect</title>
	<meta name="description" content="Overlay effect" />
</svelte:head>

<section>
	<div class="logs">
		{#each logs as log }
			<div>{log}</div>
		{/each}
	</div>
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
	.logs {
		background-color: white;
		position: absolute;
		top: 0;
		left: 0;
		font-size: 12px;
		color: black;
		opacity: 0.5;
	}
</style>
