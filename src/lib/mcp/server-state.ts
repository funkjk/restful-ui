import type { OpenApiMcpServer } from './openapi-mcp-server';
import type { McpServerConfig } from './config';

// グローバルサーバー状態
let mcpServerInstance: OpenApiMcpServer | null = null;
let serverConfig: McpServerConfig | null = null;

export function setMcpServer(server: OpenApiMcpServer, config: McpServerConfig) {
  mcpServerInstance = server;
  serverConfig = config;
}

export function getMcpServer(): OpenApiMcpServer | null {
  return mcpServerInstance;
}

export function getServerConfig(): McpServerConfig | null {
  return serverConfig;
}

export function clearMcpServer() {
  mcpServerInstance = null;
  serverConfig = null;
}

export function isServerInitialized(): boolean {
  return mcpServerInstance !== null;
} 