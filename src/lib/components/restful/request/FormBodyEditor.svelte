<script lang="ts">
    import type { RequestBodyDefinition } from "$lib/restful/RestfulOperation";
    import LayoutGrid, { Cell } from "@smui/layout-grid";
    import Select, { Option } from "@smui/select";
    import Textfield from "@smui/textfield";
    import Tooltip, { Wrapper } from "@smui/tooltip";

    export let value: string;
    export let definition: RequestBodyDefinition;

    $: properties = definition.properties;
    $: required = definition.required ?? [];

    function initFormValue() {
        const val = {} as Record<string, any>;
        const valueObject = fromFormUrlEncoded(value);
        for (const name in definition.properties) {
            const def = definition.properties[name]
            val[name] = valueObject[name] ?? def.default ?? "";
        }
        return val;
    }
    let formValue = initFormValue();
    $: {
        value = toFormUrlEncoded(formValue);
    }
    export function toFormUrlEncoded(object: Record<string, any>) {
        return Object.entries(object)
            .map(
                ([key, value]) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
            )
            .join("&");
    }
    export function fromFormUrlEncoded(value: string): Record<string, any> {
        const valueObject = decodeURIComponent(value);
        const result = {} as Record<string, any>;
        const pairs = valueObject.split("&");
        for (const pair of pairs) {
            const [key, value] = pair.split("=");
            result[key] = value;
        }
        return result;
    }
</script>

<div>
    <LayoutGrid>
        {#each Object.entries(properties) as [name, property]}
            <Cell span={3}>
                <Wrapper>
                    {#if property.enum}
                        <Select
                            bind:value={formValue[name]}
                            label={name + (required.includes(name) ? "*" : "")}
                        >
                            {#each property.enum as enumValue}
                                <Option value={enumValue}>{enumValue}</Option>
                            {/each}
                        </Select>
                    {:else}
                        <Textfield
                            bind:value={formValue[name]}
                            label={name + (required.includes(name) ? "*" : "")}
                        ></Textfield>
                    {/if}
                    {#if property.description}
                        <Tooltip>
                            {property.description}
                        </Tooltip>
                    {/if}
                </Wrapper>
            </Cell>
        {/each}
    </LayoutGrid>
</div>
