<script lang="ts">
  import Button, { Icon, Label } from "@smui/button";
  import type { CacheBodyParameter } from "$lib/restful/BuiltInPlugins";
  import Checkbox from "@smui/checkbox";
  import Dialog, { Actions, Content, Title } from "@smui/dialog";
  import DataTable, { Body, Cell, Head, Row } from "@smui/data-table";
  import type { RestfulOperation } from "$lib/restful/RestfulOperation";
  import FormField from "@smui/form-field";
  let {
		histories = [],
		currentOperation,
		value,
		onselect
	}: {
		histories?: CacheBodyParameter[];
		currentOperation: RestfulOperation;
		value: any;
		onselect?: (bodyParameter: any) => void;
	} = $props();
  let open = $state(false);
  let onlySamePathFilter = $state(false);
  let pathParameters = $derived(currentOperation.getPathParameters());
  let filteredHistories = $derived(histories.filter((history) => {
    return (
      !onlySamePathFilter ||
      pathParameters.every(
        (param) =>
          history.additionalParameter &&
          history.additionalParameter[param] == value[param],
      )
    );
  }));
  let pathParameterValue = $derived(pathParameters.map(param => value[param]).filter(e => e));

  function select(selectedIndex: number) {
    onselect?.(histories[selectedIndex].bodyParameter);
    open = false;
  }
</script>

<span>
  <Button onclick={() => (open = true)} disabled={histories.length == 0}
    ><Icon class="material-icons">history</Icon><Label>Histories</Label></Button
  >
</span>
<Dialog bind:open surface$style="width: 850px; max-width: calc(100vw - 32px); position:absolute; top: 200px;">
  <Title>Select History</Title>
  <Content>
    {#if pathParameterValue.length > 0}
      <div>
        <FormField>
          <Checkbox bind:checked={onlySamePathFilter} />
          <span slot="label"
            >Only Same Path (
            {#each pathParameters as param, index (index)}
              {value[param]} &nbsp;
            {/each}
            )
          </span>
        </FormField>
      </div>
    {/if}
    <DataTable class="history-table">
      <Head>
        <Row>
          {#each pathParameters as param, index (index)}
            <Cell>{param}</Cell>
          {/each}
          <Cell>Value</Cell>
        </Row>
      </Head>
      <Body>
        {#each filteredHistories as history, historyIndex (historyIndex)}
          <Row onclick={() => select(historyIndex)}>
            {#each pathParameters as param, index (index)}
              <Cell
                >{history.additionalParameter
                  ? history.additionalParameter[param]
                  : ""}</Cell
              >
            {/each}
            <Cell>{history.bodyParameter}</Cell>
          </Row>
        {/each}
      </Body>
    </DataTable>
  </Content>

  <Actions>
    <Button onclick={() => (open = false)}>
      <Label>close</Label>
    </Button>
  </Actions>
</Dialog>

<style>
  .history-table {
    width: 100%;
  }
</style>
