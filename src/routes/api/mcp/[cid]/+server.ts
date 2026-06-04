import type { RequestHandler } from './$types';
import { getMcpRequest, postMcpRequest } from '$lib/mcp/server-http';


export const GET: RequestHandler = async ({request, params}) => {
  return getMcpRequest(params.cid, request);
};

export const POST: RequestHandler = async ({ request, params }) => {
  return postMcpRequest(params.cid, request);
}; 