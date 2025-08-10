<script lang="ts">
    import Menu from "@smui/menu";
    import Button, { Label } from "@smui/button";
  import type { Snippet } from "svelte"
  let { content, title, children } : { content: Snippet; title: string; children: Snippet; } = $props()

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

{#if content}
    {@render content({openMenu})}
{:else}
    <Button onclick={openMenu}>
        <Label>${title}</Label>
    </Button>
{/if}

<span bind:this={menuStartElement}>
    <span class="action-menu" style:top={menuTop  +"px"} style:left={menuLeft  +"px"}>
        <Menu bind:this={menu}>
            {@render children()}
        </Menu>
    </span>
</span>

<style>
    :global(.action-menu) {
        position: fixed;
    }
</style>
