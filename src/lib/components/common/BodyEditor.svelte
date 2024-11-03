<script lang="ts">
    import { JSONEditor, Mode } from "svelte-jsoneditor";

    export let value: string;

    function handleChange(updatedContent: any) {
        if (updatedContent.text || updatedContent.text === "") {
            value = updatedContent.text;
        } else {
            value = JSON.stringify(updatedContent.json);
        }
        content = updatedContent;
    }
    let content = { text: value, json: undefined as any };
    $: {
        if (content.text !== value) {
            content = { text: value, json: undefined };
            if (editor) {
                editor.update(content);
            }
        }
    }
    let editor: JSONEditor;
</script>

{#if value || value === ""}
    <JSONEditor
        bind:this={editor}
        {content}
        mode={Mode.text}
        onChange={handleChange}
    />
{/if}
