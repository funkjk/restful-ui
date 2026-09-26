<script lang="ts">
	import { persisted } from "svelte-persisted-store";
	import { get } from "svelte/store";
	import {
		createRestfulComponentConfig,
		SetLoadingPlugin,
	} from "$lib/adapters/svelte/RestfulSvelteAdapter";
	import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
	import {
		LoggingRestfulPlugin,
		type LogMessage,
	} from "$lib/restful/BuiltInPlugins";
	import { loading, logMessages } from "$lib/stores/ui";
	import RestfulApi from "../../base/RestfulApi.svelte";
	import ConfigList from "$lib/components/restful/call/config-loader/ConfigList.svelte";
	import { isServerBuildMode } from "$lib/utils/build-mode";
	import {
		createProxyUrl,
		getDefaultProxyBaseUrl,
	} from "$lib/utils/proxy";
	import {
		createRawSpecSource,
		createUrlSpecSource,
		isSpecSourceError,
		type SpecSource,
		type SpecSourceKind,
		type SpecSourceTab,
	} from "$lib/restful/specSource";
	import SpecSourceSwitcher from "./SpecSourceSwitcher.svelte";
	import ActiveSpecBar from "./ActiveSpecBar.svelte";

	const urlStore = persisted("base-url", "", { storage: "session" });
	const useProxyStore = persisted("base-url-proxy-use", false, {
		storage: "session",
	});
	const proxyBaseUrlStore = persisted(
		"base-url-proxy-base",
		getDefaultProxyBaseUrl(),
		{ storage: "session" },
	);
	const kindStore = persisted<SpecSourceKind | "">("spec-source-kind", "", {
		storage: "session",
	});
	const rawStore = persisted("spec-source-raw", "", { storage: "session" });
	const labelStore = persisted("spec-source-label", "", {
		storage: "session",
	});
	const tabStore = persisted<SpecSourceTab>("spec-source-tab", "url", {
		storage: "session",
	});

	const basePath = window.location.origin + import.meta.env.BUILD_BASE_PATH;
	let editingUrl = $state(`${basePath}/oas/restful-api-sample-config.yaml`);
	let useProxy = $state(get(useProxyStore));
	let proxyBaseUrl = $state(get(proxyBaseUrlStore));
	let activeTab = $state<SpecSourceTab>(get(tabStore) || "url");
	let documentRevision = $state(0);

	$effect(() => {
		tabStore.set(activeTab);
	});

	let activeSource = $derived.by((): SpecSource | null => {
		const kind = $kindStore;
		if (kind === "url" && $urlStore) {
			return { kind: "url", url: $urlStore };
		}
		if (kind === "raw" && $rawStore) {
			return {
				kind: "raw",
				text: $rawStore,
				label: $labelStore || "pasted spec",
			};
		}
		return null;
	});

	let config: RestfulComponentConfig | null = $derived.by(() =>
		createConfig(activeSource),
	);

	function createConfig(
		source: SpecSource | null,
	): RestfulComponentConfig | null {
		if (!source) {
			return null;
		}
		const messageLogger = {
			log(message: LogMessage): void {
				logMessages.update((e) => [...e, message]);
			},
		};
		const next = createRestfulComponentConfig("test");
		if (source.kind === "url") {
			next.documentUrl = source.url;
		} else {
			next.documentRaw = source.text;
			next.documentLabel = source.label;
			next.applyInlineDocument = applyInlineDocument;
		}
		next.storage.requestSetting.set({
			...get(next.storage.requestSetting),
			useProxy: $useProxyStore,
			proxyBaseUrl:
				$proxyBaseUrlStore.trim() || getDefaultProxyBaseUrl(),
		});
		next.additionalPlugins = [
			new LoggingRestfulPlugin(messageLogger),
			new SetLoadingPlugin(loading),
			...next.additionalPlugins,
		];
		return next;
	}

	function applyInlineDocument(text: string, label: string) {
		const result = createRawSpecSource(text, label);
		if (isSpecSourceError(result)) {
			throw new Error(result);
		}
		rawStore.set(result.text);
		labelStore.set(result.label);
		urlStore.set("");
		kindStore.set("raw");
		documentRevision += 1;
	}

	function setUrlSource(
		url: string,
		proxy: { use: boolean; base: string },
	) {
		const result = createUrlSpecSource(url);
		if (isSpecSourceError(result)) {
			return;
		}
		useProxyStore.set(proxy.use);
		proxyBaseUrlStore.set(proxy.base);
		useProxy = proxy.use;
		proxyBaseUrl = proxy.base;
		const documentUrl = proxy.use
			? createProxyUrl(result.url, proxy.base)
			: result.url;
		urlStore.set(documentUrl);
		rawStore.set("");
		labelStore.set("");
		kindStore.set("url");
		activeTab = "url";
		documentRevision += 1;
	}

	function setRawSource(text: string, label: string) {
		const result = createRawSpecSource(text, label);
		if (isSpecSourceError(result)) {
			return;
		}
		rawStore.set(result.text);
		labelStore.set(result.label);
		urlStore.set("");
		kindStore.set("raw");
		documentRevision += 1;
	}

	function clearSource() {
		urlStore.set("");
		rawStore.set("");
		labelStore.set("");
		kindStore.set("");
	}

	const buildTime = import.meta.env.BUILD_TIME || "unknown";
</script>

{#if activeSource && config}
	<ActiveSpecBar source={activeSource} onClear={clearSource} />
	{#key documentRevision}
		<RestfulApi {config}></RestfulApi>
	{/key}
{:else}
	<div style="display: flex; flex-direction: row;">
		<div style="width: 70%;">
			<SpecSourceSwitcher
				bind:activeTab
				bind:editingUrl
				bind:useProxy
				bind:proxyBaseUrl
				onSetUrl={setUrlSource}
				onSetRaw={setRawSource}
			/>
		</div>
		{#if isServerBuildMode()}
			<div style="margin-left: 10px;">
				<ConfigList></ConfigList>
			</div>
		{/if}
	</div>
	<div
		style="position: fixed; bottom: 0; right: 0; padding: 8px; font-size: 12px; color: #666;"
	>
		built at {buildTime}
	</div>
{/if}
