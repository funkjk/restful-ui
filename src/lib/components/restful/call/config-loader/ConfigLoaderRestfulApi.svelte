<script lang="ts">
    import type { McpServerConfig } from "$lib/types/api-config";
    import ConfigRestfulApi from "./ConfigRestfulApi.svelte";

    export let configurationId: string;
    let serverConfig: McpServerConfig;
    async function loadConfig() {
        const config = await fetch("/api/mcp/configs/" + configurationId)
        return config.json()
    }
    $: {
        loadConfig().then((config) => {
            serverConfig = config.config;
        })
    }
</script>


{#if serverConfig}
    <ConfigRestfulApi {configurationId} {serverConfig}></ConfigRestfulApi>
{/if}

