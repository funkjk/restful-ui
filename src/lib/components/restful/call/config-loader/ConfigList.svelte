<script lang="ts">
  import Select, { Option } from '@smui/select';
    import Card, { Content, Actions } from "@smui/card";
    import Button, { Label } from "@smui/button";
    import type { ServerConfigResponse } from '$lib/restful/config-server/ServerSupport';
    import { goto } from '$app/navigation';


    let value = $state('Orange');
    let configList = $state([] as ServerConfigResponse[]);

    async function loadConfigList() {
        const configListResponse = await fetch("/api/configs");
        const configListJson = await configListResponse.json();
        configList = configListJson;
    }

    $effect(() => {
        loadConfigList();
    });

    function goConfig() {
        goto(`/cid/${value}`);
    }

</script>

    <Card>
        <Content>
            <Select bind:value={value} label="Config List">
                {#each configList as config}
                    <Option value={config.configurationId}>{config.config.serverName}</Option>
                {/each}
            </Select>
        </Content>
        <Actions>
            <Button onclick={() => goConfig()} disabled={!value}>
                <Label>Go</Label>
            </Button>
        </Actions>
    </Card>
