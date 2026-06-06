const CONFIGS_API_PREFIX = '/api/configs';

export function isConfigsApiPath(pathname: string): boolean {
	return pathname === CONFIGS_API_PREFIX || pathname.startsWith(`${CONFIGS_API_PREFIX}/`);
}

function getAllowedOrigins(): string[] | null {
	const raw = process.env.CORS_ALLOWED_ORIGINS;
	if (!raw?.trim()) {
		return null;
	}
	return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function isOriginAllowed(origin: string): boolean {
	const allowed = getAllowedOrigins();
	if (allowed === null) {
		return true;
	}
	return allowed.includes(origin);
}

export function buildCorsHeaders(request: Request): Headers {
	const headers = new Headers();
	const origin = request.headers.get('Origin');

	if (origin && isOriginAllowed(origin)) {
		headers.set('Access-Control-Allow-Origin', origin);
		headers.set('Access-Control-Allow-Credentials', 'true');
		headers.append('Vary', 'Origin');
	} else if (!origin) {
		headers.set('Access-Control-Allow-Origin', '*');
	}

	headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	headers.set(
		'Access-Control-Allow-Headers',
		request.headers.get('Access-Control-Request-Headers') ?? 'Content-Type, Authorization',
	);
	headers.set('Access-Control-Max-Age', '86400');

	return headers;
}

export function applyCorsHeaders(request: Request, responseHeaders: Headers): void {
	for (const [key, value] of buildCorsHeaders(request).entries()) {
		responseHeaders.set(key, value);
	}
}
