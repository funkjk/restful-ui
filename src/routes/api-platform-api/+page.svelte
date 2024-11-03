<script lang="ts">
    import RestfulApi from "$lib/components/restful/RestfulApi.svelte";
    import { createDefaultConfig } from "$lib/anypoint"
    import json from "./api-platform-api-2.0.7-fat-oas.json"
    const config = createDefaultConfig("api-platform", JSON.stringify(json))

</script>

<RestfulApi
    {config}
></RestfulApi>

