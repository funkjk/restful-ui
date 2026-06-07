<script lang="ts">
    import type { RestfulOperation } from "$lib/restful/RestfulOperation";
    import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
    import { notifyMessage } from "$lib/stores/ui";
    import Button, { Label } from "@smui/button";
    import Select, { Option } from "@smui/select";
    import { get } from "svelte/store";
    import { createLinkMapping } from "$lib/types/link-mapping";
    import {
        extractPathPrefixCandidates,
        getAvailableTargetParams,
        getBoundParams,
        migrateLinkMappings,
    } from "$lib/restful/linkMapping";

    let {
        config,
        currentOperation,
        response,
    }: {
        config: RestfulComponentConfig;
        currentOperation: RestfulOperation;
        response: unknown;
    } = $props();

    let selectedColumn = $state("");
    let selectedTargetPath = $state("");
    let selectedTargetParam = $state("");
    let expanded = $state(false);

    const arrayItems = $derived.by(() => {
        if (!Array.isArray(response) || response.length === 0) {
            return null;
        }
        return response as Record<string, unknown>[];
    });

    const columnOptions = $derived.by(() => {
        if (!arrayItems || arrayItems.length === 0) {
            return [];
        }
        const keys = new Set<string>();
        for (const item of arrayItems) {
            if (item && typeof item === "object") {
                for (const key of Object.keys(item)) {
                    keys.add(key);
                }
            }
        }
        return Array.from(keys).sort();
    });

    const targetPathOptions = $derived.by(() => {
        const paths = Object.keys(currentOperation.document.paths ?? {});
        return extractPathPrefixCandidates(paths);
    });

    const boundParams = $derived(getBoundParams(currentOperation.parameters));

    const availableTargetParams = $derived.by(() => {
        if (!selectedTargetPath) {
            return [];
        }
        return getAvailableTargetParams(selectedTargetPath, boundParams);
    });

    $effect(() => {
        if (columnOptions.length > 0 && !selectedColumn) {
            selectedColumn = columnOptions[0];
        }
    });

    $effect(() => {
        if (targetPathOptions.length > 0 && !selectedTargetPath) {
            selectedTargetPath = targetPathOptions[0];
        }
    });

    $effect(() => {
        if (availableTargetParams.length > 0) {
            if (!availableTargetParams.includes(selectedTargetParam)) {
                selectedTargetParam = availableTargetParams[0];
            }
        } else {
            selectedTargetParam = "";
        }
    });

    function addLink() {
        if (!selectedColumn || !selectedTargetPath || !selectedTargetParam) {
            notifyMessage.notify("Select column, target path prefix, and target param");
            return;
        }

        const mapping = createLinkMapping({
            sourcePath: currentOperation.path,
            sourceMethod: currentOperation.method ?? "get",
            column: selectedColumn,
            targetPath: selectedTargetPath,
            targetParam: selectedTargetParam,
        });

        const existing = migrateLinkMappings(get(config.storage.linkMappings));
        config.storage.linkMappings.set([...existing, mapping]);
        notifyMessage.notify("Link added");
        expanded = false;
    }
</script>

{#if arrayItems}
    <div style="margin-top: 12px; padding: 12px; border: 1px solid #e0e0e0; border-radius: 4px;">
        <Button onclick={() => (expanded = !expanded)}>
            <Label>{expanded ? "Hide Quick Add Link" : "Quick Add Link"}</Label>
        </Button>
        {#if expanded}
            <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
                <Select variant="outlined" bind:value={selectedColumn} label="Column" style="width:100%;">
                    {#each columnOptions as col}
                        <Option value={col}>{col}</Option>
                    {/each}
                </Select>
                <Select variant="outlined" bind:value={selectedTargetPath} label="Target path prefix" style="width:100%;">
                    {#each targetPathOptions as prefix}
                        <Option value={prefix}>{prefix}</Option>
                    {/each}
                </Select>
                {#if availableTargetParams.length > 0}
                    <Select variant="outlined" bind:value={selectedTargetParam} label="Target param" style="width:100%;">
                        {#each availableTargetParams as param}
                            <Option value={param}>{param}</Option>
                        {/each}
                    </Select>
                {:else}
                    <p style="font-size: 0.875rem; color: #666;">
                        No linkable placeholder for the current operation context.
                    </p>
                {/if}
                <Button onclick={addLink} disabled={!selectedTargetParam}>
                    <Label>Add link</Label>
                </Button>
            </div>
        {/if}
    </div>
{/if}
