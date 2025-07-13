<script lang="ts">
	import { onMount } from "svelte";
	import Button from "@smui/button";
	import GeneralJsonCard from "$lib/components/common/GeneralJsonCard.svelte";
	import ParamsForm from "$lib/components/restful/request/ParamsForm.svelte";
	import { writable } from "svelte/store";
	import type {
		RequestBodyType,
		RestfulOperation,
	} from "$lib/restful/RestfulOperation";
	import { CACHE_TYPE, getCacheKey } from "$lib/restful/BuiltInPlugins";
	import {
    type RestfulComponentConfig,
} from "$lib/restful/RestfulInterfaces";
import { type SvelteCacheStore } from "$lib/adapters/svelte/RestfulSvelteAdapter";
	import ResponseViiewer from "../response/ResponseViiewer.svelte";
    import { PAGE } from "$lib/utils/utils";
	export let config: RestfulComponentConfig;
	export let currentOperation: RestfulOperation;
	export let cacheStore: SvelteCacheStore;

	const requestBodyTypes = currentOperation.getBodyTypes();
	export let requestBodyType: RequestBodyType = requestBodyTypes[0];

	let operation = currentOperation.getOperation();
	let value: any = currentOperation.getInitialParameterValue();
	let response: any = null;
	let executionTime: string | null = null;
	let isErrorResponse = false;

	const operationStore = writable(currentOperation);
	$: {
		operationStore.set(currentOperation);
	}
	onMount(async () => {
		if (currentOperation.method == "get") {
			const cacheKey = getCacheKey(
				CACHE_TYPE.GET_RESPONSE,
				currentOperation,
				value,
			);
			const cachedResponse = cacheStore.get(
				CACHE_TYPE.GET_RESPONSE,
				cacheKey,
			);
			if (cachedResponse) {
				response = cachedResponse.response;
				executionTime = cachedResponse.executionTime;
			}
		}
	});
	$: requestPath = currentOperation.getRequestPath(value);

	const parameterHistories = config.storage.parameterHistories;
	$: histories =
		$parameterHistories[
			getCacheKey(CACHE_TYPE.BODY_PARAMETER, currentOperation)
		];

	async function execute() {
		const apiResponse = await currentOperation.execute(
			value,
			requestBodyType,
		);
		response = apiResponse.responseBody;
		isErrorResponse = !apiResponse.ok;
		executionTime = new Date().toISOString();

		if (apiResponse.ok) {
			let additionalSearch = currentOperation
				.getPathParameters()
				.map((pathParam) => `${pathParam}=${value[pathParam]}`)
				.join("&");
			history.replaceState(
				window.history.state,
				"",
				config.linkSupport.createLink({
					page: PAGE.OPERATION,
					restPath: currentOperation.path,
					restMethod: currentOperation.method,
					additionalSearch: additionalSearch,
				}),
			);
			if (currentOperation.method == "get") {
				if (
					JSON.stringify(value) ===
					JSON.stringify(currentOperation.getInitialParameterValue())
				) {
					const cacheKey = getCacheKey(
						CACHE_TYPE.GET_RESPONSE,
						currentOperation,
						value,
					);
					cacheStore.store(CACHE_TYPE.GET_RESPONSE, cacheKey, {
						executionTime: new Date().toISOString(),
						response,
					});
				}
			}
		}
	}
</script>

<h3>{currentOperation.method} {currentOperation.path}</h3>
<div>
	{requestPath}
</div>
parameters={JSON.stringify(currentOperation.parameters)}

<div>
	{#if value}
		<ParamsForm
			bind:value
			bind:requestBodyType
			{currentOperation}
			{histories}
		></ParamsForm>
	{/if}
	<Button onclick={execute}>Execute</Button>
</div>
{#if executionTime}
	Execution Time:{executionTime}
{/if}
<ResponseViiewer
	{config}
	{cacheStore}
	{currentOperation}
	{response}
	{isErrorResponse}
></ResponseViiewer>

<GeneralJsonCard data={operation} title="operation"></GeneralJsonCard>
