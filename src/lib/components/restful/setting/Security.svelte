<script lang="ts">
	import type { OpenAPI } from "openapi-types";
	import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
	import type { OAuth2PkceSettings, RequestSettings } from "$lib/types/request-config";
	import { SecurityApplyPlugin, type OAuth2Status } from "$lib/restful/security/SecurityApplyPlugin";
	import {
		findAuthorizationCodeFlows,
		OAUTH2_CALLBACK_PATH,
		OAUTH2_CODE_PARAM,
		OAUTH2_ERROR_PARAM,
		OAUTH2_STATE_PARAM,
	} from "$lib/restful/security/oauth2Pkce";
	import { notifyMessage } from "$lib/stores/ui";
	import { withAppBase } from "$lib/utils/app-base";
	import { isServerBuildMode } from "$lib/utils/build-mode";
	import Checkbox from "$lib/components/common/Checkbox.svelte";
	import SmuiCheckbox from "@smui/checkbox";
	import Button from "@smui/button";
	import Textfield from "@smui/textfield";
	import Radio from "@smui/radio";
	import FormField from "@smui/form-field";
	import { onMount } from "svelte";
	import { get } from "svelte/store";

	let {
		config,
		document,
	}: { config: RestfulComponentConfig; document?: OpenAPI.Document } = $props();

	const plugin = $derived(
		config.additionalPlugins.find(
			(p): p is SecurityApplyPlugin => p instanceof SecurityApplyPlugin,
		),
	);
	const flows = $derived(findAuthorizationCodeFlows(document));
	const redirectUri = window.location.origin + withAppBase(OAUTH2_CALLBACK_PATH);
	const canConnect = isServerBuildMode();

	let schemeName = $state("");
	let clientId = $state({ value: "", persist: true });
	let authorizationUrl = $state({ value: "", persist: true });
	let tokenUrl = $state({ value: "", persist: true });
	let scopes = $state<{ value: string[]; persist: boolean }>({ value: [], persist: true });
	let scopeText = $state("");
	let offlineAccess = $state({ value: false, persist: true });
	let persistRefreshToken = $state(false);
	let status = $state<OAuth2Status>("empty");
	let expiresAt = $state<number | undefined>(undefined);
	let errorMessage = $state("");
	let busy = $state(false);

	const selectedFlow = $derived(flows.find((f) => f.schemeName === schemeName));
	const availableScopes = $derived(Object.entries(selectedFlow?.scopes ?? {}));

	function refreshStatus() {
		status = plugin?.getStatus() ?? "empty";
		expiresAt = plugin?.getToken()?.expiresAt;
	}

	function applyFlowDefaults(name: string) {
		const flow = flows.find((f) => f.schemeName === name);
		if (!flow) {
			return;
		}
		authorizationUrl.value = flow.authorizationUrl;
		tokenUrl.value = flow.tokenUrl;
		scopes.value = scopes.value.filter((s) => s in flow.scopes);
	}

	function currentScopes(): string[] {
		if (availableScopes.length > 0) {
			return scopes.value;
		}
		return scopeText.split(/\s+/).filter(Boolean);
	}

	function toSettings(current: OAuth2PkceSettings | undefined): OAuth2PkceSettings {
		return {
			clientId: { value: clientId.value.trim(), persist: clientId.persist },
			authorizationUrl: { value: authorizationUrl.value.trim(), persist: authorizationUrl.persist },
			tokenUrl: { value: tokenUrl.value.trim(), persist: tokenUrl.persist },
			scopes: { value: currentScopes(), persist: scopes.persist },
			offlineAccess: { value: offlineAccess.value, persist: offlineAccess.persist },
			refreshToken: {
				value: current?.refreshToken?.value ?? "",
				persist: offlineAccess.value && persistRefreshToken,
			},
		};
	}

	function save() {
		config.storage.requestSetting.update((current: RequestSettings) => ({
			...current,
			security: {
				...current.security,
				oauth2Pkce: toSettings(current.security?.oauth2Pkce),
			},
		}));
	}

	function onSave() {
		save();
		notifyMessage.notify("Save");
	}

	async function connect() {
		if (!plugin) {
			return;
		}
		errorMessage = "";
		busy = true;
		try {
			save();
			const url = await plugin.beginAuthorization({
				redirectUri,
				returnUrl: window.location.href,
			});
			window.location.assign(url);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error);
			busy = false;
		}
	}

	function disconnect() {
		plugin?.disconnect();
		refreshStatus();
		notifyMessage.notify("Disconnected");
	}

	async function handleCallback() {
		const url = new URL(window.location.href);
		const code = url.searchParams.get(OAUTH2_CODE_PARAM);
		const state = url.searchParams.get(OAUTH2_STATE_PARAM);
		const error = url.searchParams.get(OAUTH2_ERROR_PARAM);
		if (!code && !error) {
			return;
		}
		busy = true;
		try {
			if (error) {
				throw new Error(`Authorization failed: ${error}`);
			}
			if (plugin && code && state) {
				await plugin.completeAuthorization({ code, state });
				notifyMessage.notify("Connected");
			}
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : String(e);
			notifyMessage.notify(errorMessage);
		} finally {
			busy = false;
			refreshStatus();
		}
		// Changing the URL remounts the settings page, so clean it up only after the exchange.
		for (const name of [OAUTH2_CODE_PARAM, OAUTH2_STATE_PARAM, OAUTH2_ERROR_PARAM]) {
			url.searchParams.delete(name);
		}
		history.replaceState(window.history.state, "", url.toString());
	}

	onMount(() => {
		const stored = (get(config.storage.requestSetting) as RequestSettings).security?.oauth2Pkce;
		clientId = { value: stored?.clientId?.value ?? "", persist: stored?.clientId?.persist !== false };
		authorizationUrl = {
			value: stored?.authorizationUrl?.value ?? "",
			persist: stored?.authorizationUrl?.persist !== false,
		};
		tokenUrl = { value: stored?.tokenUrl?.value ?? "", persist: stored?.tokenUrl?.persist !== false };
		scopes = { value: stored?.scopes?.value ?? [], persist: stored?.scopes?.persist !== false };
		scopeText = scopes.value.join(" ");
		offlineAccess = {
			value: stored?.offlineAccess?.value ?? false,
			persist: stored?.offlineAccess?.persist !== false,
		};
		persistRefreshToken = stored?.refreshToken?.persist === true;

		const matched = flows.find(
			(f) => f.authorizationUrl === authorizationUrl.value && f.tokenUrl === tokenUrl.value,
		);
		schemeName = matched?.schemeName ?? flows[0]?.schemeName ?? "";
		if (!matched && !authorizationUrl.value && !tokenUrl.value) {
			applyFlowDefaults(schemeName);
		}
		refreshStatus();
		handleCallback();
	});
