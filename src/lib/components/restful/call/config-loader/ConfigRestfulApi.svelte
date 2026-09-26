<script lang="ts">
	import RestfulApi from "$lib/components/restful/base/RestfulApi.svelte";
	import {
		DefaultLinkSupport,
		RuningMode,
		type LinkParameter,
	} from "$lib/restful/RestfulInterfaces";
	import {
		createRestfulComponentConfig,
		SetLoadingPlugin,
		SetRequestPlugin,
		SvelteRestfulProxy,
	} from "$lib/adapters/svelte/RestfulSvelteAdapter";
	import {
		LoggingRestfulPlugin,
		LogMessage,
	} from "$lib/restful/BuiltInPlugins";
	import { loading, logMessages } from "$lib/stores/ui";
	import type { LinkMapping } from "$lib/types/link-mapping";
	import { migrateLinkMappings } from "$lib/restful/linkMapping";
	import { get, writable, type Writable } from "svelte/store";
	import Card, { Content } from "@smui/card";
	import { withAppBase } from "$lib/utils/app-base";
	import { createProxyUrl } from "$lib/utils/proxy";
	import type { ServerConfig } from "$lib/restful/config-server/ServerSupport";
	import {
		getOpenApiSourceDisplay,
		isInlineOpenApiSource,
	} from "$lib/restful/config-server/ServerSupport";
	import {
		createRawSpecSource,
		isSpecSourceError,
		PASTED_SPEC_LABEL,
	} from "$lib/restful/specSource";
	import { toPersistedRequestSettings } from "$lib/types/request-config";

	class PathParameterLinkSupport extends DefaultLinkSupport {
		private configId: string;

		constructor(configId: string) {
			super("/");
			this.configId = configId;
		}

		createBasePath(_parameter: LinkParameter): string {
			if (_parameter.basePath) {
				return _parameter.basePath + "#";
			} else {
				return withAppBase(`/cid/${this.configId}/`) + "#";
			}
		}
	}

	let {
		serverConfig: initialServerConfig,
		configurationId,
	}: { serverConfig: ServerConfig; configurationId: string } = $props();

	let serverConfig = $state(initialServerConfig);
	let documentRevision = $state(0);

	let sourceDisplay = $derived(getOpenApiSourceDisplay(serverConfig));
	let inlineSource = $derived(isInlineOpenApiSource(serverConfig));

	let requestSetting: Writable<ServerConfig["requestSettings"]> | null =
		null;
	let linkMappings: Writable<LinkMapping[]> | null = null;

	let config = $derived(createConfig());

	async function createConfig() {
		const messageLogger = {
			log(message: LogMessage): void {
				logMessages.update((e) => [...e, message]);
			},
		};
		const storageKey = "cid-" + configurationId;

		const localConfig = {
			...createRestfulComponentConfig(storageKey, {
				runningMode: RuningMode.LOAD_CONFIG,
			}),
			configurationId: configurationId,
			config: serverConfig,
			runningMode: RuningMode.LOAD_CONFIG,
		};

		if (
			serverConfig.openApiDocumentRaw?.trim() &&
			!serverConfig.openApiUrl?.trim()
		) {
			localConfig.documentRaw = serverConfig.openApiDocumentRaw;
			localConfig.documentLabel =
				serverConfig.openApiDocumentLabel || PASTED_SPEC_LABEL;
			localConfig.applyInlineDocument = applyInlineDocument;
		} else if (serverConfig.useProxy && serverConfig.openApiUrl) {
			localConfig.documentUrl = createProxyUrl(
				serverConfig.openApiUrl,
				serverConfig.requestSettings.proxyBaseUrl,
			);
		} else {
			localConfig.documentUrl = serverConfig.openApiUrl;
		}

		if (!requestSetting) {
			requestSetting = writable(serverConfig.requestSettings);
			requestSetting.subscribe(() => persistServerConfig());
		}
		if (!linkMappings) {
			linkMappings = writable<LinkMapping[]>(
				migrateLinkMappings(serverConfig.linkMappings ?? []),
			);
			linkMappings.subscribe(() => persistServerConfig());
		}

		localConfig.additionalPlugins = [
			new LoggingRestfulPlugin(messageLogger),
			new SetLoadingPlugin(loading),
			new SetRequestPlugin(requestSetting),
			new SvelteRestfulProxy(requestSetting),
		];
		localConfig.storage.requestSetting = requestSetting;
		localConfig.storage.linkMappings = linkMappings;
		localConfig.linkSupport = new PathParameterLinkSupport(configurationId);
		return localConfig;
	}

	function persistServerConfig() {
		if (!requestSetting || !linkMappings) {
			return;
		}
		fetch("/api/configs/" + configurationId, {
			method: "PUT",
			body: JSON.stringify({
				...serverConfig,
				requestSettings: toPersistedRequestSettings(
					get(requestSetting),
				),
				linkMappings: get(linkMappings),
			}),
		});
	}

	async function applyInlineDocument(text: string, label: string) {
		const result = createRawSpecSource(text, label);
		if (isSpecSourceError(result)) {
			throw new Error(result);
		}
		serverConfig = {
			...serverConfig,
			openApiUrl: undefined,
			openApiDocumentRaw: result.text,
			openApiDocumentLabel: result.label,
		};
		const response = await fetch("/api/configs/" + configurationId, {
			method: "PUT",
			body: JSON.stringify({
				...serverConfig,
				requestSettings: toPersistedRequestSettings(
					get(requestSetting!),
				),
				linkMappings: get(linkMappings!),
			}),
		});
		if (!response.ok) {
			const errorBody = await response.json().catch(() => null);
			throw new Error(
				errorBody?.error || response.statusText || "Update failed",
			);
		}
		documentRevision += 1;
	}
</script>

<Card style="margin-bottom: 10px;">
	<Content>
		<div>id: {configurationId}</div>
		{#if serverConfig.serverName}
			<div>name: {serverConfig.serverName}</div>
		{/if}
		{#if inlineSource}
			<div>document: {sourceDisplay}</div>
		{:else}
			<div>
				url: <a href={sourceDisplay} target="_blank">{sourceDisplay}</a>
			</div>
		{/if}
	</Content>
</Card>

{#await config}
	<div>loading...</div>
{:then resolvedConfig}
	{#key documentRevision}
		<RestfulApi config={resolvedConfig}></RestfulApi>
	{/key}
{/await}
