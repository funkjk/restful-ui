<script>
    import UrlBasePage from "$lib/components/restful/call/url-base/UrlBasePage.svelte";
    
    const buildTime = import.meta.env.BUILD_TIME || '';
</script>
<UrlBasePage></UrlBasePage>
<div style="position: fixed; bottom: 0; right: 0; padding: 8px; font-size: 12px; color: #666;">
    built at {buildTime}
</div>