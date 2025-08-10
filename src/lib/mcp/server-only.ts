// Server-side only MCP server code
// This file should only be imported in server-side code

import { browser } from '$app/environment';

// Guard against browser execution
if (browser) {
  throw new Error('MCP server code cannot run in browser environment');
}

export { OpenApiMcpServer, createOpenApiMcpServer } from './openapi-mcp-server';
export { default as simpleMcpServer } from './simple-mcp';
