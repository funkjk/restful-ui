<script lang="ts" context="module">
    export enum DataType {
        NORMAL = "NORMAL",
        LONG_STING = "LONG_STING",
        TIMESTAMP = "TIMESTAMP",
    }
    import { ObjectArray, ColumnDefinition, type SelectedColumn, ColumnType } from "$lib/utils/object-array";
    export function convertToDataTableHeaders(objectArray: ObjectArray) {
        const selectedDefinition = objectArray.getSelectedColumnDefinition();
        const headerRowSize = Math.max(
            ...selectedDefinition.map((e) => e.getKey().length),
        );
        const ret: DataTableHeaderColumn[][] = [];
        for (let rowIdx = 0; rowIdx < headerRowSize; rowIdx++) {
            ret[rowIdx] = selectedDefinition.map((def) => {
                if (rowIdx > def.getKey().length - 1) {
                    return {
                        dummyFlag: true,
                    };
                } else if (rowIdx == def.getKey().length - 1) {
                    return {
                        dummyFlag: false,
                        definition: def,
                    };
                } else {
                    let parent: ColumnDefinition = def;
                    for (
                        let diffIdx = 0;
                        def.getKey().length - 1 - rowIdx;
                        diffIdx++
                    ) {
                        parent = def.parentColumn as ColumnDefinition;
                    }
                    return {
                        dummyFlag: true,
                        definition: parent,
                    };
                }
            });
        }
        return ret;
    }
    interface DataTableHeaderColumn {
        definition?: ColumnDefinition;
        dummyFlag: boolean;
    }
</script>

<script lang="ts">
    import dayjs from "dayjs";

    import List, { Item, Separator } from "@smui/list";

    import Menu from "@smui/menu";

    import Button, { Label } from "@smui/button";

    import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
    import IconButton from "@smui/icon-button";
    import Short from "./Short.svelte";
    import ActionMenu from "./ActionMenu.svelte";
    type Component = $$Generic<typeof SvelteComponent>;
    // TODO key must string array like path?
    export let columnView: { [key: string]: Component } = {};

    export let items: Record<string, any>[];
    export let selectedColumns: SelectedColumn[];
    let selectedColumnDefinition:ColumnDefinition[]
    let objectArray:ObjectArray;
    let headers: DataTableHeaderColumn[][];
    $: {
        objectArray = new ObjectArray(items, selectedColumns)
        selectedColumns = objectArray.selected
        selectedColumnDefinition = objectArray.getSelectedColumnDefinition()
        console.log("$@selected", objectArray.selected)
        headers = convertToDataTableHeaders(objectArray)
    }
    function getCellValue(value: any, column: ColumnDefinition) {
        let ret = value;
        for (let prop of column.getKey()) {
            if (!ret[prop]) {
                return;
            } else {
                ret = ret[prop];
            }
        }
        // if (column.dataType == DataType.TIMESTAMP) {
        //     try {
        //         ret = dayjs(ret).toISOString();
        //     } catch (e) {
        //         console.error(e);
        //         ret = "timestamp format error " + ret;
        //     }
        // }
        return ret;
    }
    function deselect(header: DataTableHeaderColumn) {
        objectArray.deselect(header.definition!.getKey())
        console.log("deselect@selected", objectArray.selected)
        selectedColumns = objectArray.selected
        // selectedColumns = selectedColumns.filter(
        //     (e) => !equalsArray(header.column.path, e.path, false),
        // );
    }
    enum MoveDirection {
        LEFT = "LEFT",
        RIGHT = "RIGHT",
        FIRST = "FIRST",
        LAST = "LAST",
    }
    function changeDataType(header: DataTableHeaderColumn, dataType: DataType) {
        // const selectedIndex = selectedColumns.findIndex((e) =>
        //     equalsArray(e.path, header.column.path),
        // );
        // if (selectedIndex >= 0) {
        //     selectedColumns[selectedIndex].dataType = dataType;
        //     selectedColumns = [
        //         ...selectedColumns.slice(0, selectedIndex),
        //         selectedColumns[selectedIndex],
        //         ...selectedColumns.slice(selectedIndex + 1),
        //     ];
        // }
    }
    function move(header: DataTableHeaderColumn, direction: MoveDirection) {
        alert("to be implemented");
        console.log({ header, direction });
    }
    function expand(header: DataTableHeaderColumn) {
        // if (!header.expanded) {
        //     const selectExpandedColumns = selectableColumns.filter(
        //         (e) =>
        //             equalsArray(header.column.path, e.path, false) &&
        //             e.path.length == header.column.path.length + 1,
        //     );
        //     const addIndex = selectedColumns.findIndex((e) =>
        //         equalsArray(e.path, header.column.path),
        //     );
        //     selectedColumns = [
        //         ...selectedColumns.slice(0, addIndex),
        //         ...selectExpandedColumns,
        //         ...selectedColumns.slice(addIndex + 1),
        //     ];
        // } else {
        //     const firstIndex = selectedColumns.findIndex((e) =>
        //         equalsArray(header.column.path, e.path, false),
        //     );
        //     const lastIndex = selectedColumns.findLastIndex((e) =>
        //         equalsArray(header.column.path, e.path, false),
        //     );
        //     selectedColumns = [
        //         ...selectedColumns.slice(0, firstIndex),
        //         header.column,
        //         ...selectedColumns.slice(lastIndex + 1),
        //     ];
        // }
    }

    export function selectHidedItem(column: DataTableHeaderColumn) {
        // let addIndex = selectedColumns.length;
        // for (let index = 0; index < selectedColumns.length; index++) {
        //     for (let col of column.path) {
        //         for (let selCol of selectedColumns[index].path) {
        //             if (selCol == col) {
        //                 addIndex = index + 1;
        //             }
        //         }
        //     }
        // }
        // const preCols = selectedColumns.slice(0, addIndex);
        // const postCols = selectedColumns.slice(addIndex);

        // selectedColumns = [...preCols, column, ...postCols];
    }
    let menu: Menu;
