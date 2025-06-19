import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOpenApiMcpServer } from '$lib/mcp/openapi-mcp-server';
import { createConfig } from '$lib/mcp/config';
import { setMcpServer, getMcpServer, getServerConfig, clearMcpServer, isServerInitialized } from '$lib/mcp/server-state';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { openApiUrl, serverName, serverVersion, timeout, maxRetries } = await request.json();

    if (!openApiUrl) {
      return json({
        success: false,
        error: 'OpenAPI URL is required',
      }, { status: 400 });
    }

    // 設定を作成
    const config = createConfig({
      openApiUrl,
      serverName: serverName || 'openapi-mcp-server',
      serverVersion: serverVersion || '1.0.0',
      timeout: timeout || 30000,
      maxRetries: maxRetries || 3,
    });

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
        },
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

export const GET: RequestHandler = async () => {
  return json({
    isInitialized: isServerInitialized(),
    config: getServerConfig(),
  });
};

export const DELETE: RequestHandler = async () => {
  clearMcpServer();
  
  return json({
    success: true,
    message: 'MCP server stopped',
  });
}; 