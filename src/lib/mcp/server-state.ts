import type { ServerConfig } from '$lib/restful/serverSupport';
import type { OpenApiMcpServer } from './openapi-mcp-server';

// グローバルサーバー状態
let mcpServerInstance: OpenApiMcpServer | null = null;
let serverConfig: ServerConfig | null = null;

export function setMcpServer(server: OpenApiMcpServer, config: ServerConfig) {
  mcpServerInstance = server;
  serverConfig = config;
}

export function getMcpServer(): OpenApiMcpServer | null {
  return mcpServerInstance;
}

export function getServerConfig(): ServerConfig | null {
  return serverConfig;
}

export function clearMcpServer() {
  mcpServerInstance = null;
  serverConfig = null;
}

export function isServerInitialized(): boolean {
  return mcpServerInstance !== null;
} 