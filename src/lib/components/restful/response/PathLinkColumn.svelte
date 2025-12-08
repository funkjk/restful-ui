<script lang="ts">
	import Dialog, { Title, Content, Actions } from "@smui/dialog";
	import Button, { Icon, Label } from "@smui/button";
	import { getContext } from "svelte";
	import OperationList from "./OperationList.svelte";
    import type { Writable } from "svelte/store";
    import { RestfulOperation } from "$lib/restful/RestfulOperation";
    import { type RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";

	const operationStore = getContext("operationStore") as Writable<RestfulOperation>;
	const config = getContext("config") as RestfulComponentConfig
	let {
		value = "",
		column = "",
		item = {}
	}: {
		value?: string;
		column?: string;
		item?: object;
	} = $props();
	let open = $state(false);
</script>

<Dialog bind:open>
	<Title>Link-{value}</Title>
	<Content>
		{#if open}
			<OperationList {config} {value} {column} {item} currentOperation={$operationStore} ></OperationList>
		{/if}
	</Content>
	<Actions>
		<Button onclick={() => (open = false)}>
			<Label>Close</Label>
		</Button>
	</Actions>
</Dialog>
<div style="display: flex; justify-content: center;">
	<Button>
		<Icon class="material-icons" onclick={() => (open = true)}>list</Icon>
	</Button><Label style="margin:auto 0px; text-align:left;width:100%;"
		>{value}</Label
	>
</div>
