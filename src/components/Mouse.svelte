<script>
	import { fly } from "svelte/transition";

	export let keyName = '';
	export let log = (/** @type {any[]} */ ...args) => console.log(...args);

	let x = 0;
	let y = 0;
	const size = 20;
	const stroke = 2;

	/** @type { (e: MouseEvent) => void } */
	const onMouseMove = (e) => {
		x = e.clientX;
		y = e.clientY;
		log(e.clientX, e.clientY);
	};


</script>

<svelte:body on:mousemove={onMouseMove}></svelte:body>

<div class="overlay">
	<div
		class="mouse" 
		style:--size={size}px 
		style:--size-wrap={size + stroke * 2}px
		style:--stroke={stroke}px
		style:--stroke-wrap={stroke}px
		style:--x={x}px
		style:--y={y}px
	></div>
</div>

<div class="key" transition:fly={{duration: 64, y: 32}}>{keyName}</div>

<style>
	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;

		background: rgba(0, 0, 0, 0.1);
	}

	.mouse {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: var(--size-wrap);
		height: var(--size-wrap);
		transform: translate3d(-50%, -50%, 1px);
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.5);
		border: var(--stroke-wrap) solid black;
	}

	.mouse::before {
		position: absolute;
		left: 0;
		top: 0;
		width: var(--size);
		height: var(--size);
		transform: translate3d(-50%, -50%, 1px);
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.5);
		border: var(--stroke) solid white;
	}


</style>
