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
    } from "$lib/adapters/svelte/RestfulSvelteAdapter";
    import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
    import {
        LoggingRestfulPlugin,
        type LogMessage,
    } from "$lib/restful/BuiltInPlugins";
    import { loading, logMessages } from "$lib/stores/ui";
    import RestfulApi from "../../base/RestfulApi.svelte";
    import ConfigList from "$lib/components/restful/call/config-loader/ConfigList.svelte";

    let url = persisted("base-url", "", { storage: "session" });
    const basePath = window.location.origin
    let editingUrl: string = $state(`${basePath}/oas/restful-api-sample_mcp-config.yaml`);
    let useProxy: boolean = $state(false);

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

<div style="display:flex; flex-direction: row;">
    <div style="width: 70%;">
        <Card>
            <Content>
            <Textfield
                bind:value={editingUrl}
                style="width: 100%;"
                label="Open API URL"
            />
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
    </div>

    <div style="margin-left: 10px;">
        <ConfigList></ConfigList>
    </div>
</div>

{/if}
