<script lang="ts">
    import GeneralDataTable from "$lib/components/common/GeneralDataTable.svelte";
    import GeneralJsonCard from "$lib/components/common/GeneralJsonCard.svelte";
    import PathLinkColumn from "./PathLinkColumn.svelte";
    import { writable } from "svelte/store";
    import type { RestfulOperation } from "$lib/restful/RestfulOperation";
    import {
    type RestfulComponentConfig,
} from "$lib/restful/RestfulInterfaces";
import { type SvelteCacheStore } from "$lib/adapters/svelte/RestfulSvelteAdapter";
    import { setContext } from "svelte";
    import SelectTableKey from "./SelectTableKey.svelte";
    import { syncObject } from "$lib/utils/ObjectStore";
    import type { SelectedRoot } from "$lib/utils/object-array";
    import { CardType, type DisplayTypes } from "$lib/utils/utils";
    let {
		config,
		currentOperation,
		cacheStore,
		response: responseProp,
		isErrorResponse: isErrorResponseProp
	}: {
		config: RestfulComponentConfig;
		currentOperation: RestfulOperation;
		cacheStore: SvelteCacheStore;
		response?: any;
		isErrorResponse?: boolean;
	} = $props();
	let response = $state<any>(responseProp ?? null);
	let isErrorResponse = $state(isErrorResponseProp ?? false);
	$effect(() => {
		response = responseProp ?? null;
		isErrorResponse = isErrorResponseProp ?? false;
	});
    const dataTableFilters = config.storage.dataTableFilters;
    const selectedTableKeys = config.storage.selectedTableKeys;
    const dataTableSelectedColumn = config.storage.dataTableSelectedColumn;
    const dataTableDisplayTypes = config.storage.dataTableDisplayTypes;


    const pathParameterNames =
        currentOperation.getPathParameterUnderTargetPath();
    const columnView: any = $derived.by(() => {
        const pathColumnView: any = {};
        for (let pathParam of pathParameterNames) {
            pathColumnView[pathParam] = PathLinkColumn;
        }
        const allProperties = currentOperation.getPropertyDefinitions();
        for (let column in allProperties) {
            // TODO current swagger-parser not support x- attributes
            if (allProperties[column]['x-restfului-link']) {
                pathColumnView[column] = PathLinkColumn;
            }
        }
        return pathColumnView;
    });
    // this store use for PathLinkColumn
    const operationStore = writable(currentOperation);
    $effect(() => {
        operationStore.set(currentOperation);
    });
    setContext("operationStore", operationStore);
    setContext("config", config);
    let key = $derived(`${currentOperation.method}:${currentOperation.path}`);
    let tableKey = $state("");
    let arrayResponseItems = $derived.by(() => {
        if (!response) {
            return null;
        }
        let obj: any = response;
        if (tableKey) {
            tableKey
                .split(".")
                .filter((key: string) => key)
                .forEach((e: string) => (obj = obj ? obj[e] : null));
        }
        if (Array.isArray(obj) && obj.length > 0) {
            return obj;
        } else {
            return null;
        }
    });

    let filter = $state("");
    let selectedColumns = $state<SelectedRoot>({selected:[]});
    let displayTypes = $state<DisplayTypes>({});
    $effect(() => {
        filter = syncObject(filter, dataTableFilters, key, "");
        tableKey = syncObject(tableKey, selectedTableKeys, key, "");
        selectedColumns = syncObject(selectedColumns,dataTableSelectedColumn , key, {selected:[]});
        displayTypes = syncObject(displayTypes,dataTableDisplayTypes , key, {});
    });
    // reset filter when tableKey is set
    function selectTableKey(key: string) {
        filter = "";
    }
</script>

<SelectTableKey bind:tableKey {response} onselect={selectTableKey}
></SelectTableKey>

{#if arrayResponseItems}
    <GeneralDataTable
        items={arrayResponseItems}
        {columnView}
        bind:selectedColumns
        bind:displayTypes
        bind:filterValue={filter}
    ></GeneralDataTable>
{/if}

<GeneralJsonCard data={response} title="response" open={!arrayResponseItems}
type={isErrorResponse? CardType.ERROR : undefined}
></GeneralJsonCard>
