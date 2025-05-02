<script lang="ts">
    import Textfield from "@smui/textfield";
    import Card, { Content, Actions } from "@smui/card";
    import Button, { Label } from "@smui/button";
    import { persisted } from "svelte-persisted-store";
    import UrlBasedRestfulApi from "$lib/components/restful/UrlBasedRestfulApi.svelte";
    import { createProxyUrl } from "$lib/utils/proxy";
    import Checkbox from "$lib/components/common/Checkbox.svelte";
    let url = persisted("base-url", "", { storage: "session" });
    let editingUrl: string =
        "https://raw.githubusercontent.com/github/rest-api-description/refs/heads/main/descriptions/ghes-3.9/ghes-3.9.2022-11-28.json";
    let useProxy: boolean = false;
</script>


{#if $url}
    <Card>
        <Content>
            <a href={$url} target="_blank">{$url}</a>
        </Content>
        <Actions>
            <Button on:click={() => url.set("")}>
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
            <Checkbox bind:checked={useProxy} label="Use Restful-UI Proxy to get OAS file"></Checkbox>
        </Content>
        <Actions>
            <Button
                on:click={() =>
                    url.set(useProxy ? createProxyUrl(editingUrl) : editingUrl)}
            >
                <Label>set</Label>
            </Button>
        </Actions>
    </Card>
{/if}
