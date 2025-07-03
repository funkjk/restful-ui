<script lang="ts">
	import Operation from "$lib/components/restful/base/Operation.svelte";
	import { createRestfulOperation, RestfulOperation } from "$lib/restful/RestfulOperation";
	import { CachedRestfulPlugin } from "$lib/restful/BuiltInPlugins";
	import {
		SvelteCacheStore,
		type RestfulComponentConfig,
	} from "$lib/restful/SvelteSupport";
	import GeneralJsonCard from "../../common/GeneralJsonCard.svelte";
	import { Content } from "@smui/dialog";
	import Drawer, { AppContent } from "@smui/drawer";
	import PathTreeView from "./PathTreeView.svelte";
	import type { OpenAPI } from "openapi-types";

	import { fade } from "svelte/transition";
	import { PathTree } from "$lib/restful/PathTree";
	import IconButton from "@smui/icon-button";
    import Settings from "./Settings.svelte";
    import { PAGE } from "$lib/utils/utils";
	export let config: RestfulComponentConfig;
	export let searchParams: URLSearchParams;

	export let document: OpenAPI.Document;
	$: restApiPage = searchParams.get("*page");

	const cacheStore = new SvelteCacheStore(
		config.storage.responses,
		config.storage.parameterHistories,
	);
	const plugins = [
		new CachedRestfulPlugin(cacheStore),
		...config.additionalPlugins,
	];

	let currentOperation: RestfulOperation;
	$: rootTree = new PathTree(currentOperation.document).pathTree;

	let pageNavigating = false;
	$: {
		const opSearchParam = new URLSearchParams(searchParams.toString())
		opSearchParam.delete("*page")
		currentOperation = createRestfulOperation(
			opSearchParam,
			document,
			plugins,
		);

		pageNavigating = true;
		setTimeout(() => {
			pageNavigating = false;
		}, 300); // to reload component, hide 300ms
	}
	export let drawerOpen = true;
</script>

<div class="restapi-main">
	<Drawer class={drawerOpen ? "restapi-drawer-open" : "restapi-drawer-close"}>
		<Content>
			<div>
				<div style="display:list-item;">
					<div>
						<IconButton
							class="material-icons"
							onclick={() => (drawerOpen = !drawerOpen)}
						>
							{drawerOpen ? "chevron_left" : "chevron_right"}
						</IconButton>
					</div>
					<div style="list-style: none;">
						<li>
							<a href={config.linkSupport.createLink({page:PAGE.TOP})}>
								<IconButton class="material-icons">home</IconButton>
								{#if drawerOpen}&nbsp;API TOP
								{/if}</a
							>
						</li>
						<li>
							<a href={config.linkSupport.createLink(
								{page:PAGE.SETTING})}>
								<IconButton class="material-icons">settings</IconButton>
								{#if drawerOpen}&nbsp;Setting
								{/if}</a
							>
						</li>
					</div>
				</div>
				<div></div>
				{#if drawerOpen}
					<PathTreeView {currentOperation} {rootTree} {config}></PathTreeView>
				{/if}
			</div>
			<div></div>
		</Content>
	</Drawer>

	<!-- TODO fix overflow-->
	<AppContent class="app-content">
		{#if !pageNavigating}
			<main class="main-content" transition:fade={{ duration: 150 }}>
				{#if restApiPage == PAGE.OPERATION}
					{#if currentOperation && currentOperation.exist()}
						<Operation {currentOperation} {config} {cacheStore}
						></Operation>
					{:else}
						operation not found
					{/if}
				{:else if restApiPage == PAGE.SETTING}
					<Settings {config}></Settings>
				{:else}
					<GeneralJsonCard data={document} title="api"
					></GeneralJsonCard>
				{/if}
			</main>
		{/if}
	</AppContent>
</div>

<style>
	.restapi-main {
		position: relative;
		display: flex;
		z-index: 0;
	}

	* :global(.app-content) {
		flex: auto;
		overflow: auto;
		position: relative;
		flex-grow: 1;
	}
	:global(.mdc-drawer) {
		background-color: unset;
		height: unset;
	}
	:global(.restapi-drawer-open) {
		width: 300px;
	}
	:global(.restapi-drawer-close) {
		width: 50px;
	}

	.main-content {
		overflow: auto;
		padding: 16px;
		box-sizing: border-box;
	}
</style>
