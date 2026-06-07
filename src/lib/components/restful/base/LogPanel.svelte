<script lang="ts">
    import { LogMessage } from "$lib/restful/BuiltInPlugins";
    import { Icon } from "@smui/common";
    import dayjs from "dayjs";
    import { type Writable } from "svelte/store";
    import { slide } from "svelte/transition";
    import DragMovable from "../../common/DragMovable.svelte";
    let consoleElement = $state<HTMLElement | null>(null);

    let {
		logs,
		open = $bindable(true)
	}: {
		logs: Writable<LogMessage[]>;
		open?: boolean;
	} = $props();
    let logHeight = $state(150);
    let keep = $state(false);

    $effect(() => {
		if (consoleElement && $logs && !keep) {
			consoleElement.scroll({
				top: consoleElement.scrollHeight,
				behavior: "smooth",
			});
		}
	});
    function save() {
        let downloadText = "";
        for (let log of $logs) {
            for (let idx = 0; idx < log.messages.length; idx++) {
                if (idx == 0) {
                    downloadText += log.date.toISOString() + "\t";
                } else {
                    downloadText += "\t";
                }
                downloadText += log.messages[idx];
                downloadText += "\n";
            }
        }

        var link = document.createElement("a");
        link.download = `restfulapi_log_${dayjs().format("YYYYMMDD_HHmmss")}.tsv`;
        link.href = "data:," + encodeURIComponent(downloadText);
        link.click();
    }
    let selectedIndex = $state(-1);
    const LOG_MESSAGE_MAX_LENGTH = 200;

    function formatLogMessage(message: string): string {
        if (message.length <= LOG_MESSAGE_MAX_LENGTH) {
            return message;
        }
        return message.slice(0, LOG_MESSAGE_MAX_LENGTH) + "...";
    }

    function copy() {
        let text = $logs[selectedIndex].messages.join("\n");
        navigator.clipboard.writeText(text);
    }
</script>

<div class="log-panel">
    <DragMovable
        disabled={!open}
        ondragging={(e) => (logHeight -= e.detail.movementY)}
    >
        <div class="log-panel-title">
            <span onclick={() => (open = !open)}>
                <button class="expand-button">
                    <Icon class="material-icons expand-icon"
                        >{open ? "expand_more" : "expand_less"}</Icon
                    >
                </button>
            </span>
        </div>
    </DragMovable>
    {#if open}
        <div
            class="log-panel-inner"
            style:height={logHeight + "px"}
            transition:slide={{ duration: 150 }}
        >
            <div class="log-panel-control">
                <button class="control-button" onclick={() => logs.set([])}>
                    <Icon class="material-icons">delete</Icon>
                </button>
                <button class="control-button" onclick={() => (keep = !keep)}>
                    <Icon class="material-icons"
                        >{keep ? "lock" : "lock_open"}</Icon
                    >
                </button>
                <button
                    class="control-button"
                    onclick={save}
                    disabled={$logs.length == 0}
                >
                    <Icon class="material-icons">save</Icon>
                </button>
                <button
                    class="control-button"
                    disabled={selectedIndex === -1}
                    onclick={copy}
                >
                    <Icon class="material-icons">content_copy</Icon>
                </button>
            </div>
            <div class="log-panel-console" bind:this={consoleElement}>
                {#if $logs.length == 0}
                    <div class="no-log-message">Display log message</div>
                {/if}
                <table style="border-spacing: 0px;">
                    {#each $logs as log, logIndex (logIndex)}
                        {#each log.messages as message, index (index)}
                            <tr
                                class={logIndex == selectedIndex
                                    ? "selected-row"
                                    : ""}
                                onclick={() => (selectedIndex = logIndex)}
                            >
                                {#if index == 0}
                                    <td
                                        class="time-column"
                                        valign="top"
                                        rowspan={log.messages.length}
                                    >
                                        {dayjs(log.date).format(
                                            "hh:mm:ss.SSS",
                                        )}</td
                                    >
                                {/if}
                                <td>
                                    <div>{formatLogMessage(message)}</div>
                                </td>
                            </tr>
                        {/each}
                    {/each}
                </table>
            </div>
        </div>
    {/if}
</div>

<style>
    .log-panel {
        width: 100%;
        border: 1px solid darkgray;
    }

    .log-panel-title {
        align-items: center;
        display: flex;
        line-height: 1;
        min-height: 10px;
        outline: none;
        padding: 3px 0px;
        width: 100%;
        border: none;
        justify-content: center;
        background-color: rgb(246, 246, 246);
    }
    .log-panel-title:hover {
        background-color: rgb(222, 222, 222);
    }
    .log-panel-control {
        width: 40px;
        background-color: darkgray;
    }
    .control-button {
        width: 100%;
        height: 30px;
    }
    .log-panel-inner {
        display: flex;
        padding: 5px;
        background-color: white;
        word-break: break-all;
    }
    .log-panel-console {
        overflow-y: scroll;
        overflow-x: auto;
        width: 100%;
    }
    .selected-row {
        background-color: rgb(208, 207, 207);
    }
    .time-column {
        min-width: 100px;
    }
    .no-log-message {
        padding: 5px 20px;
        color: gray;
    }
    :global(.expand-icon.mdc-button__icon) {
        margin-right: 0px !important;
    }
    .expand-button {
        border-radius: 50%;
        background: transparent;
        border: none;
        outline: none;
        background-color: rgb(196, 177, 227);
        color: #fff;
    }
</style>
