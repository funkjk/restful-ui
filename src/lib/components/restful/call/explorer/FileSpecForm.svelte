<script lang="ts">
	import Button, { Label } from "@smui/button";
	import {
		createRawSpecSource,
		isSpecSourceError,
		validateSpecFile,
	} from "$lib/restful/specSource";

	let {
		onSet,
	}: {
		onSet: (text: string, label: string) => void;
	} = $props();

	let selectedName = $state("");
	let fileText = $state("");
	let error = $state("");
	let dragging = $state(false);

	async function loadFile(file: File | undefined) {
		if (!file) {
			return;
		}
		const validationError = validateSpecFile(file);
		if (validationError) {
			error = validationError;
			selectedName = "";
			fileText = "";
			return;
		}
		try {
			const text = await file.text();
			const result = createRawSpecSource(text, file.name);
			if (isSpecSourceError(result)) {
				error = result;
				selectedName = "";
				fileText = "";
				return;
			}
			error = "";
			selectedName = result.label;
			fileText = result.text;
		} catch (e) {
			error = "" + e;
			selectedName = "";
			fileText = "";
		}
	}

	function onFileInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		void loadFile(input.files?.[0]);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		void loadFile(event.dataTransfer?.files?.[0]);
	}

	function handleSet() {
		const result = createRawSpecSource(fileText, selectedName);
		if (isSpecSourceError(result)) {
			error = result;
			return;
		}
		error = "";
		onSet(result.text, result.label);
	}
</script>

<div style="margin-top: 16px;">
	<div
		ondragover={(e) => {
			e.preventDefault();
			dragging = true;
		}}
		ondragleave={() => {
			dragging = false;
		}}
		ondrop={onDrop}
		style="border: 2px dashed {dragging
			? '#6200ee'
			: '#aaa'}; border-radius: 8px; padding: 24px; text-align: center;"
	>
		<div>Drop .json / .yaml / .yml here</div>
		<div style="margin: 12px 0;">or</div>
		<input
			type="file"
			accept=".json,.yaml,.yml,application/json,text/yaml,text/x-yaml"
			onchange={onFileInput}
		/>
		{#if selectedName}
			<div style="margin-top: 12px;">selected: {selectedName}</div>
		{/if}
	</div>
	{#if error}
		<div style="color: #b00020; margin-top: 8px;">{error}</div>
	{/if}
	<div style="margin-top: 12px; display: flex; justify-content: flex-end;">
		<Button onclick={handleSet} disabled={!fileText}>
			<Label>set</Label>
		</Button>
	</div>
</div>
