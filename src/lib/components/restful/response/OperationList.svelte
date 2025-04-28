<script lang="ts">
    import type { RestfulOperation } from "$lib/restful/RestfulOperation";

    export let value: string = "";
    export let column: string = "";
    export let item: object = {};
    export let currentOperation: RestfulOperation;
    import { page } from "$app/stores"; // TODO dont use page store outside page component
    import { createLink } from "$lib/utils/utils";

    $: operationList = currentOperation.getUnderOperations(column);

    $: additionalParamter = currentOperation.getAdditionalParameters();
</script>

{#each operationList as operation (operation)}
    <div>
        <a
            href={createLink(
                $page.route.id + "",
                "operation",
                operation.path,
                operation.method,
                `${column}=${value}&${additionalParamter}`,
            )}
        >
            {operation.method}
            {operation.path}
        </a>
    </div>
{/each}
