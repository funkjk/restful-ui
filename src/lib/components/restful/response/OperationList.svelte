<script lang="ts">
    import type { RestfulOperation } from "$lib/restful/RestfulOperation";
    import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";

    let {
		config,
		value = "",
		column = "",
		item = {},
		currentOperation
	}: {
		config: RestfulComponentConfig;
		value?: string;
		column?: string;
		item?: object;
		currentOperation: RestfulOperation;
	} = $props();

    let operationList = $derived(currentOperation.getUnderOperations(column));

    let additionalParamter = $derived(currentOperation.getAdditionalParameters());
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
