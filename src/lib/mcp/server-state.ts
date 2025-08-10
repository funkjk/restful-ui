import { loadConfig } from '$lib/restful/config-server/ConfigStore';
import type { ServerConfig } from '$lib/restful/config-server/ServerSupport';
import { browser } from '$app/environment';

// Type definitions for MCP server
type OpenApiMcpServer = any;
type CreateOpenApiMcpServerFunction = any;


type ServerState = {
  mcpServer: OpenApiMcpServer | null;
  serverConfig: ServerConfig | null;
}

let mcpServerInstance: Map<string, ServerState> = new Map();

export function setMcpServer(cid:string, server: OpenApiMcpServer, config: ServerConfig) {
  mcpServerInstance.set(cid, {mcpServer: server, serverConfig: config});
}

export function getMcpServer(cid:string): OpenApiMcpServer | null {
  return mcpServerInstance.get(cid)?.mcpServer ?? null;
}

export function getServerConfig(cid:string): ServerConfig | null {
  return mcpServerInstance.get(cid)?.serverConfig ?? null;
}

export function clearMcpServer(cid:string) {
  mcpServerInstance.delete(cid);
}

export function isServerInitialized(cid:string): boolean {
  return mcpServerInstance.has(cid);
} 

export async function startInitializeMcpServer(cid:string) {
  if (isServerInitialized(cid)) {
    return true;
  }
  
  // Only run on server-side
  if (browser) {
    return false;
  }
  
  const serverConfig = await loadConfig(cid);
  if (serverConfig) {
    try {
      // Dynamic import to avoid browser bundling
      const { createOpenApiMcpServer } = await import('./openapi-mcp-server');
      const mcpServer = await createOpenApiMcpServer(serverConfig.config);
      setMcpServer(cid, mcpServer, serverConfig.config);
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP server:', error);
      return false;
    }
  } else {
    return false;
  }
}