</script>

<h3>Security</h3>
<p class="label">OAuth 2.0 Authorization Code + PKCE</p>
<p class="hint">
	The access token is kept in this browser session and sent as
	<code>Authorization: Bearer</code>. An Authorization header set in the Request tab takes precedence.
	Uncheck Persist to keep a value in session only (excluded from ConfigStore Persist).
</p>

<p class="status" data-testid="oauth-status">
	Status: {status === "connected" ? "Connected" : status === "expired" ? "Expired" : "Empty"}
	{#if status === "connected" && expiresAt}
		<span class="hint">(expires at {new Date(expiresAt).toLocaleString()})</span>
	{/if}
</p>

{#if flows.length > 1}
	<div class="row">
		{#each flows as flow (flow.schemeName)}
			<FormField>
				<Radio
					bind:group={schemeName}
					value={flow.schemeName}
					input$onchange={() => applyFlowDefaults(flow.schemeName)}
				/>
				{#snippet label()}
					{flow.schemeName}
				{/snippet}
			</FormField>
		{/each}
	</div>
{:else if flows.length === 0}
	<p class="hint">No OAuth 2.0 authorization code flow found in the document. Enter the URLs manually.</p>
{/if}

<div class="row">
	<Textfield bind:value={clientId.value} label="Client ID" style="width:60%;" />
	<Checkbox bind:checked={clientId.persist} label="Persist" />
</div>
<div class="row">
	<Textfield bind:value={authorizationUrl.value} label="Authorization URL" style="width:60%;" />
	<Checkbox bind:checked={authorizationUrl.persist} label="Persist" />
</div>
<div class="row">
	<Textfield bind:value={tokenUrl.value} label="Token URL" style="width:60%;" />
	<Checkbox bind:checked={tokenUrl.persist} label="Persist" />
</div>

<h4>Scopes</h4>
{#if availableScopes.length > 0}
	<div class="row">
		{#each availableScopes as [scope, description] (scope)}
			<FormField>
				<SmuiCheckbox bind:group={scopes.value} value={scope} />
				{#snippet label()}
					<span title={description}>{scope}</span>
				{/snippet}
			</FormField>
		{/each}
	</div>
{:else}
	<div class="row">
		<Textfield bind:value={scopeText} label="Scopes (space separated)" style="width:60%;" />
	</div>
{/if}
<div class="row">
	<Checkbox bind:checked={scopes.persist} label="Persist scopes" />
</div>
<div class="row">
	<Checkbox bind:checked={offlineAccess.value} label="Offline access (request refresh token)" />
	<Checkbox bind:checked={offlineAccess.persist} label="Persist" />
</div>
{#if offlineAccess.value}
	<div class="row">
		<Checkbox bind:checked={persistRefreshToken} label="Persist refresh token" />
	</div>
{/if}

<h4>Redirect URI (register this in the provider app)</h4>
<p><code data-testid="oauth-redirect-uri">{redirectUri}</code></p>
{#if !canConnect}
	<p class="hint">Connect requires the server build (the callback route is not available in static builds).</p>
{/if}

{#if errorMessage}
	<p class="error">{errorMessage}</p>
{/if}

<Button onclick={onSave}>Save</Button>
{#if status === "connected"}
	<Button onclick={disconnect}>Disconnect</Button>
{:else}
	<Button onclick={connect} disabled={!canConnect || busy || !plugin}>Connect</Button>
{/if}

<style>
	.label {
		font-weight: 600;
		margin: 0.25rem 0;
	}
	.hint {
		opacity: 0.85;
		max-width: 48rem;
		margin: 0.5rem 0;
	}
	.status {
		margin: 0.75rem 0;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin: 0.5rem 0;
	}
	.error {
		color: #b00020;
	}
	code {
		font-size: 0.9em;
	}
</style>
