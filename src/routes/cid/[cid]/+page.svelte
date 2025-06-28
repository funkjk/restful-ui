<script lang="ts">
    import type { PageData } from "./$types";
    import RestfulApi from "$lib/components/restful/RestfulApi.svelte";
    import { createRestfulComponentConfig, DefaultLinkSupport, SetLoadingPlugin, SetRequestPlugin, SvelteRestfulProxy, type LinkParameter, type RestfulComponentConfig } from "$lib/restful/SvelteSupport";
    import type { McpServerConfig } from "$lib/types/api-config";
    import { LoggingRestfulPlugin, LogMessage } from "$lib/restful/BuiltInPlugins";
    import { loading, logMessages } from "$lib/stores/ui";
    import {  writable } from "svelte/store";
    import Card, { Content } from "@smui/card";
    import { createProxyUrl } from "$lib/utils/proxy";


    export let data: PageData;
    const serverConfig = data.config as McpServerConfig
    const cid = data.configurationId
    const url = serverConfig.openApiUrl

    let config:RestfulComponentConfig;
    function setConfig() {
        const messageLogger = {
            log(message: LogMessage): void {
                logMessages.update((e) => [...e, message]);
            },
        };
        const storageKey = "cid-" + cid;
        config = createRestfulComponentConfig(storageKey);
        if (serverConfig.useProxy) {
            config.documentUrl = createProxyUrl(serverConfig.openApiUrl)
        } else {
            config.documentUrl = serverConfig.openApiUrl
        }
        console.log("config.documentUrl", config.documentUrl)
        const requestSetting = writable(serverConfig.requestSettings)
        config.additionalPlugins = [
            new LoggingRestfulPlugin(messageLogger),
            new SetLoadingPlugin(loading),
            new SetRequestPlugin(requestSetting),
            new SvelteRestfulProxy(requestSetting),
        ];
        config.storage.requestSetting = requestSetting
        config.storage.requestSetting.subscribe((value) => {
            fetch("/api/mcp/configs/" + cid, {
                method: "PUT",
                body: JSON.stringify({...serverConfig, requestSettings: value})
            })
        })
        class PathParameterLinkSupport extends DefaultLinkSupport {
            createBasePath(_parameter: LinkParameter): string {
                return "/cid/" + cid + "/#";
            }
        }
        config.linkSupport = new PathParameterLinkSupport("/")
    }
    setConfig()
</script>

<Card style="margin-bottom: 10px;">
    <Content>
        <div>id: {cid}</div>
        {#if serverConfig.serverName}
            <div>name: {serverConfig.serverName}</div>
        {/if}
        <div>url: <a href={url} target="_blank">{url}</a></div>
    </Content>
</Card>


<RestfulApi {config}></RestfulApi>