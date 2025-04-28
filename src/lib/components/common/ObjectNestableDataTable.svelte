<script lang="ts" context="module">
    export enum DataType {
        NORMAL = "NORMAL",
        LONG_STING = "LONG_STING",
        TIMESTAMP = "TIMESTAMP",
    }
    export interface HeaderColumn {
        propertyName: string;
        isObject: boolean;
        isTop: boolean;
        path: string[];
        dataType?: DataType;
    }
    export interface DataTableHeader {
        displayName: string;
        column: HeaderColumn;
        expanded: boolean;
        isFirstColumn: boolean;
    }
    export function getSelectableHeaderColumn(object: any): HeaderColumn[] {
        let selectablePaths = getTargetNestKeys2(object, () => true)
            .map((e) => range(e.length + 1).map((_, idx) => e.slice(0, idx)))
            .flat();
        selectablePaths = unique(
            selectablePaths.filter((e) => e.length > 0),
            equalsArray,
        );
        return selectablePaths.map((path) => {
            return {
                propertyName: path[path.length - 1],
                isObject:
                    selectablePaths.findIndex(
                        (e) =>
                            equalsArray(path, e, false) &&
                            e.length > path.length,
                    ) >= 0,
                isTop: path.length == 1,
                path,
            };
        });
    }
</script>

<script lang="ts">
    import dayjs from "dayjs";

    import List, { Item, Separator } from "@smui/list";

    import Menu from "@smui/menu";

    import Button, { Label } from "@smui/button";

    import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
    import {
        unique,
        range,
        equalsArray,
        getTargetNestKeys2,
    } from "$lib/utils/utils";
    import IconButton from "@smui/icon-button";
    import Short from "./Short.svelte";
    import ActionMenu from "./ActionMenu.svelte";
    type Component = $$Generic<typeof SvelteComponent>;
    // TODO key must string array like path?
    export let columnView: { [key: string]: Component } = {};

    export let items: Record<string, any>[];
    export let selectedColumns: HeaderColumn[];
    $: {
        if (selectedColumns.length == 0) {
            selectedColumns = selectableColumns.filter((e) => e.isTop);
        }
    }
    const selectableColumns = getSelectableHeaderColumn(items[0]);
    let hidedColumns: HeaderColumn[];
    $: {
        // not selected or not select child
        hidedColumns = selectableColumns.filter((header) => {
            return !selectedColumns.some((selected) =>
                equalsArray(header.path, selected.path, false),
            );
        });
        // not selected parent
        hidedColumns = hidedColumns.filter((header) => {
            return !selectedColumns.some((selected) =>
                equalsArray(selected.path, header.path, false),
            );
        });
        // ignore parent is already hided
        hidedColumns = hidedColumns.filter((header) => {
            return !hidedColumns.some(
                (hided) =>
                    equalsArray(hided.path, header.path, false) &&
                    !equalsArray(hided.path, header.path),
            );
        });
    }
    let headers: DataTableHeader[][] = [];
    $: {
        headers = [];
        selectedColumns.forEach((column, rowIndex) => {
            column.path.forEach((key, colIndex) => {
                if (!headers[colIndex]) {
                    headers[colIndex] = [];
                }
                const prevHeader = headers[colIndex][rowIndex - 1];
                let notFirstColumn = false;
                if (prevHeader && prevHeader.column) {
                    notFirstColumn = equalsArray(
                        column.path.slice(0, colIndex + 1),
                        prevHeader.column.path.slice(0, colIndex + 1),
                    );
                }
                const targetColumn = selectableColumns.find((e) =>
                    equalsArray(e.path, column.path.slice(0, colIndex + 1)),
                )!;
                headers[colIndex][rowIndex] = {
                    column: targetColumn,
                    displayName: column.path[colIndex],
                    expanded: false,
                    isFirstColumn: !notFirstColumn,
                };
                if (headers[colIndex - 1] && headers[colIndex - 1][rowIndex]) {
                    headers[colIndex - 1][rowIndex].expanded = true;
                }
            });
        });
    }
    function getCellValue(value: any, column: HeaderColumn) {
        let ret = value;
        for (let prop of column.path) {
            if (!ret[prop]) {
                return;
            } else {
                ret = ret[prop];
            }
        }
        if (column.dataType == DataType.TIMESTAMP) {
            try {
                ret = dayjs(ret).toISOString();
            } catch (e) {
                console.error(e);
                ret = "timestamp format error " + ret;
            }
        }
        return ret;
    }
    function deselect(header: DataTableHeader) {
        selectedColumns = selectedColumns.filter(
            (e) => !equalsArray(header.column.path, e.path, false),
        );
    }
    enum MoveDirection {
        LEFT = "LEFT",
        RIGHT = "RIGHT",
        FIRST = "FIRST",
        LAST = "LAST",
    }
    function changeDataType(header: DataTableHeader, dataType: DataType) {
        const selectedIndex = selectedColumns.findIndex((e) =>
            equalsArray(e.path, header.column.path),
        );
        if (selectedIndex >= 0) {
            selectedColumns[selectedIndex].dataType = dataType;
            selectedColumns = [
                ...selectedColumns.slice(0, selectedIndex),
                selectedColumns[selectedIndex],
                ...selectedColumns.slice(selectedIndex + 1),
            ];
        }
    }
    function move(header: DataTableHeader, direction: MoveDirection) {
        alert("to be implemented");
        console.log({header, direction});
    }
    function expand(header: DataTableHeader) {
        if (!header.expanded) {
            const selectExpandedColumns = selectableColumns.filter(
                (e) =>
                    equalsArray(header.column.path, e.path, false) &&
                    e.path.length == header.column.path.length + 1,
            );
            const addIndex = selectedColumns.findIndex((e) =>
                equalsArray(e.path, header.column.path),
            );
            selectedColumns = [
                ...selectedColumns.slice(0, addIndex),
                ...selectExpandedColumns,
                ...selectedColumns.slice(addIndex + 1),
            ];
        } else {
            const firstIndex = selectedColumns.findIndex((e) =>
                equalsArray(header.column.path, e.path, false),
            );
            const lastIndex = selectedColumns.findLastIndex((e) =>
                equalsArray(header.column.path, e.path, false),
            );
            selectedColumns = [
                ...selectedColumns.slice(0, firstIndex),
                header.column,
                ...selectedColumns.slice(lastIndex + 1),
            ];
        }
    }

    export function selectHidedItem(column: HeaderColumn) {
        let addIndex = selectedColumns.length;
        for (let index = 0; index < selectedColumns.length; index++) {
            for (let col of column.path) {
                for (let selCol of selectedColumns[index].path) {
                    if (selCol == col) {
                        addIndex = index + 1;
                    }
                }
            }
        }
        const preCols = selectedColumns.slice(0, addIndex);
        const postCols = selectedColumns.slice(addIndex);

        selectedColumns = [...preCols, column, ...postCols];
    }
    let menu: Menu;
