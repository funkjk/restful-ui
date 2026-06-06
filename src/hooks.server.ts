import { withClerkHandler } from 'svelte-clerk/server';
import type { Handle } from '@sveltejs/kit';
import { applyCorsHeaders, buildCorsHeaders, isConfigsApiPath } from '$lib/server/cors';

const clerkHandle = withClerkHandler({
	debug: false,
});

function shouldSkipClerk(): boolean {
	return (
		process.env.E2E_TEST === 'true' || process.env.BUILD_STATIC === 'true'
	);
}

function withConfigsApiCors(request: Request, response: Response): Response {
	const headers = new Headers(response.headers);
	applyCorsHeaders(request, headers);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	if (isConfigsApiPath(event.url.pathname) && event.request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: buildCorsHeaders(event.request),
		});
	}

	const response = shouldSkipClerk()
		? await resolve(event)
		: await clerkHandle({ event, resolve });

	if (isConfigsApiPath(event.url.pathname)) {
		return withConfigsApiCors(event.request, response);
	}

	return response;
};
