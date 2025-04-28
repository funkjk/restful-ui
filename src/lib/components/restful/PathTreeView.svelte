<script lang="ts">
    import {
        methods,
        type RestfulOperation,
    } from "$lib/restful/RestfulOperation";
    import TreeView from "../common/TreeView.svelte";
    export let rootTree: PathTreeObject;
    export let currentOperation: RestfulOperation;
    import { page } from "$app/stores"; // TODO dont use page store outside page component
    import type { PathTreeObject } from "$lib/restful/PathTree";
    import { createLink } from "$lib/utils/utils";
    import { PAGE } from "./RestfulApiContent.svelte";

</script>

{#if rootTree}
    <TreeView
        tree={rootTree}
        let:tree
        selectTree={(currentOperation.path ?? "/")
            .split("/")
            .map((e) => e + "/")}
    >
        {#if tree && tree.targetApi}
            {#each methods as method (method)}
                {#if tree.targetApi.api[method]}
                    <a
                        href={createLink(
                            $page.route.id + "",
                            PAGE.OPERATION,
                            tree.targetApi.path,
                            method,
                            currentOperation.getAdditionalParameters(
                                tree.targetApi.path,
                            ),
                        )}
                    >
                        <span class="method">{method.toUpperCase()}</span></a
                    >{/if}
            {/each}
        {/if}
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
