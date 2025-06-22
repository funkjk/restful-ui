import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMcpServer, getServerConfig, isServerInitialized } from '$lib/mcp/server-state';

export const POST: RequestHandler = async ({ request, url }) => {
  console.log("POST request received", request, url);
  try {
    const body = await request.json();
    const { method, params, id } = body;

    // MCPサーバが初期化されていない場合はエラー
    if (!isServerInitialized()) {
      return json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32002,
          message: 'MCP server not initialized. Please call /api/mcp/init first.',
        },
      });
    }

    // Initialize request
    if (method === 'initialize') {
      return json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: {
            name: 'openapi-mcp-server',
            version: '1.0.0',
          },
        },
      });
    }

    // List tools request
    if (method === 'tools/list') {
      try {
        const tools = [];
        const serverInstance = getMcpServer();
        const openApiDoc = serverInstance?.getOpenApiDoc();
        
        if (openApiDoc?.paths) {
          for (const [path, pathItem] of Object.entries(openApiDoc.paths)) {
            if (pathItem) {
              // Only include non-GET methods as tools
              const methods = ['post', 'put', 'patch', 'delete'] as const;
              for (const method of methods) {
                const operation = (pathItem as any)[method];
                if (operation) {
                  const toolName = `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
                  tools.push({
                    name: toolName,
                    description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
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
                  });
                }
              }
            }
          }
        }

        return json({
          jsonrpc: '2.0',
          id,
          result: {
            tools,
          },
        });
      } catch (err) {
        return json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: `Failed to list tools: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
    }

    // List resources request
    if (method === 'resources/list') {
      try {
        const resources = [];
        const serverInstance = getMcpServer();
        
        if (serverInstance) {
          const availableResources = serverInstance.getAvailableResources();
          for (const resource of availableResources) {
            resources.push({
              uri: resource.uri,
              name: resource.name,
              description: resource.description,
              mimeType: resource.mimeType,
            });
          }
        }

        return json({
          jsonrpc: '2.0',
          id,
          result: {
            resources,
          },
        });
      } catch (err) {
        return json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: `Failed to list resources: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
    }

    // Read resource request
    if (method === 'resources/read') {
      try {
        const { uri } = params;
        
        if (!uri) {
          return json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'URI parameter is required',
            },
          });
        }

        const serverInstance = getMcpServer();
        if (!serverInstance) {
          throw new Error('MCP server not available');
        }

        // Parse URI to extract resource name
        const match = uri.match(/^openapi:\/\/(.+)$/);
        if (!match) {
          return json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: `Invalid resource URI: ${uri}`,
            },
          });
        }

        const resourceName = match[1];
        const result = await serverInstance.executeResource(resourceName);
        
        return json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        });
      } catch (err) {
        return json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: `Failed to read resource: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
    }

    // List resource templates request
    if (method === 'resources/templates/list') {
      try {
        // OpenAPI servers typically don't need dynamic resource templates
        // Return empty array to indicate no templates are available
        return json({
          jsonrpc: '2.0',
          id,
          result: {
            resourceTemplates: [],
          },
        });
      } catch (err) {
        return json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: `Failed to list resource templates: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
    }

    // Call tool request
    if (method === 'tools/call') {
      try {
        const { name, arguments: args } = params;
        const serverInstance2 = getMcpServer();
        const openApiDoc = serverInstance2?.getOpenApiDoc();
        
        if (!openApiDoc) {
          return json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32603,
              message: 'OpenAPI document not loaded',
            },
          });
        }

        // Parse tool name to extract method and path
        const [method, ...pathParts] = name.split('_');
        
        // Find the actual path in the OpenAPI document
        let actualPath: string | null = null;
        const paths = openApiDoc.paths;
        
        if (paths) {
          for (const p of Object.keys(paths)) {
            if (p.replace(/[^a-zA-Z0-9]/g, '_') === pathParts.join('_')) {
              actualPath = p;
              break;
            }
          }
        }

        if (!actualPath) {
          return json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: `Path not found for tool: ${name}`,
            },
          });
        }

        // Execute the tool using the existing MCP server logic
        const serverInstance3 = getMcpServer();
        if (!serverInstance3) {
          throw new Error('MCP server not available');
        }
        
        const result = await serverInstance3.executeTool(name, args?.parameters || {});
        
        return json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        });
      } catch (err) {
        return json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: `Failed to execute tool: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
      }
    }

    // Unknown method
    return json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    });
  } catch (err) {
    return json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${err instanceof Error ? err.message : String(err)}`,
      },
    });
  }
};

// GET request for status
export const GET: RequestHandler = async ({url}) => {
  console.log("GET request received", url);
  const config = getServerConfig();
  return json({
    status: isServerInitialized() ? 'running' : 'stopped',
    openApiUrl: config?.openApiUrl || null,
    serverInfo: {
      name: 'openapi-mcp-server',
      version: '1.0.0',
    },
  });
}; 