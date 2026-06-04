<script>
    import { page } from "$app/stores";
    import ConfigLoaderRestfulApi from "$lib/components/restful/call/config-loader/ConfigLoaderRestfulApi.svelte";
    const cid = $page.params.cid ?? "";
</script>

<ConfigLoaderRestfulApi configurationId={cid}></ConfigLoaderRestfulApi>
