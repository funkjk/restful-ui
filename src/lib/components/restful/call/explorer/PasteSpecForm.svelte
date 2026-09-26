<script lang="ts">
	import Textfield from "@smui/textfield";
	import Button, { Label } from "@smui/button";
	import {
		createRawSpecSource,
		isSpecSourceError,
		PASTED_SPEC_LABEL,
	} from "$lib/restful/specSource";

	let {
		onSet,
	}: {
		onSet: (text: string, label: string) => void;
	} = $props();

	let text = $state("");
	let error = $state("");

	function handleSet() {
		const result = createRawSpecSource(text, PASTED_SPEC_LABEL);
		if (isSpecSourceError(result)) {
			error = result;
			return;
		}
		error = "";
		onSet(result.text, result.label);
	}
</script>

<div style="margin-top: 16px;">
	<Textfield
		textarea
		bind:value={text}
		label="OpenAPI spec (JSON or YAML)"
		style="width: 100%;"
		input$rows={16}
	/>
	{#if error}
		<div style="color: #b00020; margin-top: 8px;">{error}</div>
	{/if}
	<div style="margin-top: 12px; display: flex; justify-content: flex-end;">
		<Button onclick={handleSet}>
			<Label>set</Label>
		</Button>
	</div>
</div>
