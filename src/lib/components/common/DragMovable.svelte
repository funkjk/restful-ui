<script lang="ts">
    let {
		open = true,
		disabled = false,
		tooltip = true,
		ondragging,
		children
	}: {
		open?: boolean;
		disabled?: boolean;
		tooltip?: boolean;
		ondragging?: (e: CustomEvent<MouseEvent>) => void;
		children?: import("svelte").Snippet;
	} = $props();
	let openState = $state(open);

    let moving = $state(false);
    function onMouseDown() {
        if (!disabled) {
            moving = true;
        }
    }
    function onMouseUp() {
        moving = false;
    }
    function onMouseMove(e: MouseEvent) {
        if (moving) {
            ondragging?.(new CustomEvent("dragging", { detail: e }));
        }
    }
</script>

    <div
        on:mousedown={onMouseDown}
        class={disabled ? "" : moving ? "drag-target-moving" : "drag-target"}
    >
        {#if children}
            {@render children()}
        {/if}
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
