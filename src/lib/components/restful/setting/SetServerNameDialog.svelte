<script lang="ts">
    import Dialog, { Title, Content, Actions } from "@smui/dialog";
    import Button, { Label } from "@smui/button";
    import { writable } from "svelte/store";
    import Textfield from "@smui/textfield";
    import { createEventDispatcher } from "svelte";
    export let buttonText: string = "Set Server Name";

    let open = writable(false);
    let clicked = writable("Nothing yet.");
    export let serverName = "";

    const dispatch = createEventDispatcher<{ save: string }>();
    function save() {
        dispatch("save", serverName);
    }
</script>

<Dialog
    bind:open={$open}
    aria-labelledby="simple-title"
    aria-describedby="simple-content"
>
    <!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
    <Title>Set Server Name</Title>
    <Content>
        <Textfield bind:value={serverName}></Textfield>
    </Content>
    <Actions>
        <Button on:click={() => clicked.set("No")}>
            <Label>No</Label>
        </Button>
        <Button on:click={save} disabled={!serverName}>
            <Label>Yes</Label>
        </Button>
    </Actions>
</Dialog>

<Button on:click={() => open.set(true)} variant="outlined" color="secondary">
    {buttonText}
</Button>
