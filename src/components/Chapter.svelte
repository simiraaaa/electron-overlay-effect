<script>
	export let text = '';

	let hovered = false;

	// electron のマウスを無効にしていても mouse over 系のイベントは発火する
	const onMouseEnter = () => {
		hovered = true;
	};

	const onMouseLeave = () => {
		hovered = false;
	};
	
</script>

{#key text}
	<div class="wrapper" class:hovered>
		<div class="chapter" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>{text}</div>
	</div>
{/key}


<style>
	.wrapper {
		max-width: 60%;
	}

	.chapter {
		pointer-events: none;
		background-color: #fff;
		color: #111;
		padding: 16px 32px;
		font-size: 40px;
		font-weight: bold;
		border-radius: 4px;
		width: 100%;
		word-break: break-all;

		animation: chapter-animation 0.5s ease forwards;
		animation-delay: 3s;
	}

	.wrapper.hovered {
		transition: opacity 96ms ease-in-out;
		opacity: 0.1;
	}

	@keyframes chapter-animation {
		/* from {
			transform: translateY(0vh);
		} */
		to {
			transform: translateY(calc(50vh - 50% - 10vh)) scale(0.8);
			opacity: 0.5;
			pointer-events: auto;
		}
	}

</style>
