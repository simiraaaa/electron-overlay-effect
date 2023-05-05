<script>
	import Keyboard from "$components/Keyboard.svelte";
	import Mouse from "$components/Mouse.svelte";
	import { settings } from "$lib/scripts/app";
	import { onMount } from "svelte";
	
	/** @type {string[]} */
	let logs = [];

	const log = (/** @type {any[]} */ ...args) => {
		logs.push(...args);
		logs = logs.slice(-60);
	};

	onMount(() => {
		electron.onLog(log);
		electron.onGlobalKeyboard((_e = {}, /** @type {import('node-global-key-listener').IGlobalKeyEvent} **/ e, /** @type {import('node-global-key-listener').IGlobalKeyDownMap} */ down) => {
			if (!$settings.enableKeyboard) return ;
			// log(`_raw: ${e._raw}, vKey: ${e.vKey}, name: ${e.name}, scanCode: ${e.scanCode}, rawKey._nameRaw: ${e.rawKey?._nameRaw}, rawKey.name: ${e.rawKey?.name}`);

			if (e.state === 'DOWN'){
				pushKey(e.rawKey?.name);
			}
		});
	});

	/**
	 * @typedef {{ id: Symbol; name: string }} KeyParam
	 */

	/** @type {KeyParam[]} */
	let keyParams = [];

	const pushKey = (key = '') => {
		keyParams.push({
			id: Symbol(),
			name: key,
		});
		keyParams = keyParams.slice(-10);
		keyParams = keyParams;
	};

	/** @type {(param: KeyParam) => void} */
	const onRemoveKeyboard = (param) => {
		keyParams = keyParams.filter((p) => p.id !== param.id);
	};

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
	<!-- svelte-ignore missing-declaration -->
	{#if isDev}
		<div class="logs">
			{#each logs.slice().reverse() as log}
				<div>{log}</div>
			{/each}
		</div>
	{/if}
	<div>
		{#if $settings.enableKeyboard}
			<!-- 一番最後のキーが真ん中に表示されるようにする -->
			<div class="key-view-container">
				{#each keyParams as param, i (param.id)}
					<div class="key-item">
						<Keyboard 
							keyName={param.name}
							index={i}
							keyListLength={keyParams.length}
							on:remove={() => onRemoveKeyboard(param)}
						/>
					</div>
				{/each}
			</div>
		{/if}
		
	</div>
</section>
{#if $settings.enableMouse}
	<Mouse {log}></Mouse>
{/if}


<style>
	section {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
		flex-grow: 1;
	}
	.logs {
		padding: 16px;
		background-color: white;
		position: absolute;
		top: 0;
		left: 0;
		font-size: 12px;
		color: black;
		opacity: 0.5;
	}

	.key-view-container {
		display: flex;
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		margin: auto;
		flex-direction: column;
		justify-content: end;
		align-items: center;
		flex-shrink: 0;
		flex-grow: 1;
	}

	.key-item {
		margin-bottom: 16px;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-shrink: 0;
		flex-grow: 1;
	}
</style>