</script>

<div style="display:flex;justify-content: space-between; ">
    <slot name="tableOperation"></slot>

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
    {/if}
</div>

<DataTable style="width: 100%;">
    <Head>
        {#each headers as headerRow, index (index)}
            <Row>
                {#each headerRow as header, index (index)}
                    <Cell>
                        {#if header && header.isFirstColumn}
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
                                        {#each Object.values(DataType) as dataType ,index (index)}
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
                            {#if header.displayName}
                                {header.displayName}
                                {#if header.column && header.column.isObject}
                                    <IconButton
                                        class="material-icons"
                                        on:click={() => expand(header)}
                                        >{header.expanded
                                            ? "unfold_less"
                                            : "expand"}
                                    </IconButton>
                                {/if}
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
                {#each selectedColumns as column, index (index)}
                    <Cell
                        class={column.dataType
                            ? "datacell-" + column.dataType.toLocaleLowerCase()
                            : ""}
                    >
                        {#if columnView[column.propertyName]}
                            <svelte:component
                                this={columnView[column.propertyName]}
                                value={getCellValue(item, column)}
                                {item}
                                column={column.propertyName}
                            ></svelte:component>
                        {:else if column.dataType == DataType.LONG_STING}
                            <Short
                                value={getCellValue(item, column)}
                                length={400}
                            ></Short>
                        {:else}
                            <Short value={getCellValue(item, column)}></Short>
                        {/if}
                    </Cell>
                <!-- {/each} -->
                    <Cell
                        class={column.dataType
                            ? "datacell-" + column.dataType.toLocaleLowerCase()
                            : ""}
                    >
                        {#if columnView[column.propertyName]}
                            <svelte:component
                                this={columnView[column.propertyName]}
                                value={getCellValue(item, column)}
                                {item}
                                column={column.propertyName}
                            ></svelte:component>
                        {:else if column.dataType == DataType.LONG_STING}
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
