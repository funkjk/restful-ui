<script>
  import ActionMenu from "$lib/components/common/ActionMenu.svelte";
  import { Meta, Story } from "@storybook/addon-svelte-csf";
</script>

<Meta title="Common/ActionMenu" component={ActionMenu} />
<Story name="Default">
  <ActionMenu>
    <div>aaa</div>
  </ActionMenu>
</Story>
