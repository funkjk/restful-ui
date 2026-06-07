<script lang="ts">
    import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
    import { notifyMessage } from "$lib/stores/ui";
    import Button, { Label } from "@smui/button";
    import Textfield from "@smui/textfield";
    import Select, { Option } from "@smui/select";
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import {
        createLinkMapping,
        defaultLinkMappingLabel,
        type LinkMapping,
    } from "$lib/types/link-mapping";
    import {
        extractPathParameterNames,
        getAvailableTargetParams,
        migrateLinkMappings,
        validateLinkMapping,
    } from "$lib/restful/linkMapping";

    let { config }: { config: RestfulComponentConfig } = $props();

    let mappings = $state<LinkMapping[]>([]);
    let sourcePath = $state("");
    let sourceMethod = $state("get");
    let column = $state("");
    let targetPath = $state("");
    let targetParam = $state("");
    let label = $state("");
    let validationWarnings = $state<string[]>([]);

    const methods = ["get", "post", "put", "patch", "delete"];

    const availableTargetParams = $derived.by(() => {
        if (!targetPath.trim()) {
            return [];
        }
        return getAvailableTargetParams(targetPath.trim(), {});
    });

    onMount(() => {
        mappings = migrateLinkMappings(get(config.storage.linkMappings));
    });

    $effect(() => {
        if (availableTargetParams.length > 0 && !targetParam) {
            targetParam = availableTargetParams[0];
        }
    });

    function buildDraftMapping(): LinkMapping {
        return createLinkMapping({
            sourcePath: sourcePath.trim(),
            sourceMethod: sourceMethod.trim(),
            column: column.trim(),
            targetPath: targetPath.trim(),
            targetParam: targetParam.trim(),
            label: label.trim() || undefined,
        });
    }

    function addMapping() {
        const draft = buildDraftMapping();
        validationWarnings = validateLinkMapping(draft);
        if (validationWarnings.some((w) => w.endsWith("is required"))) {
            notifyMessage.notify("Required fields are missing");
            return;
        }
        mappings = [...mappings, draft];
        resetForm();
    }

    function removeMapping(id: string) {
        mappings = mappings.filter((m) => m.id !== id);
    }

    function resetForm() {
        sourcePath = "";
        sourceMethod = "get";
        column = "";
        targetPath = "";
        targetParam = "";
        label = "";
        validationWarnings = [];
    }

    function save() {
        config.storage.linkMappings.set(migrateLinkMappings([...mappings]));
        notifyMessage.notify("Save");
    }
</script>

<h3>Link Mappings</h3>
<p style="font-size: 0.875rem; color: #666; margin-bottom: 16px;">
    Define links from response table columns to path prefixes (with placeholders) without modifying OpenAPI.
</p>

{#if mappings.length > 0}
    <h4>Saved mappings</h4>
    <ul style="list-style: none; padding: 0; margin-bottom: 24px;">
        {#each mappings as mapping (mapping.id)}
            <li
                style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px;"
            >
                <span style="flex: 1; font-size: 0.875rem;">
                    {mapping.sourceMethod.toUpperCase()} {mapping.sourcePath} → column
                    <strong>{mapping.column}</strong> → {defaultLinkMappingLabel(mapping)}
                </span>
                <Button onclick={() => removeMapping(mapping.id)}>
                    <Label>Remove</Label>
                </Button>
            </li>
        {/each}
    </ul>
{/if}

<h4>Add mapping</h4>
<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
    <Textfield bind:value={sourcePath} label="Source path" style="width:100%;" placeholder="/pet/findByStatus"></Textfield>
    <Select variant="outlined" bind:value={sourceMethod} label="Source method" style="width:100%;">
        {#each methods as method}
            <Option value={method}>{method.toUpperCase()}</Option>
        {/each}
    </Select>
    <Textfield bind:value={column} label="Column" style="width:100%;" placeholder="id"></Textfield>
    <Textfield
        bind:value={targetPath}
        label="Target path prefix"
        style="width:100%;"
        placeholder={"/pet/{petId}"}
    ></Textfield>
    {#if availableTargetParams.length > 0}
        <Select variant="outlined" bind:value={targetParam} label="Target param" style="width:100%;">
            {#each availableTargetParams as param}
                <Option value={param}>{param}</Option>
            {/each}
        </Select>
    {:else if targetPath.trim()}
        <p style="font-size: 0.875rem; color: #666;">
            No unresolved placeholders in target path prefix (or prefix has no placeholders).
        </p>
    {/if}
    <Textfield bind:value={label} label="Label (optional)" style="width:100%;"></Textfield>
</div>

{#if validationWarnings.length > 0}
    <ul style="color: #b71c1c; font-size: 0.875rem;">
        {#each validationWarnings as warning}
            <li>{warning}</li>
        {/each}
    </ul>
{/if}

<Button onclick={addMapping}>
    <Label>Add to list</Label>
</Button>
<Button onclick={save}>
    <Label>Save</Label>
</Button>
