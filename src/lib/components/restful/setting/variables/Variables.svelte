<script lang="ts">
	import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
	import { notifyMessage } from "$lib/stores/ui";
	import Button from "@smui/button";
	import Checkbox from "$lib/components/common/Checkbox.svelte";
	import Textfield from "@smui/textfield";
	import { onMount } from "svelte";
	import { get } from "svelte/store";

	let { config }: { config: RestfulComponentConfig } = $props();

	let entries: {
		name: string;
		expression: string;
		persist: boolean;
	}[] = $state([]);

	function addEntry() {
		entries = [
			...entries,
			{ name: "", expression: "", persist: true },
		];
	}

	onMount(() => {
		const stored = get(config.storage.requestSetting).variables?.entries;
		if (stored?.length) {
			entries = stored.map((e) => ({
				name: e.name ?? "",
				expression: e.expression ?? "",
				persist: e.persist !== false,
			}));
		} else {
			entries = [];
			addEntry();
		}
	});

	function save() {
		const current = get(config.storage.requestSetting);
		const filtered = entries
			.filter((e) => e.name.trim())
			.map((e) => ({
				name: e.name.trim(),
				expression: e.expression,
				persist: e.persist !== false,
			}));
		config.storage.requestSetting.set({
			...current,
			variables: filtered.length > 0 ? { entries: filtered } : undefined,
		});
		notifyMessage.notify("Save");
	}

	function clear() {
		entries = [];
		addEntry();
		const current = get(config.storage.requestSetting);
		config.storage.requestSetting.set({
			...current,
			variables: undefined,
		});
		notifyMessage.notify("Cleared");
	}
</script>

<h3>Variables</h3>
	<p class="hint">
		Each row is a CEL expression evaluated on every request. Use
		<code>{'${name}'}</code> in Request Headers and additional Query Parameters.
		Uncheck Persist to keep a value in session only (excluded from ConfigStore Persist).
	</p>
	<p class="hint">
		Functions: <code>timestamp()</code>, <code>timestamp_s()</code>,
		<code>uuid()</code>, <code>hmac_sha256(msg, key)</code>, <code>base64(bytes)</code>,
		<code>hex(bytes)</code>. Context: <code>request.method</code>,
		<code>request.path</code>, <code>request.body</code>. Example offset:
		<code>timestamp() + 30 * 60 * 1000</code>.
	</p>
{#each entries as entry, index (index)}
	<div class="row">
		<Textfield bind:value={entry.name} label="name" style="width:20%;" />
		<Textfield
			bind:value={entry.expression}
			label="expression (CEL)"
			style="width:45%;"
		/>
		<div class="persist">
			<Checkbox bind:checked={entry.persist} label="Persist" />
		</div>
	</div>
{/each}
<Button onclick={addEntry}>Add</Button>
<Button onclick={save}>Save</Button>
<Button onclick={clear}>Clear</Button>

<style>
	.hint {
		opacity: 0.85;
		max-width: 48rem;
		margin: 0.5rem 0;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin: 0.5rem 0;
	}
	.persist {
		min-width: 6rem;
	}
	code {
		font-size: 0.9em;
	}
</style>
