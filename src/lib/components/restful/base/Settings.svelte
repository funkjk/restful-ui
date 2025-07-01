<script lang="ts">
    import { type RestfulComponentConfig } from "$lib/restful/SvelteSupport";
    import Storage from "../setting/Storage.svelte";
    import Radio from "@smui/radio";
    import FormField from "@smui/form-field";
    import Request from "../setting/Request.svelte";
    import McpServer from "../setting/McpServer.svelte";
    export let config: RestfulComponentConfig;

    let options = [
        { name: "Request", value: Request },
        { name: "Storage", value: Storage },
        { name: "MCP Server", value: McpServer },
    ];
    let selected = options[0];
</script>

{#each options as option (option)}
    <FormField>
        <Radio bind:group={selected} value={option} />
        <span slot="label">
            {option.name}
        </span>
    </FormField>
{/each}

<svelte:component this={selected.value} {config} />
