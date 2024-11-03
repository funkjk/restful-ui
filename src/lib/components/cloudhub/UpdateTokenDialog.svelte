<script lang="ts">
	import Dialog, { Title, Content, Actions } from "@smui/dialog";
	import Button, { Label } from "@smui/button";
    import UpdateToken from "./UpdateToken.svelte";
    export let open = false

</script>

<Dialog bind:open>
	<Title>Update Token</Title>
	<Content>
        <UpdateToken></UpdateToken>
	</Content>
	<Actions>
		<Button on:click={() => (open = false)}>
			<Label>Close</Label>
		</Button>
	</Actions>
</Dialog>
