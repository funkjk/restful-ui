<script lang="ts">
    import Menu from "@smui/menu";
    import Button, { Label } from "@smui/button";
    export let title = "Open Menu";

    let menu: Menu;
    function openMenu() {
        menu.setOpen(true);
        const rect = menuStartElement.getBoundingClientRect();
        menuTop = rect.top;
        menuLeft = rect.left;
    }
    let menuTop: number;
    let menuLeft: number;
    let menuStartElement: HTMLElement;
</script>

<slot name="action" {menu} {openMenu}>
    <Button on:click={openMenu}>
        <Label>${title}</Label>
    </Button>
</slot>
<span bind:this={menuStartElement}>
    <span class="action-menu" style:top={menuTop  +"px"} style:left={menuLeft  +"px"}>
        <Menu bind:this={menu}>
            <slot></slot>
        </Menu>
    </span>
</span>

<style>
    :global(.action-menu) {
        position: fixed;
    }
</style>
