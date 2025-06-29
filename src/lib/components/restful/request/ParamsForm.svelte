<script lang="ts">
	import LayoutGrid, { Cell } from "@smui/layout-grid";
	import Textfield from "@smui/textfield";
	import HelperText from "@smui/textfield/helper-text";
	import Checkbox from "@smui/checkbox";
	import FormField from "@smui/form-field";
	import BodyEditor from "../../common/BodyEditor.svelte";
	import FormBodyEditor from "./FormBodyEditor.svelte";
	import ParameterHistoriesMenu from "./ParameterHistoriesMenu.svelte";
	import Button, { Icon, Label } from "@smui/button";
	import Select, { Option } from "@smui/select";
	import { RequestBodyType, type RestfulOperation } from "$lib/restful/RestfulOperation";
	import type { CacheBodyParameter } from "$lib/restful/BuiltInPlugins";
	import { notifyMessage } from "$lib/stores/ui";

	export let currentOperation: RestfulOperation;
	export let value = {} as any;
	export let histories: CacheBodyParameter[] = [];

	let bodyParamName = currentOperation.getBodyValueName();
	let operation = currentOperation.getOperation();

	let params = operation.parameters as any[];

	const requestBodyTypes = currentOperation.getBodyTypes()
	let requestBodyType = requestBodyTypes[0]
	$: bodyDefinition = currentOperation.getBodyDefinition(requestBodyType)
	function selectHistory(event: CustomEvent) {
		value[bodyParamName!] = event.detail;
	}

	let canCallGet =
		bodyParamName !== null &&
		currentOperation.getPathItem()!.get !== undefined;

	async function callGet() {
		let getOperation = currentOperation.copy(currentOperation.path, "get");
		const response = await getOperation.execute(value);
		if (response.ok) {
			value[bodyParamName!] = JSON.stringify(response.responseBody);
		} else {
			notifyMessage.notify("Failed to get. " + response.status);
		}
	}
</script>

<h3>parameters</h3>

<div>
	<LayoutGrid>
		{#if params}
			{#each params as param (param.name)}
				<Cell span={3}>
					{#if param.in == "body"}
						<!-- skip to render inside grid -->
					{:else if param.type == "boolean"}
						<FormField>
							<Checkbox bind:checked={value[param.name]} />
							<span slot="label"
								>{param.name +
									(param.required ? "*" : "")}</span
							>
						</FormField>
					{:else if param.type == "integer"}
						<Textfield
							bind:value={value[param.name]}
							label={param.name + (param.required ? "*" : "")}
							type="number"
						>
							<HelperText slot="helper"
								>"used in "{param.in}</HelperText
							>
						</Textfield>
					{:else if param.enum}
						<Select
							label={param.name + (param.required ? "*" : "")}
							bind:value={value[param.name]}
						>
							{#each param.enum as e, index (index)}
								<Option value={e}>{e}</Option>
							{/each}
						</Select>
					{:else}
						<Textfield
							bind:value={value[param.name]}
							label={param.name + (param.required ? "*" : "")}
						>
							<HelperText slot="helper"
								>"used in "{param.in}</HelperText
							>
						</Textfield>
					{/if}
				</Cell>
			{/each}
		{:else}
			none
		{/if}
	</LayoutGrid>
	{#if bodyParamName}
		<div class="body-param-header">
			{#if requestBodyTypes.length === 1}
				{requestBodyTypes[0]}
			{:else}
				<Select bind:value={requestBodyType}>
					{#each requestBodyTypes as type}
						<Option value={type}>{type}</Option>
					{/each}
				</Select>
			{/if}
			{#if canCallGet}
				<Button on:click={callGet}
					><Icon class="material-icons">arrow_circle_down</Icon><Label
						>call get</Label
					></Button
				>
			{/if}
			<ParameterHistoriesMenu
				{histories}
				on:select={selectHistory}
				{currentOperation}
				{value}
			></ParameterHistoriesMenu>
		</div>
		<!-- render body outside grid -->
		{#if requestBodyType === RequestBodyType.JSON}
			<BodyEditor bind:value={value[bodyParamName]} />
		{:else if requestBodyType === RequestBodyType.FORM_DATA && bodyDefinition}
			<FormBodyEditor definition={bodyDefinition} bind:value={value[bodyParamName]}/>
		{/if}
	{/if}
</div>

<style>
	.body-param-header {
		display: flex;
		justify-content: flex-end;
	}
</style>
