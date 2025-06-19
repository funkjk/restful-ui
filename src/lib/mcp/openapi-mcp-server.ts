import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI } from 'openapi-types';
import { createRestfulOperation, type InputRestParameters } from '../restful/RestfulOperation.js';
import { ConsoleLogger, LoggingRestfulPlugin } from '$lib/restful/BuiltInPlugins.js';

export interface OpenApiMcpServerConfig {
  serverName: string;
  serverVersion: string;
  openApiUrl: string;
  baseUrl?: string;
}

export class OpenApiMcpServer {
  private server: Server;
  private openApiDoc: OpenAPI.Document | null = null;
  private config: OpenApiMcpServerConfig;

  constructor(config: OpenApiMcpServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.serverName,
        version: config.serverVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (!this.openApiDoc) {
        throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
      }

      const tools = [];
      const paths = this.openApiDoc.paths;

      if (paths) {
        for (const [path, pathItem] of Object.entries(paths)) {
          if (pathItem) {
            const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
            for (const method of methods) {
              const operation = pathItem[method];
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

      return { tools };
    });

    // Execute tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.openApiDoc) {
        throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
      }

      try {
        // Parse tool name to extract method and path
        const [method, ...pathParts] = name.split('_');
        const path = pathParts.join('_').replace(/_/g, '/');
        
        // Find the actual path in the OpenAPI document
        let actualPath: string | null = null;
        const paths = this.openApiDoc.paths;
        
        if (paths) {
          for (const p of Object.keys(paths)) {
            if (p.replace(/[^a-zA-Z0-9]/g, '_') === pathParts.join('_')) {
              actualPath = p;
              break;
            }
          }
        }

        if (!actualPath) {
          throw new McpError(ErrorCode.InvalidRequest, `Path not found for tool: ${name}`);
        }

        // Create URLSearchParams for RestfulOperation
        const searchParams = new URLSearchParams();
        searchParams.set('path', actualPath);
        searchParams.set('method', method);

        // const pluglins = [
        //   new LoggingRestfulPlugin(new ConsoleLogger()),
        // ]

        // Create RestfulOperation
        const operation = createRestfulOperation(searchParams, this.openApiDoc);

        if (!operation.exist()) {
          throw new McpError(ErrorCode.InvalidRequest, `Operation not found: ${method} ${actualPath}`);
        }

        // Execute the API call
        const parameters = (args as any)?.parameters || {};
        const response = await operation.execute(parameters as InputRestParameters);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                url: response.url,
                status: response.status,
                ok: response.ok,
                headers: response.headers,
                body: response.responseBody,
                bodyType: response.responseBodyType,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async loadOpenApiSpec(url: string): Promise<void> {
    try {
      this.openApiDoc = await SwaggerParser.dereference(url) as OpenAPI.Document;
    } catch (error) {
      throw new Error(`Failed to load OpenAPI spec from ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async start(): Promise<void> {
    if (!this.openApiDoc) {
      await this.loadOpenApiSpec(this.config.openApiUrl);
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  // HTTP API用のメソッド
  getOpenApiDoc(): OpenAPI.Document | null {
    return this.openApiDoc;
  }

  getAvailableTools() {
    if (!this.openApiDoc) {
      return [];
    }

    const tools = [];
    const paths = this.openApiDoc.paths;

    if (paths) {
      for (const [path, pathItem] of Object.entries(paths)) {
        if (pathItem) {
          const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
          for (const method of methods) {
            const operation = (pathItem as any)[method];
            if (operation) {
              const toolName = `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
              tools.push({
                name: toolName,
                description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
                method: method.toUpperCase(),
                path,
                parameters: operation.parameters,
              });
            }
          }
        }
      }
    }

    return tools;
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    if (!this.openApiDoc) {
      throw new Error('OpenAPI document not loaded');
    }

    // Parse tool name to extract method and path
    const [method, ...pathParts] = toolName.split('_');
    
    // Find the actual path in the OpenAPI document
    let actualPath: string | null = null;
    const paths = this.openApiDoc.paths;
    
    if (paths) {
      for (const p of Object.keys(paths)) {
        if (p.replace(/[^a-zA-Z0-9]/g, '_') === pathParts.join('_')) {
          actualPath = p;
          break;
        }
      }
    }

    if (!actualPath) {
      throw new Error(`Path not found for tool: ${toolName}`);
    }

    // Create URLSearchParams for RestfulOperation
    const searchParams = new URLSearchParams();
    searchParams.set('path', actualPath);
    searchParams.set('method', method);

    // Create RestfulOperation
    const operation = createRestfulOperation(searchParams, this.openApiDoc);

    if (!operation.exist()) {
      throw new Error(`Operation not found: ${method} ${actualPath}`);
    }

    // Execute the API call
    const response = await operation.execute(parameters as InputRestParameters);

    return {
      url: response.url,
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      body: response.responseBody,
      bodyType: response.responseBodyType,
    };
  }
}

// Factory function to create and start MCP server
export async function createOpenApiMcpServer(config: OpenApiMcpServerConfig): Promise<OpenApiMcpServer> {
  const server = new OpenApiMcpServer(config);
  await server.loadOpenApiSpec(config.openApiUrl);
  return server;
} 