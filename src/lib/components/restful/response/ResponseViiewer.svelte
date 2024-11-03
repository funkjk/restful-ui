<script lang="ts">
    import GeneralDataTable from "$lib/components/common/GeneralDataTable.svelte";
    import GeneralJsonCard, { CardType } from "$lib/components/common/GeneralJsonCard.svelte";
    import PathLinkColumn from "./PathLinkColumn.svelte";
    import { writable } from "svelte/store";
    import type { RestfulOperation } from "$lib/restful/RestfulOperation";
    import {
        type RestfulComponentConfig,
        type SvelteCacheStore,
    } from "$lib/restful/SvelteSupport";
    import { setContext } from "svelte";
    import SelectTableKey from "./SelectTableKey.svelte";
    import { syncObject } from "$lib/utils/ObjectStore";
    import type { HeaderColumn } from "$lib/components/common/ObjectNestableDataTable.svelte";
    export let config: RestfulComponentConfig;
    export let currentOperation: RestfulOperation;
    export let cacheStore: SvelteCacheStore;
    export let response: any = null;
    export let isErrorResponse = false
    const dataTableFilters = config.storage.dataTableFilters;
    const selectedTableKeys = config.storage.selectedTableKeys;
    const dataTableSelectedColumn = config.storage.dataTableSelectedColumn;

    let columnView: any = {};

    const pathParameterNames =
        currentOperation.getPathParameterUnderTargetPath();
    const pathColumnView: any = {};
    for (let pathParam of pathParameterNames) {
        pathColumnView[pathParam] = PathLinkColumn;
    }
    columnView = pathColumnView;
    // this store use for PathLinkColumn
    const operationStore = writable(currentOperation);
    $: {
        operationStore.set(currentOperation);
    }
    setContext("operationStore", operationStore);
    let key = `${currentOperation.method}:${currentOperation.path}`;
    let arrayResponseItems: any[] | null = null;
    $: {
        let obj: any = response;
        tableKey
            .split(".")
            .filter((key: string) => key)
            .forEach((e: string) => (obj = obj ? obj[e] : null));
        if (Array.isArray(obj)) {
            arrayResponseItems = obj;
        } else {
            arrayResponseItems = null;
        }
    }

    let filter: string;
    let tableKey: string;
    let selectedColumns: HeaderColumn[];
    $: {
        filter = syncObject(filter, dataTableFilters, key, "");
        tableKey = syncObject(tableKey, selectedTableKeys, key, "");
        selectedColumns = syncObject(selectedColumns,dataTableSelectedColumn , key, []);
    }
    // reset filter when tableKey is set
    function selectTableKey() {
        filter = "";
    }
</script>

<SelectTableKey bind:tableKey {response} on:select={selectTableKey}
></SelectTableKey>

{#if arrayResponseItems}
    <GeneralDataTable
        items={arrayResponseItems}
        {columnView}
        bind:selectedColumns
        bind:filterValue={filter}
    ></GeneralDataTable>
{/if}

<GeneralJsonCard data={response} title="response" open={!arrayResponseItems}
type={isErrorResponse? CardType.ERROR : undefined}
></GeneralJsonCard>
