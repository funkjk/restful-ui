import { page } from '$app/stores';
import * as publicEnv from '$env/static/public';
import { get } from 'svelte/store';

function getPublicCorsProxyUrlFromEnv(): string | undefined {
	const value = (publicEnv as Record<string, string | undefined>).PUBLIC_CORS_PROXY_URL;
	const trimmed = value?.trim();
	return trimmed || undefined;
}

/** cors-anywhere compatible: `{proxyBase}/{encodeURIComponent(targetUrl)}` */
export function buildProxyRequestUrl(proxyBase: string, targetUrl: string): string {
	const base = proxyBase.endsWith('/') ? proxyBase : proxyBase + '/';
	return base + encodeURIComponent(targetUrl);
}

function getSameOriginProxyPath(): string {
	const base = import.meta.env.BUILD_BASE_PATH ?? '';
	if (!base || base === '/') {
		return '/api/proxy';
	}
	return `${base.replace(/\/$/, '')}/api/proxy`;
}

/** Default proxy base: PUBLIC_CORS_PROXY_URL, else same-origin /api/proxy */
export function getDefaultProxyBaseUrl(): string {
	const fromEnv = getPublicCorsProxyUrlFromEnv();
	if (fromEnv) {
		return fromEnv.replace(/\/$/, '');
	}
	if (typeof window !== 'undefined') {
		return `${window.location.origin}${getSameOriginProxyPath()}`;
	}
	return getSameOriginProxyPath();
}

/** Use stored value when set, otherwise the default proxy base URL */
export function resolveProxyBaseUrl(stored?: string): string {
	const trimmed = stored?.trim();
	return trimmed || getDefaultProxyBaseUrl();
}

export function createProxyUrl(urlstring: string, proxyBaseUrl?: string): string {
	return buildProxyRequestUrl(resolveProxyBaseUrl(proxyBaseUrl), urlstring);
}

export function getBaseUrl() {
	let baseUrl = get(page).url.origin + get(page).url.pathname
	baseUrl = baseUrl.substring(0, baseUrl.length - get(page).route.id!.length);
	if (!baseUrl.endsWith('/')) {
		baseUrl += '/';
	}
	return baseUrl

}
