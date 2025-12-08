<script lang="ts">
    import { JSONEditor, Mode } from "svelte-jsoneditor";

    let {
		value = $bindable("")
	}: {
		value?: string;
	} = $props();

    function handleChange(updatedContent: any) {
        if (updatedContent.text || updatedContent.text === "") {
            value = updatedContent.text;
        } else {
            value = JSON.stringify(updatedContent.json);
        }
        content = updatedContent;
    }
    let content = $state({ text: value, json: undefined as any });
    $effect(() => {
        if (content.text !== value) {
            content = { text: value, json: undefined };
            if (editor) {
                editor.update(content);
            }
        }
    });
    let editor = $state<JSONEditor | null>(null);
</script>

{#if value || value === ""}
    <JSONEditor
        bind:this={editor}
        {content}
        mode={Mode.text}
        onChange={handleChange}
    />
{/if}
