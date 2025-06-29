import { json, type RequestEvent } from '@sveltejs/kit';
export async function GET(parameters: RequestEvent) {
	return json(
		{
			message: "Hello World",
			parameters
		},
		{
			status: 200,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '86400'
			}
		}
	)
}

export async function POST(requestEvent: RequestEvent) {
	console.log("POST", requestEvent);
	return json(
		{
			message: "Hello World",
		},
		{
			status: 200,
		}
	)
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


function addCorsHeaders(headers: Headers) {
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	headers.set('Access-Control-Allow-Headers', 'Content-Type');
	headers.set('Access-Control-Max-Age', '86400');
}