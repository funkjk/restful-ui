<script lang="ts">
    import {
        DefaultDisplaySupport,
        SetLoadingPlugin,
        SetRequestPlugin,
        type RestfulComponentConfig,
    } from "$lib/restful/SvelteSupport";
    import {
        EmptyRestfulPlugin,
        RequestPathPluginChain,
        type RestfulPlugin,
    } from "$lib/restful/RestfulPlugin";
    import {
        LoggingRestfulPlugin,
        LogMessage,
    } from "$lib/restful/BuiltInPlugins";
    import { loading, logMessages } from "$lib/stores/ui";
    import RestfulApi from "./RestfulApi.svelte";
    import { persisted } from "svelte-persisted-store";
    import type { RestfulOperation } from "$lib/restful/RestfulOperation";
    export let url: string;
    let config: RestfulComponentConfig;

    function setConfig() {
        const messageLogger = {
            log(message: LogMessage): void {
                logMessages.update((e) => [...e, message]);
            },
        };
        let storageKey = "test";
        const responses = persisted(storageKey + "-responses", {} as any, {
            storage: "session",
        });
        const parameterHistories = persisted(
            storageKey + "-parameter-histories",
            {} as any,
            { storage: "session" },
        );
        const selectedTableKeys = persisted(
            storageKey + "-table-key",
            {} as any,
            { storage: "session" },
        );
        const dataTableFilters = persisted(
            storageKey + "-datatable-filter",
            {} as any,
            { storage: "session" },
        );
        const dataTableSelectedColumn = persisted(
            storageKey + "-datatable-selected",
            {} as any,
            { storage: "session" },
        );
        const requestSetting = persisted(
            storageKey + "-request-setting",
            {} as any,
            { storage: "session" },
        );
        const gitHubPlugin = new EmptyRestfulPlugin();
        gitHubPlugin.doRequestPath = (
            restfulOperation: RestfulOperation,
            chain: RequestPathPluginChain,
        ): string => {
            let initialValue = chain.next();
            return initialValue;
        };
        config = {
            documentUrl: url,
            storage: {
                responses,
                parameterHistories,
                dataTableFilters,
                dataTableSelectedColumn,
                selectedTableKeys,
                requestSetting,
            },
            additionalPlugins: [
                new LoggingRestfulPlugin(messageLogger),
                new SetLoadingPlugin(loading),
                new SetRequestPlugin(requestSetting),
                gitHubPlugin,
            ] as RestfulPlugin[],
            displaySupport: DefaultDisplaySupport,
        };
    }
    setConfig();
</script>

<RestfulApi {config}></RestfulApi>
