<script lang="ts">
    import Checkbox from "$lib/components/common/Checkbox.svelte";
    import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
    import { notifyMessage } from "$lib/stores/ui";
    import Button from "@smui/button";
    import Textfield from "@smui/textfield";
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { getDefaultProxyBaseUrl } from "$lib/utils/proxy";
    let {config}:{config:RestfulComponentConfig} = $props();
    let headers: any[] = $state([]);
    let additionalQueryParameter = $state("");
    let basePath  = $state("");
    let useProxy: boolean = $state(false);
    let proxyBaseUrl = $state("");
    function addHeader() {
        headers = [...headers, { name: "", value: "" }];
    }
    addHeader();

    onMount(() => {
        const requestSetting = get(config.storage.requestSetting);
        headers = requestSetting.headers;
        if (!headers || headers.length == 0) {
            headers = [];
            addHeader();
        }
        additionalQueryParameter = requestSetting.additionalQueryParameter ?? "";
        basePath = requestSetting.basePath ?? "";
        useProxy = requestSetting.useProxy;
        proxyBaseUrl = requestSetting.proxyBaseUrl?.trim() || getDefaultProxyBaseUrl();
    });

    function save() {
        const storageHeaders = headers.filter((e) => e.name);
        config.storage.requestSetting.set({
            headers: storageHeaders,
            additionalQueryParameter,
            basePath,
            useProxy,
            proxyBaseUrl: proxyBaseUrl.trim() || getDefaultProxyBaseUrl(),
        });
        notifyMessage.notify("Save");
    }
    function clear() {
        headers = [];
        addHeader();
        additionalQueryParameter = "";
        basePath = "";
    }
</script>

<h3>Base Path</h3>

<Textfield bind:value={basePath} class="base-path" label="basePath" style="width:100%;" placeholder="https://www.example.com/api"></Textfield>

<h3>Use Proxy</h3>
<Checkbox bind:checked={useProxy} label="Use CORS proxy to call API"></Checkbox>
{#if useProxy}
<Textfield
    bind:value={proxyBaseUrl}
    label="Proxy base URL (cors-anywhere compatible)"
    style="width:100%;"
    placeholder={getDefaultProxyBaseUrl()}
></Textfield>
{/if}

<h3>Request Headers</h3>
{#each headers as header, index (index)}
    <div>
        <Textfield bind:value={header.name} label="name" style="width:30%;"
        ></Textfield>
        <Textfield bind:value={header.value} label="value" style="width:50%;"
        ></Textfield>
    </div>
{/each}
<Button onclick={addHeader}>Add</Button>

<h3>additional Query Parameters</h3>
<Textfield bind:value={additionalQueryParameter} label="value" style="width:100%;"></Textfield>

<Button onclick={save}>Save</Button>
<Button onclick={clear}>Clear</Button>
