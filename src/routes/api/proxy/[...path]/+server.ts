import type { RequestEvent } from '@sveltejs/kit';
import { handleCorsAnywhereProxy } from '$lib/server/cors-anywhere-proxy';

const handler = (event: RequestEvent) => handleCorsAnywhereProxy(event);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
