<script lang="ts">
    import type { RestfulComponentConfig } from "$lib/restful/SvelteSupport";
    import { notifyMessage } from "$lib/stores/ui";
    import Button from "@smui/button";
    import { onMount } from "svelte";
    import { JSONEditor, Mode } from "svelte-jsoneditor";
    import { get, type Readable, type Writable } from "svelte/store";
    export let config: RestfulComponentConfig;
    const keys = [
        "dataTableFilters",
        "dataTableSelectedColumn",
        "parameterHistories",
        "responses",
        "selectedTableKeys",
    ];
    const inputValue = keys.reduce((prev, current) => {
         prev[current] = { json: {} };
         return prev
    }, {} as any);
    onMount(() => {
        keys.forEach(key => {
            const store = (config.storage as any)[key]  as Readable<any> 
            inputValue[key] = { json: get(store) };
        })
    });
    function save() {
        keys.forEach(key => {
            const store = (config.storage as any)[key]  as Writable<any> 
            store.set(inputValue[key].json)
        })
        notifyMessage.notify("Save");
    }
    function clear() {
        keys.forEach(key => {
            inputValue[key] = { json: {} };
        })
    }
</script>
{#each keys as key}
    
<div class="editor-box">
    <h4>{key}</h4>
    <JSONEditor bind:content={inputValue[key]} mode={Mode.text} />
</div>
{/each}


<Button on:click={save}>Save</Button>
<Button on:click={clear}>Clear</Button>

<style>
    :global(.editor-box > div) {
        max-height: 400px;
    }
</style>
