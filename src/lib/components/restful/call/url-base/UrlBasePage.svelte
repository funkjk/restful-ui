<script lang="ts">
    import Textfield from "@smui/textfield";
    import Card, { Content, Actions } from "@smui/card";
    import Button, { Label } from "@smui/button";
    import Select, { Option } from "@smui/select";
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
    const basePath = window.location.origin + import.meta.env.BUILD_BASE_PATH
    let editingUrl: string = $state(`${basePath}/oas/restful-api-sample-config.yaml`);
    let useProxy: boolean = $state(false);

    // サンプルOASファイルのリスト
    const sampleOasFiles = [
        {
            name: "Restful API Sample (Config)",
            url: `${basePath}/oas/restful-api-sample-config.yaml`,
            description: "RESTful API Sample"
        },
        {
            name: "GitHub API",
            url: "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json",
            description: "GitHub REST API v3"
        },
        {
            name: "Quip API",
            url: "https://quip.com/dev/automation/documentation/current/openapi-specs",
            description: "Quip REST API"
        },
        {
            name: "CloudHub API",
            url: `${basePath}/oas/cloudhub-api-1.0.33-fat-oas.json`,
            description: "CloudHub API"
        },
        {
            name: "Backlog API",
            url: `${basePath}/oas/backlog_oas.yml`,
            description: "Backlog API"
        }
    ];

    let selectedSampleIndex: number = $state(0);

    let config: RestfulComponentConfig | null = $state(null);
    $effect(() => {
        config = createConfig();
    });

    // selectedSampleIndexが変更されたときにselectSampleFileを呼び出す
    $effect(() => {
        selectSampleFile(selectedSampleIndex);
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

    function selectSampleFile(index: number) {
        selectedSampleIndex = index;
        editingUrl = sampleOasFiles[index].url;
    }
    const buildTime = import.meta.env.BUILD_TIME || 'unknown';
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
            <div style="margin-bottom: 16px;">
                <Select
                    bind:value={selectedSampleIndex}
                    label="Select Sample OAS File"
                    style="width: 100%;"
                >
                    {#each sampleOasFiles as file, index}
                        <Option value={index}>
                            {file.name}
                        </Option>
                    {/each}
                </Select>
            </div>
            
            <Textfield
                bind:value={editingUrl}
                style="width: 100%;"
                label="Open API URL"
            />
            {#if import.meta.env.BUILD_STATIC !== 'true'}
            <Checkbox
                bind:checked={useProxy}
                label="Use Restful-UI Proxy to get OAS file"
            ></Checkbox>
            {/if}
        </Content>
        <Actions>
            <Button
                onclick={() =>
                    url.set((import.meta.env.BUILD_STATIC === 'true' || !useProxy) ? editingUrl : createProxyUrl(editingUrl))}
            >
                <Label>set</Label>
            </Button>
        </Actions>
    </Card>
    </div>

    {#if import.meta.env.BUILD_STATIC !== 'true'}
        <div style="margin-left: 10px;">
            <ConfigList></ConfigList>
        </div>
    {/if}
</div>
<div style="position: fixed; bottom: 0; right: 0; padding: 8px; font-size: 12px; color: #666;">
    built at {buildTime}
</div>
{/if}
