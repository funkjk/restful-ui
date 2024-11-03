<script lang="ts">
    import Tooltip, { Wrapper } from "@smui/tooltip";
    export let value: any;
    export let length: number = 80;
    let text: string;
    let type: string;
    $: {
        if (Array.isArray(value)) {
            type = "array";
            text = JSON.stringify(value);
        } else if (typeof value === "object" && value !== null) {
            type = "object";
            text = JSON.stringify(value);
        } else {
            type = "string";
            text = String(value ?? "");
        }
    }
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
