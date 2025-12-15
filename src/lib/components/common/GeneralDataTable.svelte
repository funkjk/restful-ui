<script lang="ts">
    import type { DisplayTypes } from "$lib/utils/utils";

	import {
		someKeywordInObject,
		type SelectedRoot,
	} from "$lib/utils/object-array";

	import ObjectNestableDataTable from "$lib/components/common/ObjectNestableDataTable.svelte";

	import Textfield from "@smui/textfield";
	import { Pagination } from "@smui/data-table";
	import Select, { Option } from "@smui/select";
	import IconButton from "@smui/icon-button";
	import { Label } from "@smui/common";
	import type { Snippet } from "svelte";

	let {
		items = [],
		filterValue = "",
		columnView = {},
		displayTypes = $bindable({} as DisplayTypes),
		selectedColumns = $bindable({ selected: [] } as SelectedRoot)
	}: {
		items?: Record<string, any>[];
		filterValue?: string;
		columnView?: { [key: string]: $$Generic<typeof SvelteComponent> };
		displayTypes?: DisplayTypes;
		selectedColumns?: SelectedRoot;
	} = $props();
	let itemsState = $state(items);
	let filterValueState = $state(filterValue);
	let columnViewState = $state(columnView);
	let rowsPerPage = $state(10);
	let currentPage = $state(0);

	function filter(items: Record<string, any>[], filterValue: string) {
		const filterStrings = filterValue.split(" ");
		let retItems = items;
		for (let str of filterStrings) {
			retItems = retItems.filter((item) =>
				someKeywordInObject(item, str),
			);
		}
		return retItems;
	}

	let filterdItems = $derived(filter(itemsState, filterValueState));
	let start = $derived(currentPage * rowsPerPage);
	let end = $derived(Math.min(start + rowsPerPage, filterdItems.length));
	let slice = $derived(filterdItems.slice(start, end));
	let lastPage = $derived(Math.max(Math.ceil(filterdItems.length / rowsPerPage) - 1, 0));

	$effect(() => {
		if (currentPage > lastPage) {
			currentPage = lastPage;
		}
	});

	// TODO sort
	// let sort: string;
	// let sortDirection: Lowercase<string> = "ascending";
	// function handleSort() {
	// 	items.sort((a, b) => {
	// 		const [aVal, bVal] = [a[sort], b[sort]][
	// 			sortDirection === "ascending" ? "slice" : "reverse"
	// 		]();
	// 		if (typeof aVal === "string" && typeof bVal === "string") {
	// 			return aVal.localeCompare(bVal);
	// 		}
	// 		return Number(aVal) - Number(bVal);
	// 	});
	// 	items = items;
	// }
</script>

<ObjectNestableDataTable
	items={slice}
	bind:selectedColumns
	bind:displayTypes
	columnView={columnViewState}
>
	{#snippet tableOperation()}
		<div style="min-width: 100px;display:flex;">
			<Textfield
				class="filter-textfield"
				bind:value={filterValueState}
				label="Filter"
				style="min-width:400px;"
			></Textfield>
		</div>
	{/snippet}
	{#snippet paginate()}
		<Pagination>
		<svelte:fragment slot="rowsPerPage">
			<Label>Rows Per Page</Label>
			<Select variant="outlined" bind:value={rowsPerPage} noLabel>
				<Option value={10}>10</Option>
				<Option value={25}>25</Option>
				<Option value={100}>100</Option>
			</Select>
		</svelte:fragment>
		<svelte:fragment slot="total">
			{start + 1}-{end} of {filterdItems.length}
		</svelte:fragment>

		<div>
			<span>total items: [{filterdItems.length}]</span>
			<span>page: [{currentPage + 1} of {lastPage + 1}]</span>
		</div>

		<IconButton
			class="material-icons"
			action="first-page"
			title="First page"
			onclick={() => (currentPage = 0)}
			disabled={currentPage === 0}>first_page</IconButton
		>
		<IconButton
			class="material-icons"
			action="prev-page"
			title="Prev page"
			onclick={() => currentPage--}
			disabled={currentPage === 0}>chevron_left</IconButton
		>
		<IconButton
			class="material-icons"
			action="next-page"
			title="Next page"
			onclick={() => currentPage++}
			disabled={currentPage === lastPage}>chevron_right</IconButton
		>
		<IconButton
			class="material-icons"
			action="last-page"
			title="Last page"
			onclick={() => (currentPage = lastPage)}
			disabled={currentPage === lastPage}>last_page</IconButton
		>
	</Pagination>
	{/snippet}
</ObjectNestableDataTable>
