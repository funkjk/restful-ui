<script lang="ts">
    import type { RestfulOperation } from "$lib/restful/RestfulOperation";
    import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";

    export let config: RestfulComponentConfig;
    export let value: string = "";
    export let column: string = "";
    export let item: object = {};
    export let currentOperation: RestfulOperation;

    $: operationList = currentOperation.getUnderOperations(column);

    $: additionalParamter = currentOperation.getAdditionalParameters();
</script>

{#each operationList as operation (operation)}
    <div>
        <a
            href={config.linkSupport.createLink({
                page: "operation",
                restPath: operation.path,
                restMethod: operation.method,
                additionalSearch: `${column}=${value}&${additionalParamter}`,
            })}
        >
            {operation.method}
            {operation.path}
        </a>
    </div>
{/each}
