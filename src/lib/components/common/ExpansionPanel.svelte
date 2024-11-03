<script lang="ts">
    import { Icon } from "@smui/common";
    import { slide } from "svelte/transition";

    export let title: string = "";
    export let open = false;
    export let titleClass = "";
</script>

<div class="expansion-panel">
    <button
        class={"expansion-panel-title " + titleClass}
        on:click={() => (open = !open)}
    >
        <span style="margin:auto 0px;">
            {title}
        </span>
        <span
            ><Icon class="material-icons"
                >{open ? "expand_less" : "expand_more"}</Icon
            ></span
        >
    </button>
    {#if open}
        <div class="expansion-panel-inner" transition:slide={{ duration: 150 }}>
            <slot></slot>
        </div>
    {/if}
</div>

<style>
    .expansion-panel {
        flex: 1 0 100%;
        max-width: 100%;
        position: relative;
        border: 1px solid darkgray;
        box-shadow: 0px 1px 1px gray;
    }

    .expansion-panel-title {
        cursor: pointer;
        align-items: column;
        text-align: start;
        display: flex;
        line-height: 1;
        min-height: 30px;
        outline: none;
        padding: 16px 24px;
        width: 100%;
        border: none;
        justify-content: space-between;
        background-color: rgb(246, 246, 246);
    }
    .expansion-panel-title:hover {
        background-color: rgb(222, 222, 222);
    }
    .expansion-panel-inner {
        padding: 20px;
    }
</style>
