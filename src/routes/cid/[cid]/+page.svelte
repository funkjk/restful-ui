<script>
    import { page } from "$app/stores";
    import ConfigLoaderRestfulApi from "$lib/components/restful/call/config-loader/ConfigLoaderRestfulApi.svelte";
</script>

<ConfigLoaderRestfulApi configurationId={$page.params.cid}></ConfigLoaderRestfulApi>
