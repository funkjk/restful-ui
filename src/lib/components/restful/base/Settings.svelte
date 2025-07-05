<script lang="ts">
    import { type RestfulComponentConfig } from "$lib/restful/SvelteSupport";
    import Storage from "../setting/Storage.svelte";
    import Radio from "@smui/radio";
    import FormField from "@smui/form-field";
    import Request from "../setting/Request.svelte";
    import McpServer from "../setting/McpServer.svelte";
    import Persist from "../setting/Persist.svelte";
    export let config: RestfulComponentConfig;

    let options = [
        { name: "Request", value: Request },
        { name: "Storage", value: Storage },
        { name: "MCP Server", value: McpServer },
        { name: "Persist", value: Persist },
    ];
    let selected = options[0];
</script>

{#each options as option (option)}
    <FormField>
        <Radio bind:group={selected} value={option} />
        {#snippet label()}
            {option.name}
        {/snippet}
    </FormField>
{/each}

<svelte:component this={selected.value} {config} />
