<script lang="ts">
    import RestfulApi from "$lib/components/restful/RestfulApi.svelte";
    import Textfield from "@smui/textfield";
    import { createDefaultConfig } from "$lib/anypoint";
    import Card, {
        Content,
        PrimaryAction,
        Actions,
        ActionButtons,
        ActionIcons,
    } from "@smui/card";
    import Button, { Label } from "@smui/button";
    import IconButton, { Icon } from "@smui/icon-button";
    import { writable } from "svelte/store";
    import { persisted } from "svelte-persisted-store";
    import UrlBasedRestfulApi from "$lib/components/restful/UrlBasedRestfulApi.svelte";
    let url = persisted("base-url", "", {storage: "session"});
    let editingUrl: string =
        "https://raw.githubusercontent.com/github/rest-api-description/refs/heads/main/descriptions/ghes-3.9/ghes-3.9.2022-11-28.json";
    // let editingUrl: string =
    //     "http://localhost:4210/DAPI_swagger_messages_V2.yaml";
</script>

{#if $url}
    <Card>
        <Content>
            {$url}
        </Content>
        <Actions>
            <Button on:click={() => (url.set(""))}>
                <Label>clear</Label>
            </Button>
        </Actions>
    </Card>

    <UrlBasedRestfulApi url={$url}></UrlBasedRestfulApi>
{:else}
    <Card>
        <Content>
            <Textfield
                bind:value={editingUrl}
                style="width: 100%;"
                label="Open API URL"
            ></Textfield>
        </Content>
        <Actions>
            <Button on:click={() => (url.set(editingUrl))}>
                <Label>set</Label>
            </Button>
        </Actions>
    </Card>
{/if}
