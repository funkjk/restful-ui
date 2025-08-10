<script lang="ts">
    import RestfulApi from "$lib/components/restful/base/RestfulApi.svelte";
    import {
        DefaultLinkSupport,
        RuningMode,
        type LinkParameter,
    } from "$lib/restful/RestfulInterfaces";
    import {
        createRestfulComponentConfig,
        SetLoadingPlugin,
        SetRequestPlugin,
        SvelteRestfulProxy,
    } from "$lib/adapters/svelte/RestfulSvelteAdapter";
    import {
        LoggingRestfulPlugin,
        LogMessage,
    } from "$lib/restful/BuiltInPlugins";
    import { loading, logMessages } from "$lib/stores/ui";
    import { writable } from "svelte/store";
    import Card, { Content } from "@smui/card";
    import { createProxyUrl } from "$lib/utils/proxy";
    import type { ServerConfig } from "$lib/restful/config-server/ServerSupport";

    class PathParameterLinkSupport extends DefaultLinkSupport {
        private configId: string;
        
        constructor(configId: string) {
            super("/");
            this.configId = configId;
        }
        
        createBasePath(_parameter: LinkParameter): string {
            if (_parameter.basePath) {
                return _parameter.basePath + "#";
            } else {
                return "/cid/" + this.configId + "/#";
            }
        }
    }

    let {
        serverConfig,
        configurationId,
    }: { serverConfig: ServerConfig; configurationId: string } = $props();

    const url = serverConfig.openApiUrl;

    let config = $derived(createConfig());
    async function createConfig() {
        const messageLogger = {
            log(message: LogMessage): void {
                logMessages.update((e) => [...e, message]);
            },
        };
        const storageKey = "cid-" + configurationId;

        const localConfig = {
            ...createRestfulComponentConfig(storageKey, {
                runningMode: RuningMode.LOAD_CONFIG,
            }),
            configurationId: configurationId,
            config: serverConfig,
            runningMode: RuningMode.LOAD_CONFIG,
        };
        if (serverConfig.useProxy) {
            localConfig.documentUrl = createProxyUrl(serverConfig.openApiUrl);
        } else {
            localConfig.documentUrl = serverConfig.openApiUrl;
        }
        const requestSetting = writable(serverConfig.requestSettings);
        localConfig.additionalPlugins = [
            new LoggingRestfulPlugin(messageLogger),
            new SetLoadingPlugin(loading),
            new SetRequestPlugin(requestSetting),
            new SvelteRestfulProxy(requestSetting),
        ];
        localConfig.storage.requestSetting = requestSetting;
        localConfig.storage.requestSetting.subscribe((value: any) => {
            fetch("/api/configs/" + configurationId, {
                method: "PUT",
                body: JSON.stringify({
                    ...serverConfig,
                    requestSettings: value,
                }),
            });
        });
        localConfig.linkSupport = new PathParameterLinkSupport(configurationId);
        return localConfig;
    }
</script>

<Card style="margin-bottom: 10px;">
    <Content>
        <div>id: {configurationId}</div>
        {#if serverConfig.serverName}
            <div>name: {serverConfig.serverName}</div>
        {/if}
        <div>url: <a href={url} target="_blank">{url}</a></div>
    </Content>
</Card>

{#await config}
    <div>loading...</div>
{:then resolvedConfig}
    <RestfulApi config={resolvedConfig}></RestfulApi>
{/await}
