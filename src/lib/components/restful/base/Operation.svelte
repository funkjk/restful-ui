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
	let {
		config,
		currentOperation,
		cacheStore,
		requestBodyType: requestBodyTypeProp
	}: {
		config: RestfulComponentConfig;
		currentOperation: RestfulOperation;
		cacheStore: SvelteCacheStore;
		requestBodyType?: RequestBodyType;
	} = $props();

	const requestBodyTypes = currentOperation.getBodyTypes();
	let requestBodyType = $state<RequestBodyType>(requestBodyTypeProp ?? requestBodyTypes[0]);

	let operation = $derived(currentOperation.getOperation());
	let value = $state(currentOperation.getInitialParameterValue());
	let response = $state<any>(null);
	let executionTime = $state<string | null>(null);
	let isErrorResponse = $state(false);

	const operationStore = writable(currentOperation);
	$effect(() => {
		operationStore.set(currentOperation);
	});
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
	let requestPath = $derived(currentOperation.getRequestPath(value));

	const parameterHistories = config.storage.parameterHistories;
	let histories = $derived(
		$parameterHistories[
			getCacheKey(CACHE_TYPE.BODY_PARAMETER, currentOperation)
		]
	);

	async function execute() {
		const apiResponse = await currentOperation.execute(
			value,
			requestBodyType,
		);
		response = apiResponse.responseBody;
		isErrorResponse = !apiResponse.ok;
		executionTime = new Date().toISOString();
		if (apiResponse.ok) {
			// bodyパラメータ名を取得（除外するため）
			const bodyParamName = currentOperation.getBodyValueName();

			// 現在の入力値（value）からクエリパラメータを生成
			const params: Record<string, string> = {};
			for (const [key, val] of Object.entries(value)) {
				// bodyパラメータは除外
				if (key === bodyParamName) {
					continue;
				}
				// 値が存在する場合のみ追加
				if (val !== null && val !== undefined && val !== "") {
					params[key] = String(val);
				}
			}

			// additionalSearchを作成
			let additionalSearch = Object.entries(params)
				.map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
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
{#if response}
	<ResponseViiewer
		{config}
		{cacheStore}
		{currentOperation}
		{response}
		{isErrorResponse}
	></ResponseViiewer>
{/if}

<GeneralJsonCard data={operation} title="operation"></GeneralJsonCard>
