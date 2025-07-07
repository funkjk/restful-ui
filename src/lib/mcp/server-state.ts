import type { ServerConfig } from '$lib/restful/config-server/ServerSupport';
import type { OpenApiMcpServer } from './openapi-mcp-server';


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