<script lang="ts">
	import Textfield from "@smui/textfield";
	import Button, { Label } from "@smui/button";
	import Select, { Option } from "@smui/select";
	import Checkbox from "$lib/components/common/Checkbox.svelte";
	import { getDefaultProxyBaseUrl } from "$lib/utils/proxy";

	let {
		editingUrl = $bindable(""),
		useProxy = $bindable(false),
		proxyBaseUrl = $bindable(getDefaultProxyBaseUrl()),
		onSet,
	}: {
		editingUrl?: string;
		useProxy?: boolean;
		proxyBaseUrl?: string;
		onSet: (url: string, proxy: { use: boolean; base: string }) => void;
	} = $props();

	const basePath = window.location.origin + import.meta.env.BUILD_BASE_PATH;
	const sampleOasFiles = [
		{
			name: "Restful API Sample (Config)",
			url: `${basePath}/oas/restful-api-sample-config.yaml`,
			description: "RESTful API Sample",
		},
		{
			name: "GitHub API",
			url: "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json",
			description: "GitHub REST API v3",
		},
		{
			name: "Quip API",
			url: "https://quip.com/dev/automation/documentation/current/openapi-specs",
			description: "Quip REST API",
		},
		{
			name: "CloudHub API",
			url: `${basePath}/oas/cloudhub-api-1.0.33-fat-oas.json`,
			description: "CloudHub API",
		},
		{
			name: "Backlog API",
			url: `${basePath}/oas/backlog_oas.yml`,
			description: "Backlog API",
		},
	];

	let selectedSampleIndex: number = $state(0);

	$effect(() => {
		selectSampleFile(selectedSampleIndex);
	});

	function selectSampleFile(index: number) {
		selectedSampleIndex = index;
		editingUrl = sampleOasFiles[index].url;
	}

	function setOpenApiUrl() {
		onSet(editingUrl, {
			use: useProxy,
			base: proxyBaseUrl.trim() || getDefaultProxyBaseUrl(),
		});
	}
</script>

<div style="margin-top: 16px;">
	<div style="margin-bottom: 16px;">
		<Select
			bind:value={selectedSampleIndex}
			label="Select Sample OAS File"
			style="width: 100%;"
		>
			{#each sampleOasFiles as file, index}
				<Option value={index}>
					{file.name}
				</Option>
			{/each}
		</Select>
	</div>

	<Textfield
		bind:value={editingUrl}
		style="width: 100%;"
		label="Open API URL"
	/>
	<Checkbox
		bind:checked={useProxy}
		label="Use CORS proxy to get OAS file"
	></Checkbox>
	{#if useProxy}
		<Textfield
			bind:value={proxyBaseUrl}
			style="width: 100%;"
			label="Proxy base URL (cors-anywhere compatible)"
			placeholder={getDefaultProxyBaseUrl()}
		/>
	{/if}
	<div style="margin-top: 12px; display: flex; justify-content: flex-end;">
		<Button onclick={setOpenApiUrl}>
			<Label>set</Label>
		</Button>
	</div>
</div>
