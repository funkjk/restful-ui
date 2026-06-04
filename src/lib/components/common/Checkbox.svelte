<script lang="ts">
    import Checkbox from "@smui/checkbox";
    let {
		checked = $bindable(false),
		label = ""
	}: {
		checked?: boolean;
		label?: string;
	} = $props();
</script>
<div style="display:flex;">
    <Checkbox bind:checked></Checkbox>
    <span style="margin:auto 0;">{label}</span>
</div>