<script>
	import { fly } from "svelte/transition";

	export let keyName = '';

</script>

<div class="key" transition:fly={{duration: 64, y: 32}}>{keyName}</div>

<style>
	.key {
		opacity: 0.7;
		background: rgba(64, 64, 64, 0.7);
		padding: 8px 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 36px;
		font-weight: bold;
		border-radius: 8px;
		/* -webkit-text-stroke: 1px black; */
		box-shadow: 1px 1px 3px 1px rgba(0, 0, 0, 0.5);
		color: rgba(255, 255, 255, 1);
		/* shadow を重ねることで縁取りしてる感じを出す */
		text-shadow: 0 0 2px rgba(0, 0, 0, 1),
			0 0 2px rgba(0, 0, 0, 1),
			0 0 2px rgba(0, 0, 0, 1),
			0 0 2px rgba(0, 0, 0, 1),
			0 0 2px rgba(0, 0, 0, 1),
			0 0 2px rgba(0, 0, 0, 1);
	}


</style>
