<script lang="ts">
	import Header from "../lib/components/app/Header.svelte";
	import "../app.css";
	import CircularProgress from "@smui/circular-progress";
	import { loading, logMessages, notifyMessage } from "$lib/stores/ui";
	import Snackbar, { Label } from "@smui/snackbar";
	import LogPanel from "$lib/components/restful/base/LogPanel.svelte";
	import { persisted } from "svelte-persisted-store";
	import { ClerkProvider } from "svelte-clerk";
	import { onMount } from "svelte";
	import { initServiceWorker } from "$lib/services/service-worker-init";
	
	let snackbar = $state<Snackbar | null>(null);
	let open = persisted("ui.open-log-panel", true);
	
	// ServiceWorkerを初期化
	onMount(() => {
		initServiceWorker().catch(console.error);
	});
	
	$effect(() => {
		const unsubscribe = notifyMessage.subscribe((message: string) => {
			if (snackbar && message) {
				snackbar.open();
			}
		});
		return unsubscribe;
	});
</script>

<ClerkProvider>
	<div class="app">
		<Header />

		<main style={$open ? "padding-bottom: 200px;" : "padding-bottom: 15px;"}>
			<slot />
		</main>

		<footer>
			<LogPanel logs={logMessages} bind:open={$open}></LogPanel>
		</footer>
	</div>

	<Snackbar leading bind:this={snackbar}>
		<Label>{$notifyMessage}</Label>
	</Snackbar>

	{#if $loading}
		<div id="loading">
			<div class="progress">
				<CircularProgress
					style="height: 100px; width: 100px;"
					indeterminate
				/>
			</div>
		</div>
	{/if}
</ClerkProvider>

<style>
	#loading {
		width: 100vw;
		height: 100vh;
		transition: all 1s;
		background-color: gray;
		opacity: 0.5;
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
	}
	.progress {
		display: flex;
		width: 100vw;
		height: 100vh;
		justify-content: center;
		align-items: center;
		margin-right: auto;
		margin-left: auto;
	}
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		position: fixed;
		display: flex;
		left: 0;
		bottom: 0;
		width: 100vw;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	footer a {
		font-weight: bold;
	}
</style>
