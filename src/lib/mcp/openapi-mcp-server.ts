// // This file is deprecated. Use server-only/openapi-mcp-server.ts instead.
// // This prevents browser bundling of Node.js specific modules.

// import { browser } from '$app/environment';

// // Guard against browser execution
// if (browser) {
//   throw new Error('This MCP server file is deprecated. Use server-only version instead.');
// }

// // Re-export from server-only version
// export { OpenApiMcpServer, createOpenApiMcpServer, type OpenApiMcpServerConfig } from './server-only/openapi-mcp-server'; 