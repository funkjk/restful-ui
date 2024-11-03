<script lang="ts">
    import { anypointFetch } from "$lib/anypoint";
    import CircularProgress from "@smui/circular-progress";
    import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";

    export let appId;

    const fetchLogs = async function () {
        const param = {
            startTime: new Date().getTime() - 1000 * 60 * 60,
            // endTime: 1725369779999,
            // text: "sorano",
            // priority: "INFO",
            // limitMsgLen: 5000,
            limitMsgLen: 5000,
        };
        const logResponse = await anypointFetch(
            `cloudhub/api/v2/applications/${appId}/logs`,
            { method: "POST", body: param },
        );
        logItems = logResponse
    };

    let logItems = [] as any[];
</script>

<div>
    <h3>Log</h3>

    <DataTable style="width: 100%;" stickyHeader>
        <Head>
            <Row>
                <Cell>timestamp</Cell>
                <Cell>priority</Cell>
                <Cell>message</Cell>
            </Row>
        </Head>
        <Body>
            {#each logItems as item}
                <Row>
                    <Cell
                        >{item.event.timestamp
                            ? new Date(item.event.timestamp).toISOString()
                            : ""}</Cell
                    >
                    <Cell>{item.event.priority}</Cell>
                    <Cell
                        class="message"
                        style="overflow-wrap: break-word;max-width:500px;word-break:break-word;white-space: normal;"
                        >{item.event.message}</Cell
                    >
                </Row>
            {/each}
        </Body>
        {#await fetchLogs()}
            <CircularProgress
                indeterminate
                style="height: 32px; width: 32px;"
            />Loading...
        {/await}
    </DataTable>
</div>
