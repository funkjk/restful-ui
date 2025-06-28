<script lang="ts">
    import {
        createRestfulComponentConfig,
        SetLoadingPlugin,
        type RestfulComponentConfig,
    } from "$lib/restful/SvelteSupport";
    import {
        LoggingRestfulPlugin,
        LogMessage,
    } from "$lib/restful/BuiltInPlugins";
    import { loading, logMessages } from "$lib/stores/ui";
    import RestfulApi from "./RestfulApi.svelte";
    export let url: string;
    export let config: RestfulComponentConfig | null = null;

    function setConfig() {
        const messageLogger = {
            log(message: LogMessage): void {
                logMessages.update((e) => [...e, message]);
            },
        };
        let storageKey = "test";
        config = createRestfulComponentConfig(storageKey);
        config.documentUrl = url;
        config.additionalPlugins = [
            new LoggingRestfulPlugin(messageLogger),
            new SetLoadingPlugin(loading),
            ...config.additionalPlugins,
        ];
    }
    setConfig();
</script>

{#if config}
    <RestfulApi {config}></RestfulApi>
{/if}
