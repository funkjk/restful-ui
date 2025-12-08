<script lang="ts">
    import {
        methods,
        type RestfulOperation,
    } from "$lib/restful/RestfulOperation";
    import TreeView from "../../common/TreeView.svelte";
    let {
		rootTree,
		currentOperation,
		config
	}: {
		rootTree: PathTreeObject;
		currentOperation: RestfulOperation;
		config: RestfulComponentConfig;
	} = $props();
    import type { PathTreeObject } from "$lib/restful/PathTree";
    import { PAGE } from "$lib/utils/utils";
    import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
</script>

{#if rootTree}
    <TreeView
        tree={rootTree}
        selectTree={(currentOperation.path ?? "/")
            .split("/")
            .map((e) => e + "/")}
    >
        {#snippet content({ tree })}
            {@const pathTree = tree as PathTreeObject}
            {#if pathTree?.targetApi}
                {#each methods as method (method)}
                    {#if pathTree.targetApi?.api?.[method]}
                        <a
                            href={config.linkSupport.createLink({
                                page: PAGE.OPERATION,
                                restPath: pathTree.targetApi.path,
                                restMethod: method,
                                additionalSearch:
                                    currentOperation.getAdditionalParameters(
                                        pathTree.targetApi.path,
                                    ),
                            })}
                        >
                            <span class="method">{method.toUpperCase()}</span>
                        </a>
                    {/if}
                {/each}
            {/if}
        {/snippet}
    </TreeView>
{/if}

<style>
    .method {
        padding: 2px 3px;
        margin: 1px 2px;
        border-radius: 1ch;
        border-color: gray;
        background-color: rgb(86, 221, 158);
    }
</style>
