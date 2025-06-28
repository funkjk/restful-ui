<script lang="ts">
	import Dialog, { Title, Content, Actions } from "@smui/dialog";
	import Button, { Icon, Label } from "@smui/button";
	import { getContext } from "svelte";
	import OperationList from "./OperationList.svelte";
    import type { Writable } from "svelte/store";
    import { RestfulOperation } from "$lib/restful/RestfulOperation";
    import { type RestfulComponentConfig } from "$lib/restful/SvelteSupport";

	const operationStore = getContext("operationStore") as Writable<RestfulOperation>;
	const config = getContext("config") as RestfulComponentConfig
	export let value: string = "";
	export let column: string = "";
	export let item: object = {};
	let open = false;
</script>

<Dialog bind:open>
	<Title>Link-{value}</Title>
	<Content>
		{#if open}
			<OperationList {config} {value} {column} {item} currentOperation={$operationStore} ></OperationList>
		{/if}
	</Content>
	<Actions>
		<Button on:click={() => (open = false)}>
			<Label>Close</Label>
		</Button>
	</Actions>
</Dialog>
<div style="display: flex; justify-content: center;">
	<Button>
		<Icon class="material-icons" on:click={() => (open = true)}>list</Icon>
	</Button><Label style="margin:auto 0px; text-align:left;width:100%;"
		>{value}</Label
	>
</div>
