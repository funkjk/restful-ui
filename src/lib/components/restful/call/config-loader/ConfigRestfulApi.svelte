<script lang="ts">
    import RestfulApi from "$lib/components/restful/base/RestfulApi.svelte";
    import {
        createRestfulComponentConfig,
        DefaultLinkSupport,
        RuningMode,
        SetLoadingPlugin,
        SetRequestPlugin,
        SvelteRestfulProxy,
        type ConfigLoaderComponentConfig,
        type LinkParameter,
        type RestfulComponentConfig,
    } from "$lib/restful/SvelteSupport";
    import type {
        McpServerConfig,
        McpServerConfigObject,
    } from "$lib/types/api-config";
    import {
        LoggingRestfulPlugin,
        LogMessage,
    } from "$lib/restful/BuiltInPlugins";
    import { loading, logMessages } from "$lib/stores/ui";
    import { writable } from "svelte/store";
    import Card, { Content } from "@smui/card";
    import { createProxyUrl } from "$lib/utils/proxy";

    export let serverConfig: McpServerConfig;
    export let configurationId: string;
    const url = serverConfig.openApiUrl;

    let config: ConfigLoaderComponentConfig;
    async function setConfig() {
        const messageLogger = {
            log(message: LogMessage): void {
                logMessages.update((e) => [...e, message]);
            },
        };
        const storageKey = "cid-" + configurationId;
        
        config = {
            ...createRestfulComponentConfig(storageKey, {
                runningMode: RuningMode.LOAD_CONFIG,
            }),
            configurationId: configurationId,
            config: serverConfig,
            runningMode: RuningMode.LOAD_CONFIG,
        };
        if (serverConfig.useProxy) {
            config.documentUrl = createProxyUrl(serverConfig.openApiUrl);
        } else {
            config.documentUrl = serverConfig.openApiUrl;
        }
        const requestSetting = writable(serverConfig.requestSettings);
        config.additionalPlugins = [
            new LoggingRestfulPlugin(messageLogger),
            new SetLoadingPlugin(loading),
            new SetRequestPlugin(requestSetting),
            new SvelteRestfulProxy(requestSetting),
        ];
        config.storage.requestSetting = requestSetting;
        config.storage.requestSetting.subscribe((value) => {
            fetch("/api/mcp/configs/" + configurationId, {
                method: "PUT",
                body: JSON.stringify({
                    ...serverConfig,
                    requestSettings: value,
                }),
            });
        });
        class PathParameterLinkSupport extends DefaultLinkSupport {
            createBasePath(_parameter: LinkParameter): string {
                if (_parameter.basePath) {
                    return _parameter.basePath + "#";
                } else {
                    return "/cid/" + configurationId + "/#";
                }
            }
        }
        config.linkSupport = new PathParameterLinkSupport("/");
    }
    async function updateServeronfig(serverName: string) {
        const requestServerConfig: McpServerConfig = {
            ...serverConfig,
            serverName: serverName,
        };
        const response = await fetch("/api/mcp/configs/" + configurationId, {
            method: "PUT",
            body: JSON.stringify(requestServerConfig),
        });
        if (response.ok) {
            serverConfig.serverName = serverName;
        }
    }
    setConfig();
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

<RestfulApi {config}></RestfulApi>
