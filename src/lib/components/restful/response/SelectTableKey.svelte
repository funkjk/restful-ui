<script lang="ts">
    import Menu from "@smui/menu";
    import List, { Item, Separator, Text } from "@smui/list";
    import Button, { Label } from "@smui/button";
    import { getTargetNestKeys, isObjectArray } from "$lib/utils/utils";
	let { onselect, tableKey, response } : { onselect: (key: string) => void, tableKey: string, response: any } = $props();
    let tableKeyCandidates = $derived(response
        ? getTargetNestKeys(response, isObjectArray)
        : []);

    let tableKeyMenu: Menu;
    function selectTableKey(key: string) {
        tableKey = key
        onselect(key)
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
                <Button onclick={() => tableKeyMenu.setOpen(true)}>
                    <Label>Select Table Key</Label>
                </Button>
                <Menu bind:this={tableKeyMenu}>
                    <List>
                        <Item onSMUIaction={() => selectTableKey("")}>
                            <Text>None</Text>
                        </Item>
                        <Separator />
                        {#each tableKeyCandidates as candidate (candidate)}
                            <Item
                                onSMUIaction={() => selectTableKey(candidate)}
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
