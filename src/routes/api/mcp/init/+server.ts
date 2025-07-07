import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createOpenApiMcpServer } from '$lib/mcp/openapi-mcp-server';
import { createConfig } from '$lib/mcp/config';
import { setMcpServer, getMcpServer, getServerConfig, clearMcpServer, isServerInitialized } from '$lib/mcp/server-state';
import type { McpServerState, McpServerInitRequest } from '$lib/types/api-config';
import type { ServerConfig } from '$lib/restful/config-server/ServerSupport';
import { loadConfig } from '$lib/restful/config-server/ConfigStore';

export const POST = async ({ request }: RequestEvent) => {
  try {
    let body: McpServerInitRequest;
    if (request.headers.get("Content-Type") === "application/x-www-form-urlencoded") {
      const formData = await request.formData();
      body = Object.fromEntries(formData) as McpServerInitRequest;
    } else {
      body = await request.json() as McpServerInitRequest;
    }

    let config:ServerConfig;

    // if configurationId is specified, load the saved config
    if ("configurationId" in body) {
      const configurationId = body.configurationId;
      try {
        const savedConfig = await loadConfig(configurationId);
        if (!savedConfig) {
          return json({
            success: false,
            error: `Config ${configurationId} not found`,
          }, { status: 404 });
        }
        config = await createConfig(savedConfig.config);
        console.log(`Loading MCP server from saved config: ${savedConfig.config.serverName} (${body.configurationId})`);
      } catch (error) {
        return json({
          success: false,
          error: `Failed to load saved config: ${error instanceof Error ? error.message : String(error)}`,
        }, { status: 404 });
      }
    } else {
      const { openApiUrl, serverName, serverVersion, timeout, maxRetries, requestSettings } = body;

      if (!openApiUrl) {
        return json({
          success: false,
          error: 'OpenAPI URL or config ID is required',
        }, { status: 400 });
      }

      config = await createConfig({
        openApiUrl,
        serverName: serverName || 'openapi-mcp-server',
        serverVersion: serverVersion || '1.0.0',
        timeout: timeout || 30000,
        maxRetries: maxRetries || 3,
        requestSettings: requestSettings,
      });
    }

    try {
      // create MCP server and initialize
      const mcpServer = await createOpenApiMcpServer(config);
      setMcpServer("default", mcpServer, config);

      // in HTTP mode, actual startup is not required
      console.log('MCP server initialized via HTTP');

      return json({
        success: true,
        message: 'MCP server initialized successfully',
        config: {
          openApiUrl: config.openApiUrl,
          serverName: config.serverName,
          serverVersion: config.serverVersion,
        }
      });
    } catch (error) {
      console.error('Failed to initialize MCP server:', error);
      return json({
        success: false,
        error: `Failed to initialize MCP server: ${error instanceof Error ? error.message : String(error)}`,
      }, { status: 500 });
    }
  } catch (error) {
    return json({
      success: false,
      error: `Invalid request: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 400 });
  }
};

export const GET = async () => {
  const serverInstance = getMcpServer("default");
  const serverState: McpServerState = {
    isRunning: isServerInitialized("default"),
    openApiUrl: getServerConfig("default")?.openApiUrl ?? "",
    serverName: getServerConfig("default")?.serverName ?? "",
    serverVersion: getServerConfig("default")?.serverVersion ?? "",
    availableTools: serverInstance?.getAvailableTools() ?? [],
    availableResources: serverInstance?.getAvailableResources() ?? [],
  }
  return json(serverState);
};

export const DELETE = async () => {
  clearMcpServer("default");

  return json({
    success: true,
    message: 'MCP server stopped',
  });
}; 