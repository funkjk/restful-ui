<script lang="ts">
  import { CardType } from "$lib/utils/utils";
	import VirtualList from '@sveltejs/svelte-virtual-list'
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


  const lines =  $derived.by(()=> {
    if (!data) {
      return []
    }
    if (!openState) {
      return []
    }
    const dataString = JSON.stringify(
          data,
          null,
          " ",
        );
      return dataString.split("\n")
  })

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
      <div class="pre-container">
        <VirtualList
          let:item
          height="500px"
          items={lines}
        >
          <div class="pre-line">{item}</div>
        </VirtualList>
      </div>
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
  .pre-container {
    overflow: auto;
    white-space: pre-wrap;
    font-family: monospace;
    display: block;
    line-height: 20px;
    tab-size: 4;
  }
  .pre-line {
    display: block;
    margin: 0;
    padding: 0;
  }
</style>
