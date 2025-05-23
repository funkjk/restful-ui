<script lang="ts" context="module">
    import {
        ObjectArray,
        ColumnDefinition,
        type SelectedRoot,
    } from "$lib/utils/object-array";
    function convertToDataTableHeaders(
        objectArray: ObjectArray,
        selectedColumns: SelectedRoot,
    ) {
        const selectedDefinition =
            objectArray.getSelectedColumnDefinition(selectedColumns);
        const headerRowSize = Math.max(
            ...selectedDefinition.map((e) => e.getKey().length),
        );
        const ret: DataTableHeaderColumn[][] = [];
        for (let rowIdx = 0; rowIdx < headerRowSize; rowIdx++) {
            ret[rowIdx] = [];
            for (let colIdx = 0; colIdx < selectedDefinition.length; colIdx++) {
                const def = selectedDefinition[colIdx];
                if (rowIdx > def.getKey().length - 1) {
                    ret[rowIdx].push({
                        dummyFlag: true,
                        parentFlag: false,
                    });
                } else if (rowIdx > def.getKey().length - 1) {
                    ret[rowIdx].push({
                        dummyFlag: false,
                        definition: def,
                        parentFlag: false,
                    });
                } else {
                    let parent: ColumnDefinition = def;
                    for (
                        let diffIdx = 0;
                        diffIdx < def.getKey().length - 1 - rowIdx;
                        diffIdx++
                    ) {
                        parent = def.parentColumn as ColumnDefinition;
                    }
                    if (
                        ret[rowIdx][colIdx - 1]?.definition
                            ?.getKey()
                            .join(".") === parent.getKey().join(".")
                    ) {
                        ret[rowIdx].push({
                            dummyFlag: true,
                            definition: parent,
                            parentFlag: true,
                        });
                    } else {
                        ret[rowIdx].push({
                            dummyFlag: false,
                            definition: parent,
                            parentFlag: true,
                        });
                    }
                }
            }
        }
        return ret;
    }
    interface DataTableHeaderColumn {
        definition?: ColumnDefinition;
        dummyFlag: boolean;
        parentFlag: boolean;
    }
    export enum DisplayType {
        LONG_STING = "LONG_STING",
        TIMESTAMP = "TIMESTAMP",
        DEFAULT = "DEFAULT",
    }
    export interface DisplayTypes {
        [propertyName: string]: DisplayType;
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
    export let displayTypes: DisplayTypes = {};
    export let selectedColumns: SelectedRoot = { selected: [] };
    let objectArray: ObjectArray = new ObjectArray(items);
    let selectedColumnDefinition: ColumnDefinition[];
    // let objectArray:ObjectArray = new ObjectArray(items, selectedColumns);
    let headers: DataTableHeaderColumn[][];
    let hidedColumns: ColumnDefinition[] = [];
    $: {
        if (!selectedColumns.selected || selectedColumns.selected.length === 0) {
            selectedColumns = objectArray.initialSelectedColumns;
        }
        selectedColumnDefinition =
            objectArray.getSelectedColumnDefinition(selectedColumns);
        headers = convertToDataTableHeaders(objectArray, selectedColumns);
        hidedColumns = objectArray
            .getFlattenDefinitons()
            .filter((e) => !e.isShowed(selectedColumns))
            .filter(
                (e) =>
                    !e.parentColumn ||
                    e.parentColumn?.isShowed(selectedColumns),
            );
    }
    function getCellDisplayType(column: ColumnDefinition): DisplayType {
        const propertyName = column.getKey().join(".");
        return displayTypes[propertyName] ?? DisplayType.DEFAULT;
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
        if (getCellDisplayType(column) == DisplayType.TIMESTAMP) {
            try {
                ret = dayjs(ret).toISOString();
            } catch (e) {
                console.error(e);
                ret = "timestamp format error " + ret;
            }
        }
        return ret;
    }
    function deselect(header: DataTableHeaderColumn) {
        selectedColumns = objectArray.deselect(
            selectedColumns,
            header.definition!.getKey(),
        );
    }
    enum MoveDirection {
        LEFT = "LEFT",
        RIGHT = "RIGHT",
        FIRST = "FIRST",
        LAST = "LAST",
    }
    function changeDataType(
        header: DataTableHeaderColumn,
        displayType: DisplayType,
    ) {
        const propertyName = header.definition!.getKey().join(".");

        if (displayType !== DisplayType.DEFAULT) {
            displayTypes = { ...displayTypes, [propertyName]: displayType };
        } else {
            displayTypes = Object.entries(displayTypes)
                .filter(([prop]) => prop !== propertyName)
                .reduce((prev, [prop, value]) => {
                    return { ...prev, [prop]: value };
                }, {});
        }
    }
    function move(header: DataTableHeaderColumn, direction: MoveDirection) {
        alert("to be implemented");
    }
    function expandShrink(header: DataTableHeaderColumn) {
        const m = header.definition?.isExpanded(selectedColumns)
            ? "shrink"
            : "expand";
        if (header.definition?.isExpanded(selectedColumns)) {
            selectedColumns = objectArray.expand(
                selectedColumns,
                header.definition!.getKey(),
            );
        } else {
            selectedColumns = objectArray.shrink(
                selectedColumns,
                header.definition!.getKey(),
            );
        }
    }

    export function selectHidedItem(column: ColumnDefinition) {
        selectedColumns = objectArray.select(selectedColumns, column.getKey());
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
                            {column.getKey().join(".")}
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
                        {#if header.dummyFlag === false}
                            {#if selectedColumns.selected.length > 1}
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
                                        {#if header.parentFlag === false}
                                            <Separator />
                                            {#each Object.values(DisplayType) as dataType, index (index)}
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
                                        {/if}
                                    </List>
                                </ActionMenu>
                            {/if}
                            {header.definition?.name}
                            {#if header.definition?.isExpandable()}
                                <IconButton
                                    class="material-icons"
                                    on:click={() => expandShrink(header)}
                                    >{header.definition?.isExpanded(
                                        selectedColumns,
                                    )
                                        ? "expand"
                                        : "unfold_less"}
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
                        class={"datacell-" +
                            column.columnType.toLocaleLowerCase()}
                    >
                        {#if columnView[column.name]}
                            <svelte:component
                                this={columnView[column.name]}
                                value={getCellValue(item, column)}
                                {item}
                                column={column.name}
                            ></svelte:component>
                        {:else if getCellDisplayType(column) == DisplayType.LONG_STING}
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
