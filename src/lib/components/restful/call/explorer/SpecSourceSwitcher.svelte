<script lang="ts">
	import Tab, { Label } from "@smui/tab";
	import TabBar from "@smui/tab-bar";
	import Card, { Content } from "@smui/card";
	import type { SpecSourceTab } from "$lib/restful/specSource";
	import UrlBasePage from "../url-base/UrlBasePage.svelte";
	import PasteSpecForm from "./PasteSpecForm.svelte";
	import FileSpecForm from "./FileSpecForm.svelte";

	let {
		activeTab = $bindable("url" as SpecSourceTab),
		editingUrl = $bindable(""),
		useProxy = $bindable(false),
		proxyBaseUrl = $bindable(""),
		onSetUrl,
		onSetRaw,
	}: {
		activeTab?: SpecSourceTab;
		editingUrl?: string;
		useProxy?: boolean;
		proxyBaseUrl?: string;
		onSetUrl: (url: string, proxy: { use: boolean; base: string }) => void;
		onSetRaw: (text: string, label: string) => void;
	} = $props();

	const tabs: SpecSourceTab[] = ["url", "paste", "file"];
	const tabLabels: Record<SpecSourceTab, string> = {
		url: "URL",
		paste: "Paste",
		file: "File",
	};
</script>

<Card>
	<Content>
		<TabBar tabs={tabs} bind:active={activeTab}>
			{#snippet tab(tab)}
				<Tab {tab}>
					<Label>{tabLabels[tab]}</Label>
				</Tab>
			{/snippet}
		</TabBar>

		<div hidden={activeTab !== "url"}>
			<UrlBasePage
				bind:editingUrl
				bind:useProxy
				bind:proxyBaseUrl
				onSet={onSetUrl}
			/>
		</div>
		<div hidden={activeTab !== "paste"}>
			<PasteSpecForm onSet={onSetRaw} />
		</div>
		<div hidden={activeTab !== "file"}>
			<FileSpecForm onSet={onSetRaw} />
		</div>
	</Content>
</Card>
