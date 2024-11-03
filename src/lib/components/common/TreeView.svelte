<script context="module" lang="ts">
    const _expansionState = {} as any;
    export interface TreeObject {
        label: string;
        children: TreeObject[];
    }
</script>

<script lang="ts">
    export let tree: TreeObject;
    export let selectTree : string[]
    const { label, children } = tree;
    export let treePath: string[] = [label]
    let isSelectedTree = treePath.every((e,idx) => selectTree[idx] == e)
    $: {
        isSelectedTree = treePath.every((e,idx) => selectTree[idx] == e)
    }

    let expanded = _expansionState[label] || isSelectedTree;
    const toggleExpansion = () => {
        expanded = _expansionState[label] = !expanded;
    };
    $: arrowDown = expanded;
</script>
<ul>
    <li>
        <span class={isSelectedTree? "selected": ""}>
            {#if children && children.length > 0}
            <span on:click={toggleExpansion}>
                <span class="arrow" class:arrowDown>&#x25b6</span>
                {label}
            </span>
        {:else}
            <span>
                <span class="no-arrow" />
                {label}
            </span>
        {/if}
        </span>
        <slot {tree} />
        {#if expanded}
            {#each children as child}
                <svelte:self tree={child} let:tree={childTree} {selectTree} treePath={[...treePath, child.label]}>
                    <slot tree={childTree} />
                </svelte:self>
            {/each}
        {/if}
    </li>
</ul>

<style>
    ul {
        margin: 0;
        list-style: none;
        padding-left: 1.2rem;
        user-select: none;
    }
    .no-arrow {
        padding-left: 1rem;
    }
    .arrow {
        cursor: pointer;
        display: inline-block;
    }
    .arrowDown {
        transform: rotate(90deg);
    }
    .selected {
        color: rgb(66, 66, 221);
    }
</style>
