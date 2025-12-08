<script module lang="ts">
    const _expansionState = {} as any;
    export interface TreeObject {
        label: string;
        children: TreeObject[];
        [key: string]: any; // Allow additional properties like targetApi
    }
</script>

<script lang="ts">
    let {
		tree,
		selectTree,
		treePath: treePathProp,
		content
	}: {
		tree: TreeObject;
		selectTree: string[];
		treePath?: string[];
		content?: import("svelte").Snippet<[{ tree: TreeObject }]>;
	} = $props();
	let treePath = $state(treePathProp ?? [tree.label]);
    const { label, children } = tree;
    let isSelectedTree = $derived(treePath.every((e,idx) => selectTree[idx] == e));

    let expanded = $state(_expansionState[label] || isSelectedTree);
    const toggleExpansion = () => {
        expanded = _expansionState[label] = !expanded;
    };
    let arrowDown = $derived(expanded);
</script>
<ul>
    <li>
        <span class={isSelectedTree? "selected": ""}>
            {#if children && children.length > 0}
            <span onclick={toggleExpansion}>
                <span class="arrow" class:arrowDown>&#x25b6</span>
                {label}
            </span>
        {:else}
            <span>
                <span class="no-arrow" />
                {label}
            </span>
        {/if}
            {#if content}
                {@render content({ tree })}
            {/if}
        </span>
        {#if expanded}
            {#each children as child (child.label)}
                <svelte:self tree={child} {selectTree} treePath={[...treePath, child.label]} {content} />
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
