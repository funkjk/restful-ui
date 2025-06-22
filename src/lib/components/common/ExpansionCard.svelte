<script lang="ts">
    import ExpansionPanel from "./ExpansionPanel.svelte";

    export let data: any = null;
    export let title: string = "";
    export let open = false;


</script>

    <div class="expansion-panel">
        <ExpansionPanel {title} {open}>

            <div>
                <slot></slot>
            </div>
        </ExpansionPanel>
    </div>

<style>
    .expansion-panel {
        margin: 20px;
    }
</style>
