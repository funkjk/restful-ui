<script lang="ts">
    import Textfield from "@smui/textfield";
    import Card, { Content, Actions } from "@smui/card";
    import Button, { Label } from "@smui/button";
    import { persisted } from "svelte-persisted-store";
    import { createProxyUrl } from "$lib/utils/proxy";
    import Checkbox from "$lib/components/common/Checkbox.svelte";
    import {
        createRestfulComponentConfig,
        SetLoadingPlugin,
        type RestfulComponentConfig,
    } from "$lib/restful/SvelteSupport";
    import {
        LoggingRestfulPlugin,
        type LogMessage,
    } from "$lib/restful/BuiltInPlugins";
    import { loading, logMessages } from "$lib/stores/ui";
    import RestfulApi from "../../base/RestfulApi.svelte";
    import { get } from "svelte/store";
    import type { ServerConfig } from "$lib/restful/serverSupport";
    let url = persisted("base-url", "", { storage: "session" });
    let editingUrl: string = $state("http://localhost:4210/oas/restful-api-sample_mcp-config.yaml");
    let useProxy: boolean = false;

    let config: RestfulComponentConfig | null = $state(null);
    $effect(() => {
        config = createConfig();
    });

    function createConfig() {
        if (!$url) {
            return null;
        }
        const messageLogger = {
            log(message: LogMessage): void {
                logMessages.update((e) => [...e, message]);
            },
        };
        let storageKey = "test";
        const config = createRestfulComponentConfig(storageKey);
        config.documentUrl = $url;
        config.additionalPlugins = [
            new LoggingRestfulPlugin(messageLogger),
            new SetLoadingPlugin(loading),
            ...config.additionalPlugins,
        ];
        return config;
    }
    async function save(serverName: string) {
        if (!config?.documentUrl) {
            return;
        }
        const serverConfig: ServerConfig = {
            openApiUrl: config.documentUrl,
            serverName: serverName,
            serverVersion: "1.0.0",
            timeout: 10000,
            maxRetries: 3,
            requestSettings: get(config.storage.requestSetting),
        };
        const response = await fetch("/api/configs", {
            method: "POST",
            body: JSON.stringify(serverConfig),
        });
        const data = await response.json();
        if (response.ok) {
            const { configurationId } = data;
            window.location.href = `/cid/${configurationId}`;
        }
    }
</script>

{#if $url}
    <Card>
        <Content>
            <a href={$url} target="_blank">{$url}</a>
        </Content>
        <Actions>
            <Button onclick={() => url.set("")}>
                <Label>clear</Label>
            </Button>
        </Actions>
    </Card>

    {#if config}
        <RestfulApi {config}></RestfulApi>
    {/if}
{:else}
    <Card>
        <Content>
            <Textfield
                bind:value={editingUrl}
                style="width: 100%;"
                label="Open API URL"
            ></Textfield>
            <Checkbox
                bind:checked={useProxy}
                label="Use Restful-UI Proxy to get OAS file"
            ></Checkbox>
        </Content>
        <Actions>
            <Button
                onclick={() =>
                    url.set(useProxy ? createProxyUrl(editingUrl) : editingUrl)}
            >
                <Label>set</Label>
            </Button>
        </Actions>
    </Card>
{/if}
