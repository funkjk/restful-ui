<script lang="ts">
	import { page } from "$app/stores";
	import type { OpenAPI } from "openapi-types";
	import RestfulApiContent from "./RestfulApiContent.svelte";
	import * as SwaggerParser from "@apidevtools/swagger-parser";
	import { onMount } from "svelte";
	import { RuningMode, type RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
	import { createRawStringSwaggerParserResolver } from "$lib/utils/utils";
    import Persist from "../setting/Persist.svelte";
	let { config }: { config: RestfulComponentConfig } = $props();
	const InitializeStatusDone = "DONE";
	const InitializeStatusInitializing = "initializing";

	let document = $state<OpenAPI.Document | null>(null);
	let initializeMessage = $state<string>(InitializeStatusInitializing);
	let searchParams = $derived.by(() => {
		const href = $page.url.href;
		const searchString = href.substring(href.search("#") + 1, href.length);
		return new URLSearchParams(searchString);
	});

	async function initialize() {
		let parser = new SwaggerParser.default();
		if (config.documentUrl) {
			const doc = await parser.dereference(config.documentUrl);
			document = doc;
		} else {
			const doc = await parser.dereference("static:rawJson.json", {
				resolve: {
					file: createRawStringSwaggerParserResolver(
						config.documentRaw!,
					),
				},
			});
			document = doc;
		}
		initializeMessage = InitializeStatusDone;
	}
	onMount(async () => {
		try {
			await initialize();
		} catch (e) {
			initializeMessage = "" + e;
			console.warn(e);
		}
	});
</script>

{#if initializeMessage !== InitializeStatusDone}
{initializeMessage}
	{#if initializeMessage !== InitializeStatusInitializing && config.runningMode === RuningMode.LOAD_CONFIG}
		<Persist {config}></Persist>
	{/if}
{:else}
	{#if document}
		<RestfulApiContent {document} {config} {searchParams}></RestfulApiContent>
	{/if}
{/if}
