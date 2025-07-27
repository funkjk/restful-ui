<script lang="ts">
	import { page } from "$app/stores";
	import type { OpenAPI } from "openapi-types";
	import RestfulApiContent from "./RestfulApiContent.svelte";
	import * as SwaggerParser from "@apidevtools/swagger-parser";
	import { onMount } from "svelte";
	import { RuningMode, type RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
	import { createRawStringSwaggerParserResolver } from "$lib/utils/utils";
    import Persist from "../setting/Persist.svelte";
	export let config: RestfulComponentConfig;
	const InitializeStatusDone = "DONE";
	const InitializeStatusInitializing = "initializing";

	let document: OpenAPI.Document;
	let initializeMessage: string = InitializeStatusInitializing;
	let searchParams = new URLSearchParams();
	$: {
		const href = $page.url.href;
		const searchString = href.substring(href.search("#") + 1, href.length);
		searchParams = new URLSearchParams(searchString);
		// TODO
		// history.replaceState(
		// 	window.history.state,
		// 	"",
		// 	location.href.replaceAll("/index.html/", "/index.html"),
		// );
	}

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
	<RestfulApiContent {document} {config} {searchParams}></RestfulApiContent>
{/if}
