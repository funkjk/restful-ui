<script lang="ts">
	import { settings, isInitilized } from "../../stores/settings";
	import UpdateTokenDialog from "./UpdateTokenDialog.svelte";

	export let openDialog = false;

	function gotoSettings() {
		openDialog = true;
	}
</script>

{#if openDialog}
	<UpdateTokenDialog open={openDialog}></UpdateTokenDialog>
{/if}

{#if !$settings.isAuthorized}
	not authorized
	<button on:click={gotoSettings}>update token</button>
{/if}

{#if !$isInitilized}
	not isInitilized
	<button on:click={gotoSettings}>gotoSettings</button>
{/if}
