<script lang="ts">
    import ExpansionPanel from "./ExpansionPanel.svelte";

    let {
		data = null,
		title = "",
		open = false,
		children
	}: {
		data?: any;
		title?: string;
		open?: boolean;
		children?: import("svelte").Snippet;
	} = $props();
	let openState = $state(open);


</script>

    <div class="expansion-panel">
        <ExpansionPanel {title} bind:open={openState}>

            <div>
                {#if children}
                    {@render children()}
                {/if}
            </div>
        </ExpansionPanel>
    </div>

<style>
    .expansion-panel {
        margin: 20px;
    }
</style>
