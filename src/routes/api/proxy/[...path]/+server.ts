import type { RequestEvent } from '@sveltejs/kit';
export async function GET(parameters: RequestEvent) {
	const path = parameters.params.path!;
	const paths = path.split("/")
	if (paths.length < 2) {
		return new Response('Invalid path', { status: 400 });
	}
	const url = `${paths[0]}//${paths[1]}/${paths.slice(2).join("/")}`;
	// TODO any way to set headers to get oas file
	const headers = {}
	return doReuqest({ url, method: "GET", headers }, async (rawProxyResponse: Response) => {
		const newHeaders = new Headers();
		addCorsHeaders(newHeaders);
		return new Response(rawProxyResponse.body, {
			status: rawProxyResponse.status,
			headers: newHeaders
		});
	});
}
export async function POST(requestEvent: RequestEvent) {
	const { url, method, headers, body } = await parseRequest(requestEvent);
	return doReuqest({ url, method, headers, body }, async (rawProxyResponse: Response) => {
		const newHeaders = new Headers();
		addCorsHeaders(newHeaders);
		newHeaders.append('Content-Type', 'application/json');
		const proxyResponse = {
			status: rawProxyResponse.status,
			headers: Object.fromEntries(rawProxyResponse.headers.entries()),
			responseBody: await rawProxyResponse.text()
		}
		return new Response(JSON.stringify(proxyResponse), {
			status: 200,
			headers: newHeaders
		});
	});
}
export async function OPTIONS() {
	const newHeaders = new Headers();
	addCorsHeaders(newHeaders);
	newHeaders.append('Content-Type', 'application/json');
	return new Response("", { headers: newHeaders });
}

async function doReuqest(params: { url: string, method: string, headers: Record<string, string>, body?: string },
	toResponse: (rawProxyResponse: Response) => Promise<Response>) {
	const { url, method, headers, body } = params;
	if (!url || !method) {
		return new Response('Missing url or method', { status: 400 });
	}
	// TODO Logging
	console.log("url", { url, method, headers });
	try {
		const rawProxyResponse = await fetch(url, {
			method,
			headers,
			body: body
		});
		return await toResponse(rawProxyResponse);
	} catch (error) {
		console.error('Error during proxy request:', error);
		return new Response(JSON.stringify(error
		), { status: 400 });
	}
}

async function parseRequest(requestEvent: RequestEvent) {
	try {
		const { url, method, headers, body } = await requestEvent.request.json();
		return { url, method, headers, body };
	} catch (error) {
		console.error('Error parsing request:', error);
		return {};
	}
}

function addCorsHeaders(headers: Headers) {
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	headers.set('Access-Control-Allow-Headers', 'Content-Type');
	headers.set('Access-Control-Max-Age', '86400');
}