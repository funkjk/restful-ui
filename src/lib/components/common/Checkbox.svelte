<script lang="ts">
    import Checkbox from "@smui/checkbox";
    export let checked: boolean;
    export let label: string;
</script>
<div style="display:flex;">
    <Checkbox bind:checked></Checkbox>
    <span style="margin:auto 0;">{label}</span>
</div>