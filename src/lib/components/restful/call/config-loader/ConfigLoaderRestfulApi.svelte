<script lang="ts">
    import type { McpServerConfig } from "$lib/types/api-config";
    import ConfigRestfulApi from "./ConfigRestfulApi.svelte";

    let { configurationId }: { configurationId: string } = $props();
    let loadedConfigPromise: Promise<{
        configurationId: string;
        config: McpServerConfig;
    }> = $derived(loadConfig());
    async function loadConfig() {
        const config = await fetch("/api/mcp/configs/" + configurationId);
        const loadedConfig = await config.json();
        return loadedConfig;
    }
</script>

{#await loadedConfigPromise}
    <div>loading...</div>
{:then loadedConfig}
    {#if loadedConfig.configurationId === configurationId}
        <ConfigRestfulApi {configurationId} serverConfig={loadedConfig.config}
        ></ConfigRestfulApi>
    {/if}
{/await}
