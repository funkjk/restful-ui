import type { RequestHandler } from './$types';
import { getMcpRequest, postMcpRequest } from '$lib/mcp/server-http';


export const GET: RequestHandler = async ({request}) => {
  return getMcpRequest("default", request);
};

export const POST: RequestHandler = async ({ request }) => {
  return postMcpRequest("default", request);
}; 