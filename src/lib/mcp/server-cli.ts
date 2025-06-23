#!/usr/bin/env node

import { OpenApiMcpServer } from './openapi-mcp-server.js';
import { createConfig, parseConfigFromArgs, parseConfigFromEnv, validateUrl } from './config.js';
import { defaultLogger } from '$lib/utils/logger.js';

async function main() {
  defaultLogger.info("start MCP server")
  try {
    // Parse configuration from various sources
    const envConfig = parseConfigFromEnv();
    let argsConfig = {};
    
    // Handle simple URL as first argument (backward compatibility)
    if (process.argv[2] && !process.argv[2].startsWith('-')) {
      argsConfig = { openApiUrl: process.argv[2] };
    } else {
      argsConfig = parseConfigFromArgs(process.argv.slice(2));
    }
    
    // Merge configurations (args override env)
    const partialConfig = { ...envConfig, ...argsConfig };
    const config = await createConfig(partialConfig);
    
    if (!config.openApiUrl) {
      console.error('Error: OpenAPI URL is required');
      console.error('');
      console.error('Usage:');
      console.error('  node server.js <openapi-url>');
      console.error('  node server.js --url <openapi-url> [options]');
      console.error('');
      console.error('Options:');
      console.error('  -f, --file <filepath>     Filepath to MCP server config');
      console.error('  -u, --url <url>           OpenAPI specification URL');
      console.error('  -n, --name <name>         MCP server name');
      console.error('  -v, --version <version>   MCP server version');
      console.error('  -b, --base-url <url>      Base URL for API calls');
      console.error('  -t, --timeout <ms>        Request timeout in milliseconds');
      console.error('  -r, --max-retries <num>   Maximum number of retries');
      console.error('  -d, --retry-delay <ms>    Delay between retries in milliseconds');
      console.error('');
      console.error('Environment variables:');
      console.error('  OPENAPI_URL              OpenAPI specification URL');
      console.error('  MCP_SERVER_NAME          MCP server name');
      console.error('  MCP_SERVER_VERSION       MCP server version');
      console.error('  API_BASE_URL             Base URL for API calls');
      console.error('  API_TIMEOUT              Request timeout in milliseconds');
      console.error('  API_MAX_RETRIES          Maximum number of retries');
      console.error('  API_RETRY_DELAY          Delay between retries in milliseconds');
      process.exit(1);
    }
    
    if (!validateUrl(config.openApiUrl)) {
      console.error(`Error: Invalid OpenAPI URL: ${config.openApiUrl}`);
      process.exit(1);
    }
    
    console.error(`Starting MCP server: ${config.serverName} v${config.serverVersion}`);
    console.error(`Loading OpenAPI spec from: ${config.openApiUrl}`);
    
    const server = new OpenApiMcpServer(config);
    await server.loadOpenApiSpec(config.openApiUrl);
    console.error('OpenAPI spec loaded successfully');
    console.error('MCP server is ready');
    await server.start();
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 