
import type { ServerConfig, ServerConfigResponse } from '$lib/restful/config-server/ServerSupport';

export type McpServerCliConfig = Partial<ServerConfig> & {
  file?: string;
}

export const defaultConfig: McpServerCliConfig = {
  serverName: 'openapi-mcp-server',
  serverVersion: '1.0.0',
  timeout: 30000, // 30 seconds
  maxRetries: 3
};

export async function createConfig(overrides: McpServerCliConfig): Promise<ServerConfig> {
  let config: McpServerCliConfig = overrides
  if (config.file) {
    // File loading is disabled in browser environment
    throw new Error('File loading is not supported in this environment');
  }

  return {
    ...defaultConfig,
    ...config,
  } as ServerConfig;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function parseConfigFromArgs(args: string[]): McpServerCliConfig {
  const config: McpServerCliConfig = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--file':
      case '-f':
        config.file = value;
        break;
      case '--url':
      case '-u':
        config.openApiUrl = value;
        break;
      case '--name':
      case '-n':
        config.serverName = value;
        break;
      case '--version':
      case '-v':
        config.serverVersion = value;
        break;
      case '--timeout':
      case '-t':
        config.timeout = parseInt(value, 10);
        break;
      case '--max-retries':
      case '-r':
        config.maxRetries = parseInt(value, 10);
        break;
    }
  }
  
  return config;
}

export function parseConfigFromEnv(): McpServerCliConfig {
  const config: McpServerCliConfig = {};
  
  if (process.env.FILE_PATH) {
    config.file = process.env.FILE_PATH;
  }

  if (process.env.OPENAPI_URL) {
    config.openApiUrl = process.env.OPENAPI_URL;
  }
  
  if (process.env.MCP_SERVER_NAME) {
    config.serverName = process.env.MCP_SERVER_NAME;
  }
  
  if (process.env.MCP_SERVER_VERSION) {
    config.serverVersion = process.env.MCP_SERVER_VERSION;
  }
  
  
  if (process.env.API_TIMEOUT) {
    config.timeout = parseInt(process.env.API_TIMEOUT, 10);
  }
  
  if (process.env.API_MAX_RETRIES) {
    config.maxRetries = parseInt(process.env.API_MAX_RETRIES, 10);
  }
  
  return config;
} 