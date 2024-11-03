<script lang="ts">
    import RestfulApi from "$lib/components/restful/RestfulApi.svelte";
    import { createDefaultConfig } from "$lib/anypoint"
    import json from "./api-manager-api-1.0.18-fat-oas.json"
    const config = createDefaultConfig("api-manager", JSON.stringify(json))
</script>

<RestfulApi
    {config}
></RestfulApi>
