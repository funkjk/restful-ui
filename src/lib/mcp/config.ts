import type { RequestSettings } from '$lib/types/request-config';

export interface McpServerConfig {
  serverName: string;
  serverVersion: string;
  openApiUrl: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  requestSettings?: RequestSettings;
}

export interface SavedMcpConfig {
  id: string;
  name: string;
  description?: string;
  config: McpServerConfig;
  createdAt: Date;
  updatedAt: Date;
}

export const defaultConfig: Partial<McpServerConfig> = {
  serverName: 'openapi-mcp-server',
  serverVersion: '1.0.0',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

export function createConfig(overrides: Partial<McpServerConfig>): McpServerConfig {
  if (!overrides.openApiUrl) {
    throw new Error('openApiUrl is required');
  }

  return {
    ...defaultConfig,
    ...overrides,
  } as McpServerConfig;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function parseConfigFromArgs(args: string[]): Partial<McpServerConfig> {
  const config: Partial<McpServerConfig> = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
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
      case '--base-url':
      case '-b':
        config.baseUrl = value;
        break;
      case '--timeout':
      case '-t':
        config.timeout = parseInt(value, 10);
        break;
      case '--max-retries':
      case '-r':
        config.maxRetries = parseInt(value, 10);
        break;
      case '--retry-delay':
      case '-d':
        config.retryDelay = parseInt(value, 10);
        break;
    }
  }
  
  return config;
}

export function parseConfigFromEnv(): Partial<McpServerConfig> {
  const config: Partial<McpServerConfig> = {};
  
  if (process.env.OPENAPI_URL) {
    config.openApiUrl = process.env.OPENAPI_URL;
  }
  
  if (process.env.MCP_SERVER_NAME) {
    config.serverName = process.env.MCP_SERVER_NAME;
  }
  
  if (process.env.MCP_SERVER_VERSION) {
    config.serverVersion = process.env.MCP_SERVER_VERSION;
  }
  
  if (process.env.API_BASE_URL) {
    config.baseUrl = process.env.API_BASE_URL;
  }
  
  if (process.env.API_TIMEOUT) {
    config.timeout = parseInt(process.env.API_TIMEOUT, 10);
  }
  
  if (process.env.API_MAX_RETRIES) {
    config.maxRetries = parseInt(process.env.API_MAX_RETRIES, 10);
  }
  
  if (process.env.API_RETRY_DELAY) {
    config.retryDelay = parseInt(process.env.API_RETRY_DELAY, 10);
  }
  
  return config;
} 