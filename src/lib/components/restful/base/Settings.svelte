<script module lang="ts">
	let lastSelectedName = "";
</script>

<script lang="ts">
	import type { Component } from "svelte";
	import type { OpenAPI } from "openapi-types";
	import { type RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
	import Storage from "../setting/Storage.svelte";
	import Radio from "@smui/radio";
	import FormField from "@smui/form-field";
	import Request from "../setting/Request.svelte";
	import Variables from "../setting/variables/Variables.svelte";
	import Security from "../setting/Security.svelte";
	import LinkMappings from "../setting/LinkMappings.svelte";
	import Persist from "../setting/Persist.svelte";
	import Document from "../setting/Document.svelte";
	import { isServerBuildMode } from "$lib/utils/build-mode";
	import { OAUTH2_CODE_PARAM, OAUTH2_ERROR_PARAM } from "$lib/restful/security/oauth2Pkce";

	let {
		config,
		document,
	}: { config: RestfulComponentConfig; document?: OpenAPI.Document } = $props();

	const isInlineDocument = $derived(
		Boolean(config.documentRaw?.trim() && !config.documentUrl?.trim()),
	);

	type SettingOption = {
		name: string;
		value: Component<{ config: RestfulComponentConfig; document?: OpenAPI.Document }>;
	};

	let options = $derived.by((): SettingOption[] => {
		const list: SettingOption[] = [
			{ name: "Request", value: Request },
			{ name: "Variables", value: Variables },
			{ name: "Security", value: Security },
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

	function isOAuthCallback(): boolean {
		const params = new URLSearchParams(window.location.search);
		return params.has(OAUTH2_CODE_PARAM) || params.has(OAUTH2_ERROR_PARAM);
	}

	if (isOAuthCallback()) {
		lastSelectedName = "Security";
	}
	let selectedName = $state(lastSelectedName);

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
		<Radio
			bind:group={selectedName}
			value={option.name}
			input$onchange={() => (lastSelectedName = option.name)}
		/>
		{#snippet label()}
			{option.name}
		{/snippet}
	</FormField>
{/each}

{#if selected}
	{@const Component = selected.value}
	<Component {config} {document} />
{/if}