</script>

<div style="display:flex;justify-content: space-between; ">
    <slot name="tableOperation"></slot>
<!-- 
    {#if hidedColumns.length > 0}
        <span style="min-width:180px">
            <Button on:click={() => menu.setOpen(true)}>
                <Label>Show hided column</Label>
            </Button>
            <Menu bind:this={menu}>
                <List>
                    {#each hidedColumns as column, index (index)}
                        <Item on:SMUI:action={() => selectHidedItem(column)}>
                            {column.path.join(".")}
                        </Item>
                    {/each}
                </List>
            </Menu>
        </span>
    {/if} -->
</div>

<DataTable style="width: 100%;">
    <Head>
        {#each headers as headerRow, index (index)}
            <Row>
                {#each headerRow as header, index (index)}
                    <Cell>
                        {#if header.definition !== undefined}
                            {#if selectedColumns.length > 1}
                                <ActionMenu>
                                    <IconButton
                                        let:openMenu
                                        slot="action"
                                        class="material-icons"
                                        on:click={openMenu}
                                        >menu
                                    </IconButton>
                                    <List>
                                        {#each Object.values(MoveDirection) as direction, index (index)}
                                            <Item
                                                on:SMUI:action={() =>
                                                    move(header, direction)}
                                            >
                                                {direction.toLocaleLowerCase()}
                                            </Item>
                                        {/each}
                                        <Separator />
                                        <Item
                                            on:SMUI:action={() =>
                                                deselect(header)}
                                        >
                                            delete
                                        </Item>
                                        <Separator />
                                        {#each Object.values(DataType) as dataType, index (index)}
                                            <Item
                                                on:SMUI:action={() =>
                                                    changeDataType(
                                                        header,
                                                        dataType,
                                                    )}
                                            >
                                                change to {dataType.toLocaleLowerCase()}
                                            </Item>
                                        {/each}
                                    </List>
                                </ActionMenu>
                            {/if}
                                {header.definition?.name}
                                {#if header.definition?.isExpandable()}
                                    <IconButton
                                        class="material-icons"
                                        on:click={() => expand(header)}
                                        >{header.definition
                                            ? "unfold_less"
                                            : "expand"}
                                    </IconButton>
                                {/if}
                        {/if}
                    </Cell>
                {/each}
            </Row>
        {/each}
    </Head>
    <Body>
        {#each items as item, index (index)}
            <Row>
                {#each selectedColumnDefinition as column, index (index)}
                    <Cell
                        class={"datacell-" + column.columnType.toLocaleLowerCase()}
                    >
                        {#if columnView[column.name]}
                            <svelte:component
                                this={columnView[column.name]}
                                value={getCellValue(item, column)}
                                {item}
                                column={column.name}
                            ></svelte:component>
                        {:else if column.columnType == ColumnType.STRING}
                            <Short
                                value={getCellValue(item, column)}
                                length={400}
                            ></Short>
                        {:else}
                            <Short value={getCellValue(item, column)}></Short>
                        {/if}
                    </Cell>
                {/each}
            </Row>
        {/each}
    </Body>
    <span slot="paginate">
        <slot name="paginate"></slot>
    </span>
</DataTable>

<style>
    :global(.datacell-long_sting) {
        width: inherit !important;
        overflow-wrap: break-word;
        word-wrap: break-word;
        white-space: normal;
    }
    :global(.mdc-data-table__cell, .mdc-data-table__header-cell) {
        width: initial;
    }
</style>
