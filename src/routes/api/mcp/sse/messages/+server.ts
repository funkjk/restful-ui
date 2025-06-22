import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isServerInitialized, getMcpServer } from '$lib/mcp/server-state';
import { sendEventToConnection } from '../events/+server';

export const POST: RequestHandler = async ({ request }) => {
  console.log("POST request received", request);
  // MCPサーバが初期化されていない場合はエラー
  if (!isServerInitialized()) {
    return json({
      error: {
        code: -32002,
        message: 'MCP server not initialized. Please call /api/mcp/init first.',
      }
    }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { method, params, id, connectionId } = body;

    if (!connectionId) {
      return json({
        error: {
          code: -32602,
          message: 'connectionId is required for SSE messages',
        }
      }, { status: 400 });
    }

    const sendEvent = (event: any) => {
      sendEventToConnection(connectionId, {
        ...event,
        id,
        connectionId,
        timestamp: new Date().toISOString()
      });
    };

    const sendError = (errorCode: number, errorMessage: string) => {
      sendEvent({
        jsonrpc: '2.0',
        error: {
          code: errorCode,
          message: errorMessage,
        },
        type: 'error'
      });
    };

    const sendResult = (result: any) => {
      sendEvent({
        jsonrpc: '2.0',
        result,
        type: 'result'
      });
    };

    const sendProgress = (message: string, step?: string) => {
      sendEvent({
        type: 'progress',
        message,
        step
      });
    };

    // 処理開始の通知
    sendProgress('Processing request', 'start');

    // Initialize request
    if (method === 'initialize') {
      sendProgress('Initializing MCP connection');
      const result = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'openapi-mcp-server-sse',
          version: '1.0.0',
        },
      };
      sendResult(result);
      sendProgress('MCP connection initialized', 'complete');
      
      return json({ success: true, message: 'Initialize request processed' });
    }

    // List tools request
    if (method === 'tools/list') {
      const serverInstance = getMcpServer();
      if (!serverInstance) {
        sendError(-32603, 'MCP server not available');
        return json({ success: false, error: 'MCP server not available' }, { status: 500 });
      }
      
      const tools = serverInstance.getAvailableTools(sendProgress);
      
      // Convert to MCP tool format
      const mcpTools = tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object',
          properties: {
            parameters: {
              type: 'object',
              description: 'Parameters for the API call',
              additionalProperties: true,
            },
          },
        },
      }));

      sendResult({ tools: mcpTools });
      sendProgress('Tools list completed', 'complete');
      
      return json({ success: true, message: 'Tools list request processed', toolCount: mcpTools.length });
    }

    // List resource templates request
    if (method === 'resources/templates/list') {
      sendProgress('Loading resource templates');
      
      // OpenAPI servers typically don't need dynamic resource templates
      // Return empty array to indicate no templates are available
      sendResult({ resourceTemplates: [] });
      sendProgress('Resource templates list completed', 'complete');
      
      return json({ success: true, message: 'Resource templates list request processed', templateCount: 0 });
    }

    // Call tool request
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      sendProgress(`Preparing to execute tool: ${name}`, 'prepare');

      const serverInstance = getMcpServer();
      
      if (!serverInstance) {
        sendError(-32603, 'MCP server not available');
        return json({ success: false, error: 'MCP server not available' }, { status: 500 });
      }

      // Create event sender for progress reporting
      const eventSender = {
        sendProgress,
        sendResult,
        sendError
      };
      
      try {
        await serverInstance.executeToolWithProgress(name, args?.parameters || {}, eventSender);
        return json({ success: true, message: 'Tool execution completed', toolName: name });
      } catch (error) {
        // Error already sent by executeToolWithProgress
        return json({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error),
          toolName: name 
        }, { status: 500 });
      }
    }

    // Unknown method
    sendError(-32601, `Method not found: ${method}`);
    return json({ success: false, error: `Method not found: ${method}` }, { status: 400 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return json({
      error: {
        code: -32700,
        message: `Parse error: ${errorMessage}`,
      }
    }, { status: 400 });
  }
};

// GET request for endpoint information
export const GET: RequestHandler = async () => {
  console.log("GET request received");
  return json({
    endpoint: '/api/mcp/sse/messages',
    description: 'Send MCP messages via SSE',
    methods: ['POST'],
    requiredFields: ['method', 'connectionId'],
    optionalFields: ['params', 'id'],
    usage: {
      note: 'First establish SSE connection to /api/mcp/sse/events, then send messages here',
      example: {
        method: 'tools/list',
        connectionId: 'your-connection-id',
        id: 1
      }
    }
  });
}; 