<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let open = true;
    export let disabled = false;
    export let tooltip = true;

    let moving = false;
    function onMouseDown() {
        if (!disabled) {
            moving = true;
        }
    }
    function onMouseUp(e: MouseEvent) {
        moving = false;
    }
    const dispatch = createEventDispatcher();
    function onMouseMove(e: MouseEvent) {
        if (moving) {
            dispatch("dragging", e);
        }
    }
</script>

<div
    on:mousedown={onMouseDown}
    class={disabled ? "" : moving ? "drag-target-moving" : "drag-target"}
>
    <slot></slot>
</div>

<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} />

<style>
    .drag-target {
        cursor: grab;
    }
    .drag-target-moving {
        cursor: grabbing;
    }
</style>
