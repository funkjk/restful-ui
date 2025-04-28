import type { RequestEvent } from '@sveltejs/kit';
export async function GET(parameters: RequestEvent) {
	const path = parameters.params.path!;
	const paths = path.split("/")
	let url;
	if (paths[2] === "") {
		url = `${paths[0]}//${paths[1]}/${paths.slice(3).join("/")}`;
	} else {
		url = `${paths[0]}//${paths[1]}:${paths[2]}/${paths.slice(3).join("/")}`;
	}
	return doReuqest(url!, "GET", {});
}
export async function POST(requestEvent: RequestEvent) {
	const { url, method, headers, body } = await parseRequest(requestEvent);
	return doReuqest(url, method, headers, body);
}

async function doReuqest(url: string, method: string, headers: Record<string, string>, body?: string) {
	if (!url || !method) {
		return new Response('Missing url or method', { status: 400 });
	}
	// TODO Logging
	console.log("url", {url, method, headers});
	try {
		const rawProxyResponse = await fetch(url, {
			method,
			headers,
			body: body
		});
		const proxyResponse = {
			status: rawProxyResponse.status,
			headers: Object.fromEntries(rawProxyResponse.headers.entries()),
			responseBody: await rawProxyResponse.text()
		}
		return new Response(proxyResponse.responseBody, {
			headers: {
				'Content-Type': 'application/json'
			}
		});

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