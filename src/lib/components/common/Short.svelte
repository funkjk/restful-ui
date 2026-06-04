<script lang="ts">
    import Tooltip, { Wrapper } from "@smui/tooltip";
    let {
		value,
		length = 80
	}: {
		value: any;
		length?: number;
	} = $props();
    let text = $derived.by(() => {
        if (Array.isArray(value)) {
            return JSON.stringify(value);
        } else if (typeof value === "object" && value !== null) {
            return JSON.stringify(value);
        } else {
            return String(value ?? "");
        }
    });
    let type = $derived.by(() => {
        if (Array.isArray(value)) {
            return "array";
        } else if (typeof value === "object" && value !== null) {
            return "object";
        } else {
            return "string";
        }
    });
</script>

{#if type == "object" || type == "array"}
    <Wrapper>
        <div>
            [{type}]
        </div>
        <Tooltip class="short-tooltip">{text}</Tooltip>
    </Wrapper>
{:else if text.length > length}
    <Wrapper>
        <div>
            {text.substring(0, length)}...
        </div>
        <Tooltip class="short-tooltip">{text}</Tooltip>
    </Wrapper>
{:else}
    {text}
{/if}

<style>
    :global(.short-tooltip > .mdc-tooltip__surface) {
        max-width: 800px !important;
    }
</style>
