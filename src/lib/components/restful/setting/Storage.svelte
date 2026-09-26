<script lang="ts">
    import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
    import { notifyMessage } from "$lib/stores/ui";
    import Button from "@smui/button";
    import { onMount } from "svelte";
    import { JSONEditor, Mode } from "svelte-jsoneditor";
    import { type Readable, type Writable } from "svelte/store";
    let { config }: { config: RestfulComponentConfig } = $props();
    const keys = [
        "dataTableFilters",
        "dataTableSelectedColumn",
        "dataTableDisplayTypes",
        "parameterHistories",
        "responses",
        "selectedTableKeys",
    ];
    let inputValue = $state(
        keys.reduce((prev, current) => {
            prev[current] = { json: {} };
            return prev;
        }, {} as Record<string, { json: unknown }>),
    );

    function cloneJson(value: unknown) {
        if (value == null || typeof value !== "object") {
            return {};
        }
        return JSON.parse(JSON.stringify(value));
    }

    onMount(() => {
        const unsubs = keys.map((key) => {
            const store = (config.storage as any)[key] as Readable<any>;
            return store.subscribe((value) => {
                inputValue[key] = { json: cloneJson(value) };
            });
        });
        return () => unsubs.forEach((unsub) => unsub());
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
{#each keys as key (key)}
    
<div class="editor-box">
    <h4>{key}</h4>
    <JSONEditor bind:content={inputValue[key]} mode={Mode.text} />
</div>
{/each}


<Button onclick={save}>Save</Button>
<Button onclick={clear}>Clear</Button>

<style>
    :global(.editor-box > div) {
        max-height: 400px;
    }
</style>
