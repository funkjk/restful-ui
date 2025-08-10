// Server-side only MCP server entry point
// This file should NEVER be imported in browser code

import { browser } from '$app/environment';

// Guard against browser execution
if (browser) {
  throw new Error('MCP server code cannot run in browser environment');
}

// Only export types and interfaces that are safe for browser
export type { OpenApiMcpServerConfig, ProgressCallback, SseEventSender } from './openapi-mcp-server';

// Export factory function that will be dynamically imported
export async function createMcpServer(config: any) {
  const { createOpenApiMcpServer } = await import('./openapi-mcp-server');
  return createOpenApiMcpServer(config);
}
