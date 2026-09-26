<script lang="ts">
	import type { Component } from "svelte";
	import { type RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
	import Storage from "../setting/Storage.svelte";
	import Radio from "@smui/radio";
	import FormField from "@smui/form-field";
	import Request from "../setting/Request.svelte";
	import Variables from "../setting/variables/Variables.svelte";
	import LinkMappings from "../setting/LinkMappings.svelte";
	import Persist from "../setting/Persist.svelte";
	import Document from "../setting/Document.svelte";
	import { isServerBuildMode } from "$lib/utils/build-mode";

	let { config }: { config: RestfulComponentConfig } = $props();

	const isInlineDocument = $derived(
		Boolean(config.documentRaw?.trim() && !config.documentUrl?.trim()),
	);

	type SettingOption = { name: string; value: Component<{ config: RestfulComponentConfig }> };

	let options = $derived.by((): SettingOption[] => {
		const list: SettingOption[] = [
			{ name: "Request", value: Request },
			{ name: "Variables", value: Variables },
			{ name: "Links", value: LinkMappings },
			{ name: "Storage", value: Storage },
		];
		if (isInlineDocument) {
			list.unshift({ name: "Document", value: Document });
		}
		if (isServerBuildMode()) {
			list.push({ name: "Persist", value: Persist });
		}
		return list;
	});

	let selectedName = $state("");

	$effect(() => {
		if (!options.some((o) => o.name === selectedName)) {
			selectedName = options[0]?.name ?? "";
		}
	});

	let selected = $derived(
		options.find((o) => o.name === selectedName) ?? options[0],
	);
</script>

{#each options as option (option.name)}
	<FormField>
		<Radio bind:group={selectedName} value={option.name} />
		{#snippet label()}
			{option.name}
		{/snippet}
	</FormField>
{/each}

{#if selected}
	{@const Component = selected.value}
	<Component {config} />
{/if}
