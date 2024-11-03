<script lang="ts">
    import { settings, isInitilized } from "$lib/stores/settings";
    import Textfield from "@smui/textfield";
    import Button from "@smui/button";
    import { onMount } from "svelte";
    import {
        anypointFetch,
        getOrgnizationFromExtension,
        getProfileFromExtension,
        getTokenFromExtension,
        updateTokenWithExtension,
    } from "$lib/anypoint";
    import Select, { Option } from "@smui/select";

    let envId = "",
        orgId = "";
    let extensionId = "";
    let extensionPromise: Promise<void>;
    onMount(() => {
        envId = $settings.envId ?? "";
        orgId = $settings.orgId ?? "";
        extensionId = $settings.extensionId ?? "";
        extensionPromise = fetchFromExtension();

        extensionPromise.then(() => {
            fetchCloudhubPermission();
        });
    });
    function saveValue() {
        $settings.envId = envId;
        $settings.orgId = orgId;
        $settings.extensionId = extensionId;
    }

    let envList = [] as any[];

    let cloudhubPermissions = [] as any[];
    async function fetchCloudhubPermission() {
        try {
            const response = await anypointFetch(
                "/cloudhub/api/users/current/permissions",
            );
            cloudhubPermissions = response;
            console.log(response);
        } catch (e) {}
    }
    async function updateToken() {
        const token = await updateTokenWithExtension();
        extensionPromise = fetchFromExtension();

        extensionPromise.then(() => {
            fetchCloudhubPermission();
        });
    }

    async function fetchFromExtension() {
        await getTokenFromExtension();
        let profileResponse = (await getProfileFromExtension()) as any;
        console.log("profileResponse", profileResponse);
        if (profileResponse.success) {
            orgId =
                profileResponse.response.properties.cs_auth
                    .activeOrganizationId;
        }
        let orgnizationResponse = (await getOrgnizationFromExtension(
            orgId,
        )) as any;
        console.log("orgnizationResponse", orgnizationResponse);
        if (orgnizationResponse.success) {
            envList = orgnizationResponse.response.environments;
        }
    }
    function onFocus() {
        if (!$settings.isAuthorized) {
            getTokenFromExtension();
        }
    }
</script>

<svelte:window on:focus={onFocus} />

<div>
    <h3>Current Value</h3>
    <div>accessToken: {$settings.tokenString}</div>
    <div>orgId: {$settings.orgId}</div>
    <div>envId: {$settings.envId}</div>
    <div>isInitilized: {$isInitilized}</div>
    <div>isAuthorized: {$settings.isAuthorized}</div>
    {#await extensionPromise}
        <div>Loading...</div>
    {:then result}
        {#if !$settings.isAuthorized}
            <div>
                Access Token is invalid
                <Button on:click={updateToken}>Update Token</Button>
            </div>
        {/if}

        <h3>Update Value</h3>
        <Select bind:value={envId} label="Select Menu">
            {#each envList as env}
                <Option value={env.id}>{env.name}</Option>
            {/each}
        </Select>

        <Textfield
            bind:value={orgId}
            label="orgId"
            style="width: 100%;"
            helperLine$style="width: 100%;"
        ></Textfield>
        {#if orgId !== $settings.orgId}
            <p style="color: red;">orgId not match!</p>
        {/if}
    {/await}
    <Textfield
        bind:value={extensionId}
        label="extensionId"
        style="width: 100%;"
        helperLine$style="width: 100%;"
    ></Textfield>
    <Button on:click={saveValue}>save</Button>
</div>
