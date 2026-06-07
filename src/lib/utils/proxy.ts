
import { page } from '$app/stores';
import { get } from 'svelte/store';

/** cors-anywhere compatible: `{proxyBase}/{targetUrl}` */
export function buildProxyRequestUrl(proxyBase: string, targetUrl: string): string {
	const base = proxyBase.endsWith('/') ? proxyBase : proxyBase + '/';
	return base + targetUrl;
}

export function createProxyUrl(urlstring: string): string {
	const baseUrl = getBaseUrl();
	return buildProxyRequestUrl(baseUrl + 'api/proxy', urlstring);
}

export function getBaseUrl() {
	let baseUrl = get(page).url.origin + get(page).url.pathname
	baseUrl = baseUrl.substring(0, baseUrl.length - get(page).route.id!.length);
	if (!baseUrl.endsWith('/')) {
		baseUrl += '/';
	}
	return baseUrl

}
