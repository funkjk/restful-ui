<script lang="ts">
    import Menu from "@smui/menu";
    import List, { Item, Separator, Text } from "@smui/list";
    import { createEventDispatcher } from "svelte";
    import Button, { Label } from "@smui/button";
    import { getTargetNestKeys, isObjectArray } from "$lib/utils/utils";
    export let response: any = null;
    export let tableKey = "";
    const dispatch = createEventDispatcher();

    $: tableKeyCandidates = response
        ? getTargetNestKeys(response, isObjectArray)
        : [];

    let tableKeyMenu: Menu;
    function selectTableKey(key: string) {
        tableKey = key
        dispatch("select", key)
    }
</script>

{#if tableKeyCandidates.length > 0}
    <div style="display:flex; justify-content: flex-end;">
        <div style="min-width: 100px;">
            {#if tableKey}
                datatable using property "<span style=" margin:auto;"
                    >{tableKey}</span
                >"
            {/if}
            <span>
                <Button on:click={() => tableKeyMenu.setOpen(true)}>
                    <Label>Select Table Key</Label>
                </Button>
                <Menu bind:this={tableKeyMenu}>
                    <List>
                        <Item on:SMUI:action={() => selectTableKey("")}>
                            <Text>None</Text>
                        </Item>
                        <Separator />
                        {#each tableKeyCandidates as candidate}
                            <Item
                                on:SMUI:action={() => selectTableKey(candidate)}
                            >
                                <Text>{candidate}</Text>
                            </Item>
                        {/each}
                    </List>
                </Menu>
            </span>
        </div>
    </div>
{/if}
