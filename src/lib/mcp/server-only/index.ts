// Server-side only MCP server entry point
// This file should NEVER be imported in browser code

import { browser } from '$app/environment';

// Guard against browser execution
if (browser) {
  throw new Error('MCP server code cannot run in browser environment');
}

// Check if we're in Vercel environment
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

// Only export types and interfaces that are safe for browser
export type { OpenApiMcpServerConfig, ProgressCallback, SseEventSender } from './openapi-mcp-server';

// Export factory function that will be dynamically imported
export async function createMcpServer(config: any) {
  // In Vercel environment, return a mock server that doesn't use Node.js specific modules
  if (isVercel) {
    console.warn('MCP server is disabled in Vercel environment due to Node.js module limitations');
    return createMockMcpServer(config);
  }
  
  try {
    const { createOpenApiMcpServer } = await import('./openapi-mcp-server');
    return createOpenApiMcpServer(config);
  } catch (error) {
    console.error('Failed to create MCP server, falling back to mock server:', error);
    return createMockMcpServer(config);
  }
}

// Mock MCP server for environments where Node.js modules are not available
function createMockMcpServer(config: any) {
  return {
    getAvailableTools: async () => [],
    getAvailableResources: async () => [],
    getAvailableResourceTemplates: async () => [],
    executeResource: async () => ({ error: 'MCP server not available in this environment' }),
    executeTool: async () => ({ error: 'MCP server not available in this environment' }),
    getOpenApiDoc: () => null,
    loadOpenApiSpec: async () => {},
    start: async () => {}
  };
}
