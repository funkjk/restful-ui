<script lang="ts">
    import {
        DefaultDisplaySupport,
        SetLoadingPlugin,
        SetRequestPlugin,
        SvelteRestfulProxy,
        type RequestSetting,
        type RestfulComponentConfig,
    } from "$lib/restful/SvelteSupport";
    import { type RestfulPlugin } from "$lib/restful/RestfulPlugin";
    import {
        LoggingRestfulPlugin,
        LogMessage,
    } from "$lib/restful/BuiltInPlugins";
    import { loading, logMessages } from "$lib/stores/ui";
    import RestfulApi from "./RestfulApi.svelte";
    import { persisted } from "svelte-persisted-store";
    import { get } from "svelte/store";
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
            {} as RequestSetting,
            { storage: "session" },
        );
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
                new SvelteRestfulProxy(requestSetting),
            ] as RestfulPlugin[],
            displaySupport: DefaultDisplaySupport,
        };
    }
    setConfig();
</script>

<RestfulApi {config}></RestfulApi>
