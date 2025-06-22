import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isServerInitialized, getMcpServer } from '$lib/mcp/server-state';

export const GET: RequestHandler = async ({url}) => {
  console.log("GET request received", url);
  return json({
    message: 'MCP SSE Server',
    endpoints: {
      events: '/api/mcp/sse/events',
      messages: '/api/mcp/sse/messages',
      oneshot: '/api/mcp/sse (POST)'
    },
    description: {
      events: 'Establish long-lived SSE connection for receiving events',
      messages: 'Send MCP messages to be processed and receive results via SSE',
      oneshot: 'Send single MCP request and receive response as SSE stream (connection closes after response)'
    },
    usage: {
      persistent: 'Connect to /events, then send messages to /messages with connectionId',
      oneshot: 'POST directly to /api/mcp/sse for single request-response'
    }
  });
};

export const POST: RequestHandler = async ({ request }) => {
  console.log("POST request received", request);
  // MCPサーバが初期化されていない場合はエラー
  if (!isServerInitialized()) {
    throw error(503, 'MCP server not initialized. Please call /api/mcp/init first.');
  }

  try {
    const body = await request.json();
    const { method, params, id } = body;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendData = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        const sendError = (errorCode: number, errorMessage: string) => {
          sendData({
            jsonrpc: '2.0',
            id,
            error: {
              code: errorCode,
              message: errorMessage,
            },
            type: 'error',
            timestamp: new Date().toISOString()
          });
        };

        const sendResult = (result: any) => {
          sendData({
            jsonrpc: '2.0',
            id,
            result,
            type: 'result',
            timestamp: new Date().toISOString()
          });
        };

        const sendProgress = (message: string, step?: string) => {
          sendData({
            type: 'progress',
            id,
            message,
            step,
            timestamp: new Date().toISOString()
          });
        };

        try {
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
            controller.close();
            return;
          }

          // List tools request
          if (method === 'tools/list') {
            const serverInstance = getMcpServer();
            if (!serverInstance) {
              sendError(-32603, 'MCP server not available');
              controller.close();
              return;
            }
            
            const tools = serverInstance.getAvailableTools(sendProgress);
            
            // Convert to MCP tool format
            const mcpTools = tools.map((tool: any) => ({
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
            controller.close();
            return;
          }

          // List resource templates request
          if (method === 'resources/templates/list') {
            sendProgress('Loading resource templates');
            
            // OpenAPI servers typically don't need dynamic resource templates
            // Return empty array to indicate no templates are available
            sendResult({ resourceTemplates: [] });
            sendProgress('Resource templates list completed', 'complete');
            controller.close();
            return;
          }

          // Call tool request
          if (method === 'tools/call') {
            const { name, arguments: args } = params;
            sendProgress(`Preparing to execute tool: ${name}`, 'prepare');

            const serverInstance = getMcpServer();
            
            if (!serverInstance) {
              sendError(-32603, 'MCP server not available');
              controller.close();
              return;
            }

            // Create event sender for progress reporting
            const eventSender = {
              sendProgress,
              sendResult,
              sendError
            };
            
            try {
              await serverInstance.executeToolWithProgress(name, args?.parameters || {}, eventSender);
              controller.close();
            } catch (error) {
              // Error already sent by executeToolWithProgress
              controller.close();
            }
            return;
          }

          // Unknown method
          sendError(-32601, `Method not found: ${method}`);
          controller.close();

        } catch (err) {
          sendError(
            -32603,
            `Internal error: ${err instanceof Error ? err.message : String(err)}`
          );
          controller.close();
        }
      },

      cancel() {
        // Clean up if needed
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (err) {
    throw error(400, `Parse error: ${err instanceof Error ? err.message : String(err)}`);
  }
}; 