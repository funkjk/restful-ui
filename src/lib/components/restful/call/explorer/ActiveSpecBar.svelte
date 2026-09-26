<script lang="ts">
	import Card, { Content, Actions } from "@smui/card";
	import Button, { Label } from "@smui/button";
	import type { SpecSource } from "$lib/restful/specSource";

	let {
		source,
		onClear,
	}: {
		source: SpecSource;
		onClear: () => void;
	} = $props();
</script>

<Card>
	<Content>
		{#if source.kind === "url"}
			<a href={source.url} target="_blank" rel="noopener noreferrer"
				>{source.url}</a
			>
		{:else}
			{source.label}
		{/if}
	</Content>
	<Actions>
		<Button onclick={onClear}>
			<Label>clear</Label>
		</Button>
	</Actions>
</Card>
