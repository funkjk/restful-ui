import type { RequestEvent } from '@sveltejs/kit';
import { isOriginAllowed } from '$lib/server/cors';

const PROXY_PATH_SEGMENT = '/api/proxy/';

const HOP_BY_HOP_HEADERS = new Set([
	'connection',
	'keep-alive',
	'proxy-authenticate',
	'proxy-authorization',
	'te',
	'trailers',
	'transfer-encoding',
	'upgrade',
]);

/** Stripped from upstream responses; fetch decompresses the body but may leave these headers. */
const STRIP_UPSTREAM_RESPONSE_HEADERS = new Set([
	...HOP_BY_HOP_HEADERS,
	'content-encoding',
	'content-length',
	'content-md5',
]);

/**
 * cors-anywhere parseURL equivalent.
 * @see https://github.com/Rob--W/cors-anywhere/blob/master/lib/cors-anywhere.js
 */
export function parseProxyTargetUrl(pathAndSearch: string): URL | null {
	let reqUrl = pathAndSearch;
	const match = reqUrl.match(
		/^(?:(https?:)?\/\/)?(([^\/?#]+?)(?::(\d{0,5})(?=[\/?#]|$))?)([\/?#][\S\s]*|$)/i,
	);
	if (!match) {
		return null;
	}
	if (!match[1]) {
		if (/^https?:/i.test(reqUrl)) {
			return null;
		}
		if (reqUrl.lastIndexOf('//', 0) === -1) {
			reqUrl = '//' + reqUrl;
		}
		reqUrl = (match[4] === '443' ? 'https:' : 'http:') + reqUrl;
	}
	try {
		const parsed = new URL(reqUrl);
		if (!parsed.hostname) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

function extractTargetUrl(event: RequestEvent): URL | null {
	const pathParam = event.params.path;
	if (pathParam) {
		return parseProxyTargetUrl(pathParam + event.url.search);
	}

	const { pathname, search } = event.url;
	if (!pathname.includes('/api/proxy/')) {
		return null;
	}
	const index = pathname.indexOf(PROXY_PATH_SEGMENT);
	const raw = pathname.slice(index + PROXY_PATH_SEGMENT.length) + search;
	if (!raw) {
		return null;
	}
	return parseProxyTargetUrl(raw);
}

function buildProxyCorsHeaders(request: Request): Headers {
	const headers = new Headers();
	const origin = request.headers.get('Origin');
	const hasOriginRestriction = Boolean(process.env.CORS_ALLOWED_ORIGINS?.trim());

	if (!hasOriginRestriction) {
		headers.set('Access-Control-Allow-Origin', '*');
	} else if (origin && isOriginAllowed(origin)) {
		headers.set('Access-Control-Allow-Origin', origin);
		headers.set('Access-Control-Allow-Credentials', 'true');
		headers.append('Vary', 'Origin');
	} else if (!origin) {
		headers.set('Access-Control-Allow-Origin', '*');
	}

	const requestMethod = request.headers.get('Access-Control-Request-Method');
	if (requestMethod) {
		headers.set('Access-Control-Allow-Methods', requestMethod);
	} else {
		headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
	}

	const requestHeaders = request.headers.get('Access-Control-Request-Headers');
	if (requestHeaders) {
		headers.set('Access-Control-Allow-Headers', requestHeaders);
	} else {
		headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	}

	headers.set('Access-Control-Max-Age', '86400');
	return headers;
}

function forbiddenOriginResponse(request: Request): Response {
	const headers = buildProxyCorsHeaders(request);
	return new Response('The origin was not whitelisted by the operator of this proxy.', {
		status: 403,
		headers,
	});
}

function buildForwardHeaders(request: Request, target: URL): Headers {
	const headers = new Headers(request.headers);
	for (const name of HOP_BY_HOP_HEADERS) {
		headers.delete(name);
	}
	headers.delete('host');
	headers.delete('origin');
	headers.delete('referer');
	headers.set('host', target.host);
	return headers;
}

function buildProxyResponse(request: Request, upstream: Response): Response {
	const headers = new Headers();
	for (const [key, value] of upstream.headers.entries()) {
		if (!STRIP_UPSTREAM_RESPONSE_HEADERS.has(key.toLowerCase())) {
			headers.append(key, value);
		}
	}
	headers.delete('set-cookie');
	headers.delete('set-cookie2');

	const corsHeaders = buildProxyCorsHeaders(request);
	for (const [key, value] of corsHeaders.entries()) {
		headers.set(key, value);
	}

	const exposed = [...headers.keys()].join(',');
	if (exposed) {
		headers.set('Access-Control-Expose-Headers', exposed);
	}

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers,
	});
}

export async function handleCorsAnywhereProxy(event: RequestEvent): Promise<Response> {
	const { request } = event;
	const origin = request.headers.get('Origin');
	if (origin && !isOriginAllowed(origin)) {
		return forbiddenOriginResponse(request);
	}

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 200,
			headers: buildProxyCorsHeaders(request),
		});
	}

	const target = extractTargetUrl(event);
	if (!target) {
		const headers = buildProxyCorsHeaders(request);
		if (/^\/api\/proxy\/https?:\/[^/]/i.test(event.url.pathname + event.url.search)) {
			return new Response('The URL is invalid: two slashes are needed after the http(s):.', {
				status: 400,
				headers,
			});
		}
		return new Response('Invalid URL. Usage: /api/proxy/https://example.com/path', {
			status: 400,
			headers,
		});
	}

	try {
		const forwardHeaders = buildForwardHeaders(request, target);
		const body =
			request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

		const upstream = await fetch(target.href, {
			method: request.method,
			headers: forwardHeaders,
			body: body && body.byteLength > 0 ? body : undefined,
			redirect: 'manual',
		});

		return buildProxyResponse(request, upstream);
	} catch (error) {
		const headers = buildProxyCorsHeaders(request);
		const message = error instanceof Error ? error.message : String(error);
		return new Response(`Proxy error: ${message}`, { status: 502, headers });
	}
}
