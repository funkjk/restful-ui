import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { createOpenApiMcpServer } from '$lib/mcp/openapi-mcp-server';
import { createConfig } from '$lib/mcp/config';
import { loadConfig } from '$lib/mcp/config-server';
import { setMcpServer, getMcpServer, getServerConfig, clearMcpServer, isServerInitialized } from '$lib/mcp/server-state';
import type { McpServerState, McpServerInitRequest, McpServerConfig } from '$lib/types/api-config';

export const POST = async ({ request }: RequestEvent) => {
  try {
    const body = await request.json() as McpServerInitRequest;

    let config:McpServerConfig;

    // 設定IDが指定されている場合は保存された設定を読み込み
    if ("configurationId" in body) {
      const configurationId = body.configurationId;
      try {
        const savedConfig = await loadConfig(configurationId);
        config = await createConfig(savedConfig.config);
        console.log(`Loading MCP server from saved config: ${savedConfig.config.serverName} (${body.configurationId})`);
      } catch (error) {
        return json({
          success: false,
          error: `Failed to load saved config: ${error instanceof Error ? error.message : String(error)}`,
        }, { status: 404 });
      }
    } else {
      // 従来の方法：パラメータから設定を作成
      const { openApiUrl, serverName, serverVersion, timeout, maxRetries, requestSettings } = body;

      if (!openApiUrl) {
        return json({
          success: false,
          error: 'OpenAPI URL or config ID is required',
        }, { status: 400 });
      }

      // 設定を作成
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
      // MCPサーバを作成して初期化
      const mcpServer = await createOpenApiMcpServer(config);
      setMcpServer(mcpServer, config);

      // サーバのHTTPモードでは実際の起動は不要
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
  const serverInstance = getMcpServer();
  const serverState: McpServerState = {
    isRunning: isServerInitialized(),
    openApiUrl: getServerConfig()?.openApiUrl ?? "",
    serverName: getServerConfig()?.serverName ?? "",
    serverVersion: getServerConfig()?.serverVersion ?? "",
    availableTools: serverInstance?.getAvailableTools() ?? [],
    availableResources: serverInstance?.getAvailableResources() ?? [],
  }
  return json(serverState);
};

export const DELETE = async () => {
  clearMcpServer();

  return json({
    success: true,
    message: 'MCP server stopped',
  });
}; 