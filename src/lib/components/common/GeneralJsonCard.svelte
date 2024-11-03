<script lang="ts" context="module">
  export enum CardType {
    NORMAL = "NORMAL",
    ERROR = "ERROR",
    WARNING = "WARNING",
  }
</script>

<script lang="ts">
    import { Icon } from "@smui/common";

  import ExpansionPanel from "./ExpansionPanel.svelte";
    import IconButton from "@smui/icon-button";

  export let data: any = null;
  export let title: string = "";
  export let open = false;
  export let type: CardType = CardType.NORMAL;

  const titleClassMap: Record<CardType, string> = {
    [CardType.NORMAL]: "",
    [CardType.WARNING]: "warning-title",
    [CardType.ERROR]: "error-title",
  };
  $: titleClass = titleClassMap[type];

  function copy() {
        let text = JSON.stringify(data, null, "\t");
        navigator.clipboard.writeText(text);
    }

</script>

{#if data}
  <div class ="expansion-panel">
    <ExpansionPanel {title} {open} {titleClass}>
      <div style="position:absolute;width:100%;left:-30px;top:100px;">
        <div style="display:flex; justify-content: flex-end;">
          <IconButton class="material-icons" on:click={copy}
            >content_copy</IconButton
          >
        </div>
      </div>

      <pre>
    {JSON.stringify(data, null, "\t")}
</pre>
    </ExpansionPanel>
  </div>
{/if}

<style>
  .expansion-panel {
    margin: 20px;
  }
  :global(.expansion-panel > .error-title) {
    background-color: red !important;
  }
  :global(.expansion-panel > .warning-title) {
    background-color: pink !important;
  }
</style>
