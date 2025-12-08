<script lang="ts">
  import { CardType } from "$lib/utils/utils";
  import ExpansionPanel from "./ExpansionPanel.svelte";
  import IconButton from "@smui/icon-button";

  let {
		data = null,
		title = "",
		open = false,
		type = CardType.NORMAL
	}: {
		data?: any;
		title?: string;
		open?: boolean;
		type?: CardType;
	} = $props();
	let openState = $state(open);

  const titleClassMap: Record<CardType, string> = {
    [CardType.NORMAL]: "",
    [CardType.WARNING]: "warning-title",
    [CardType.ERROR]: "error-title",
  };
  let titleClass = $derived(titleClassMap[type]);

  function copy() {
    let text = JSON.stringify(data, null, "\t");
    navigator.clipboard.writeText(text);
  }
</script>

{#if data}
  <div class="expansion-panel">
    <ExpansionPanel {title} bind:open={openState} {titleClass}>
      <div style="position:absolute;width:100%;left:-30px;top:100px;">
        <div style="display:flex; justify-content: flex-end;">
          <IconButton class="material-icons" onclick={copy}
            >content_copy</IconButton
          >
        </div>
      </div>

      <pre style="white-space: pre-wrap;">{JSON.stringify(
          data,
          null,
          " ",
        )}</pre>
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
