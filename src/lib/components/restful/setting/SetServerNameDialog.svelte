<script lang="ts">
    import Dialog, { Title, Content, Actions } from "@smui/dialog";
    import Button, { Label } from "@smui/button";
    import Textfield from "@smui/textfield";
    let {onsave, serverName = $state(""), buttonText = "Set Server Name"} = $props();

    let open = $state(false);

    function save() {
        onsave(serverName);
    }
</script>

<Dialog
    bind:open
    aria-labelledby="simple-title"
    aria-describedby="simple-content"
>
    <!-- Title cannot contain leading whitespace due to mdc-typography-baseline-top() -->
    <Title>Set Server Name</Title>
    <Content>
        <Textfield bind:value={serverName}></Textfield>
    </Content>
    <Actions>
        <Button onclick={() => open = false}>
            <Label>No</Label>
        </Button>
        <Button onclick={save} disabled={!serverName}>
            <Label>Yes</Label>
        </Button>
    </Actions>
</Dialog>

<Button onclick={() => open = true} variant="outlined" color="secondary">
    {buttonText}
</Button>
