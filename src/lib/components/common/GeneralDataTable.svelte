<script lang="ts">
    import type { SelectedColumn } from "$lib/utils/object-array";

	import ObjectNestableDataTable, {
	} from "$lib/components/common/ObjectNestableDataTable.svelte";

	import Textfield from "@smui/textfield";
	import { Pagination } from "@smui/data-table";
	import Select, { Option } from "@smui/select";
	import IconButton from "@smui/icon-button";
	import { Label } from "@smui/common";
	import { SvelteComponent } from "svelte";

	export let items: Record<string, any>[] = [];
	export let filterValue = "";
	let rowsPerPage = 10;
	let currentPage = 0;

	export let columns: string[] = [];
	type Component = $$Generic<typeof SvelteComponent>;
	export let columnView: { [key: string]: Component } = {};
	export let selectedColumns:SelectedColumn[] = []
	// export let selectedColumns = getSelectableHeaderColumn(items[0]).filter(
	// 	(e) => e.isTop,
	// );
	function filter(items: Record<string, any>[], filterValue: string) {
		const filterStrings = filterValue.split(" ");
		let retItems = items;
		for (let str of filterStrings) {
			retItems = retItems.filter((item) =>
				Object.keys(item).some((prop) =>
					(item[prop] + "").includes(str),
				),
			);
		}
		return retItems;
	}

	$: filterdItems = filter(items, filterValue);
	$: start = currentPage * rowsPerPage;
	$: end = Math.min(start + rowsPerPage, filterdItems.length);
	$: slice = filterdItems.slice(start, end);
	$: lastPage = Math.max(Math.ceil(filterdItems.length / rowsPerPage) - 1, 0);

	$: if (currentPage > lastPage) {
		currentPage = lastPage;
	}

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
columns.length = {columns.length}
{#each columns as column}
	{column},
{/each}

{#each selectedColumns as column}
	{column.path},
{/each}


<ObjectNestableDataTable
	items={slice}
	bind:selectedColumns
	{columnView}
>
	<div style="min-width: 100px;display:flex;" slot="tableOperation">
		<Textfield
			bind:value={filterValue}
			label="Filter"
			style="min-width:400px;"
		></Textfield>
	</div>
	<Pagination slot="paginate">
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

		<IconButton
			class="material-icons"
			action="first-page"
			title="First page"
			on:click={() => (currentPage = 0)}
			disabled={currentPage === 0}>first_page</IconButton
		>
		<IconButton
			class="material-icons"
			action="prev-page"
			title="Prev page"
			on:click={() => currentPage--}
			disabled={currentPage === 0}>chevron_left</IconButton
		>
		<IconButton
			class="material-icons"
			action="next-page"
			title="Next page"
			on:click={() => currentPage++}
			disabled={currentPage === lastPage}>chevron_right</IconButton
		>
		<IconButton
			class="material-icons"
			action="last-page"
			title="Last page"
			on:click={() => (currentPage = lastPage)}
			disabled={currentPage === lastPage}>last_page</IconButton
		>
	</Pagination>
</ObjectNestableDataTable>
