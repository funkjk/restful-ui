<script lang="ts">
    import RestfulApi from "$lib/components/restful/RestfulApi.svelte";
    import { createDefaultConfig } from "$lib/anypoint"
    import json from "./cloudhub-api-1.0.33-fat-oas.json"
    const config = createDefaultConfig("cloudhub", JSON.stringify(json))
</script>

<RestfulApi
    {config}
></RestfulApi>
