<script lang="ts">
    import {
        RuningMode,
        type ConfigLoaderComponentConfig,
        type RestfulComponentConfig,
    } from "$lib/restful/RestfulInterfaces";

    
    import Card, { Content, Actions } from "@smui/card";
    import { notifyMessage } from "$lib/stores/ui";
    import { PAGE } from "$lib/utils/utils";
    import Button, { Label } from "@smui/button";
    import Textfield from "@smui/textfield";
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import GeneralJsonCard from "$lib/components/common/GeneralJsonCard.svelte";
    import IconButton from "@smui/icon-button";
    import { goto } from "$app/navigation";
    import type { ServerConfig } from "$lib/restful/config-server/ServerSupport";
    let { config }: { config: RestfulComponentConfig } = $props();
    let serverName = $state("");
    let openApiUrl = $state("");
    let serverVersion = $state("1.0.0");
    let timeout = $state(10000);
    let maxRetries = $state(3);
    if (config.runningMode === RuningMode.LOAD_CONFIG) {
        const loaderConfig = config as ConfigLoaderComponentConfig;
        serverName = loaderConfig.config.serverName;
        openApiUrl = loaderConfig.config.openApiUrl;
        serverVersion = loaderConfig.config.serverVersion;
        timeout = loaderConfig.config.timeout;
        maxRetries = loaderConfig.config.maxRetries;
    } else {
        openApiUrl = config.documentUrl!;
    }
    const serverCofig = $derived({
        openApiUrl: openApiUrl,
        useProxy: false,
        serverName,
        serverVersion,
        timeout,
        maxRetries,
        requestSettings: get(config.storage.requestSetting),
    });

    onMount(() => {});

    async function save() {
        const request: ServerConfig = {
            openApiUrl: config.documentUrl!,
            useProxy: false,
            serverName,
            serverVersion,
            timeout,
            maxRetries,
            requestSettings: get(config.storage.requestSetting),
        };
        const response = await fetch("/api/configs", {
            method: "POST",
            body: JSON.stringify(request),
        });
        if (response.ok) {
            notifyMessage.notify("Save");
            const data = await response.json();
            // Navigate directly to the config page
            await goto(`/cid/${data.configurationId}/#?*page=setting`);
            window.location.reload();
        } else {
            notifyMessage.notify("Save failed" + response.statusText);
        }
    }
    async function update() {
        const loaderConfig = config as ConfigLoaderComponentConfig;
        const request: ServerConfig = serverCofig;
        const response = await fetch(
            "/api/configs/" + loaderConfig.configurationId,
            {
                method: "PUT",
                body: JSON.stringify(request),
            },
        );
        if (response.ok) {
            notifyMessage.notify("Update");
            // Reload config from server to update local state
            const updatedConfigResponse = await fetch("/api/configs/" + loaderConfig.configurationId);
            if (updatedConfigResponse.ok) {
                const updatedConfig = await updatedConfigResponse.json();
                // Update local state with new values - use direct assignment to trigger reactivity
                if (updatedConfig.config) {
                    serverName = updatedConfig.config.serverName ?? serverName;
                    openApiUrl = updatedConfig.config.openApiUrl ?? openApiUrl;
                    serverVersion = updatedConfig.config.serverVersion ?? serverVersion;
                    timeout = updatedConfig.config.timeout ?? timeout;
                    maxRetries = updatedConfig.config.maxRetries ?? maxRetries;
                }
            }
        } else {
            notifyMessage.notify("Update failed" + response.statusText);
        }
    }
    function gotoTop() {
        const link = config.linkSupport.createLink({
            page: PAGE.TOP,
            basePath: `/`,
        });
        goto(link);
    }
    async function deleteServer() {
        const loaderConfig = config as ConfigLoaderComponentConfig;
        const response = await fetch(
            "/api/configs/" + loaderConfig.configurationId,
            {
                method: "DELETE",
            },
        );
        if (response.ok) {
            notifyMessage.notify("Delete");
            const link = config.linkSupport.createLink({
                page: PAGE.TOP,
                basePath: `/`,
            });
            goto(link);
        } else {
            notifyMessage.notify("Delete failed" + response.statusText);
        }
    }
    async function copy() {
        const loaderConfig = config as ConfigLoaderComponentConfig;
        const response = await fetch("/api/configs/copy", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "configurationId=" + loaderConfig.configurationId,
        });
        if (response.ok) {
            notifyMessage.notify("Copy");
            const data = await response.json();
            const link = config.linkSupport.createLink({
                page: PAGE.SETTING,
                basePath: `/cid/${data.configurationId}/`,
            });
            // dont use goto because it will not reload page
            window.location.href = link;
        } else {
            notifyMessage.notify("Copy failed" + response.statusText);
        }
    }
    async function downloadFile() {
        const content = JSON.stringify(serverCofig);
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        const fileName =
            config.runningMode === RuningMode.LOAD_CONFIG
                ? "serverConfig-" +
                  (config as ConfigLoaderComponentConfig).configurationId +
                  ".json"
                : "serverConfig.json";
        a.download = fileName;
        a.href = url;
        a.click();
    }
</script>

<h3>Persist</h3>

{#if config.runningMode === RuningMode.LOAD_CONFIG}
    <h4>ID: <span class="configuration-id">{(config as ConfigLoaderComponentConfig).configurationId}</span></h4>
{/if}

<Card>
    <Content>
        <h4>Server Name</h4>
        <Textfield bind:value={serverName} label="value" style="width:100%;"
        ></Textfield>
        <h4>Open API URL</h4>
        <Textfield bind:value={openApiUrl} label="value" style="width:100%;"
        ></Textfield>
    </Content>
    <Actions>
        {#if config.runningMode === RuningMode.LOAD_CONFIG}
            <Button onclick={update}>
                <Label>Update</Label>
            </Button>
        {:else if config.runningMode === RuningMode.SESSION_STORAGE}
            <Button onclick={save}>
                <Label>Save</Label>
            </Button>
        {/if}
    </Actions>
</Card>

<h3>
    Download file <IconButton class="material-icons" onclick={downloadFile}
        >download</IconButton
    >
</h3>
<GeneralJsonCard data={serverCofig} title="Server Config"></GeneralJsonCard>

{#if config.runningMode === RuningMode.LOAD_CONFIG}
    <h3>Other actions</h3>
    <Card>
        <Actions>
            <Button onclick={copy}>
                <Label>Copy</Label>
            </Button>
            <Button onclick={deleteServer}>
                <Label>Delete</Label>
            </Button>
            <Button onclick={gotoTop}>
                <Label>GoTo Top</Label>
            </Button>
        </Actions>
    </Card>
{/if}
