<script>
	import Keyboard from "$components/Keyboard.svelte";
	import Mouse from "$components/Mouse.svelte";
	import { KEY_CONSTANTS, KEY_PRIORITIES, MODIFIER_KEYS, settings } from "$lib/scripts/app";
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
			const display_key = toDisplayKeyName(e.rawKey?.name);
			if (e.state === 'DOWN'){
				// pushKeys(e.rawKey?.name);
				pressedKeySet.add(display_key);
				let key_display_threshold = 2;
				if (pressedKeySet.has(KEY_CONSTANTS.shift)) {
					key_display_threshold++;
				}
				if (pressedKeySet.size >= key_display_threshold) {
					const display_keys = [...pressedKeySet].map(toDisplayKeyName).sort((a, b) => {
						let ap = Infinity;
						let bp = Infinity;
						if (a in KEY_PRIORITIES) {
							ap = KEY_PRIORITIES[a];
						}
						if (b in KEY_PRIORITIES) {
							bp = KEY_PRIORITIES[b];
						}
						return ap - bp;
					});
					if (isDisplayable(display_keys)) {
						pushKeys(display_keys);
					}
				}
			} else if (e.state === 'UP') {
				pressedKeySet.delete(display_key);
			}
		});
	});

	/**
	 * @typedef {{ id: Symbol; names: string[] }} KeyParam
	 */

	/** @type {KeyParam[]} */
	let keyParams = [];

	/** @type {Set<string>} */
	let pressedKeySet = new Set();

	/** @type {(keys: string[]) => void} */
	const pushKeys = (keys = []) => {
		keyParams.push({
			id: Symbol(),
			names: keys,
		});
		keyParams = keyParams.slice(-10);
		keyParams = keyParams;
	};

	/** @type {(keys: string[]) => boolean} */
	const isDisplayable = (keys = []) => {
		// shift を除く
		let has_modifier_key = false;
		let has_other_key = false;

		keys.forEach((key) => {
			if (MODIFIER_KEYS.has(key)) {
				if (key !== KEY_CONSTANTS.shift) {
					has_modifier_key = true;
				}
			} else {
				has_other_key = true;
			}
		});

		return has_modifier_key && has_other_key;
	};

	const toDisplayKeyName = (key = '') => {
		// 暫定対応
		if (key === 'RightShift' || key === 'Shift') {
			return KEY_CONSTANTS.shift;
		} else if (key === 'RightControl' || key === 'Control') {
			return KEY_CONSTANTS.control;
		} else if (key === 'RightOption' || key === 'Option') {
			return KEY_CONSTANTS.option;
		} else if (key === 'RightCommand' || key === 'Command') {
			return KEY_CONSTANTS.command;
		} else if (key === 'Escape') {
			return KEY_CONSTANTS.escape;
		} else if (key === 'Tab') {
			return KEY_CONSTANTS.tab;
		} else if (key === 'Return') {
			return KEY_CONSTANTS.return;
		} else if (key === 'Delete') {
			return KEY_CONSTANTS.delete;
		} else {
			return key;
		}
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
							keyNames={param.names}
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
		left: 0;
		right: 0;
		bottom: 33%;
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
