<script lang="ts">
	import Card, { Content, Actions } from "@smui/card";
	import Button, { Label } from "@smui/button";
	import Textfield from "@smui/textfield";
	import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
	import {
		createRawSpecSource,
		isSpecSourceError,
		PASTED_SPEC_LABEL,
	} from "$lib/restful/specSource";
	import { notifyMessage } from "$lib/stores/ui";

	let { config }: { config: RestfulComponentConfig } = $props();

	const baselineText = config.documentRaw ?? "";
	const baselineLabel = config.documentLabel ?? PASTED_SPEC_LABEL;

	let text = $state(baselineText);
	let label = $state(baselineLabel);
	let error = $state("");
	let applying = $state(false);

	const dirty = $derived(
		text !== baselineText || label !== baselineLabel,
	);

	function revert() {
		text = baselineText;
		label = baselineLabel;
		error = "";
	}

	async function apply() {
		if (!config.applyInlineDocument) {
			error = "Document editing is not available";
			return;
		}
		const result = createRawSpecSource(text, label);
		if (isSpecSourceError(result)) {
			error = result;
			return;
		}
		error = "";
		applying = true;
		try {
			await config.applyInlineDocument(result.text, result.label);
			notifyMessage.notify("Document applied");
		} catch (e) {
			error = "" + e;
		} finally {
			applying = false;
		}
	}
</script>

<h3>Document</h3>

<Card>
	<Content>
		<Textfield
			bind:value={label}
			label="Document label"
			style="width: 100%; margin-bottom: 12px;"
		/>
		<Textfield
			textarea
			bind:value={text}
			label="OpenAPI spec (JSON or YAML)"
			style="width: 100%;"
			input$rows={20}
		/>
		{#if error}
			<div style="color: #b00020; margin-top: 8px;">{error}</div>
		{/if}
	</Content>
	<Actions>
		<Button onclick={revert} disabled={!dirty || applying}>
			<Label>Revert</Label>
		</Button>
		<Button onclick={apply} disabled={applying}>
			<Label>Apply</Label>
		</Button>
	</Actions>
</Card>
