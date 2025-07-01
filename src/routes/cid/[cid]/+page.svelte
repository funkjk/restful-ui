<script>
    import { page } from "$app/stores";
    import ConfigLoaderRestfulApi from "$lib/components/restful/call/config-loader/ConfigLoaderRestfulApi.svelte";
    const { cid } = $page.params;
</script>

<ConfigLoaderRestfulApi configurationId={cid}></ConfigLoaderRestfulApi>
