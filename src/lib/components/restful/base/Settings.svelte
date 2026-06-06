<script lang="ts">
    import { type RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
    import Storage from "../setting/Storage.svelte";
    import Radio from "@smui/radio";
    import FormField from "@smui/form-field";
    import Request from "../setting/Request.svelte";
    import Persist from "../setting/Persist.svelte";
    import { isServerBuildMode } from "$lib/utils/build-mode";
    let { config }: { config: RestfulComponentConfig } = $props();

    let options = $state([
        { name: "Request", value: Request },
        { name: "Storage", value: Storage },
    ]);
    if ( isServerBuildMode()) {
        options.push(
            { name: "Persist", value: Persist })
    }
    let selected = $state(options[0]);
</script>

{#each options as option (option)}
    <FormField>
        <Radio bind:group={selected} value={option} />
        {#snippet label()}
            {option.name}
        {/snippet}
    </FormField>
{/each}

{#if selected.value}
    {@const Component = selected.value}
    <Component {config} />
{/if}
