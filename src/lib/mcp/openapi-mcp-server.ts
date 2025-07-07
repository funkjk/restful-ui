import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI } from 'openapi-types';
import { ConsoleMessageLogger, LoggingRestfulPlugin } from '$lib/restful/BuiltInPlugins';
import { McpRequestSettingsPlugin } from './McpRequestSettingsPlugin';
import type { RequestSettings } from '$lib/types/request-config';
import { defaultLogger } from '$lib/utils/logger';
import type { RestfulPlugin } from '$lib/restful/RestfulPlugin';
import { createTools, executeTool } from './setup/McpTool';
import { createResources, createResourceTemplates, readResource } from './setup/McpResrouce';
import type { ResourceInfo } from '$lib/types/api-config';

export interface OpenApiMcpServerConfig {
  serverName: string;
  serverVersion: string;
  openApiUrl: string;
  baseUrl?: string;
  requestSettings?: RequestSettings;
}

export interface ProgressCallback {
  (message: string, step?: string): void;
}

export interface SseEventSender {
  sendProgress: ProgressCallback;
  sendResult: (result: any) => void;
  sendError: (errorCode: number, errorMessage: string) => void;
}

export class OpenApiMcpServer {
  private server: Server;
  private openApiDoc: OpenAPI.Document | null = null;
  private config: OpenApiMcpServerConfig;
  private plugins: RestfulPlugin[] = [];

  constructor(config: OpenApiMcpServerConfig) {
    this.config = config;

    // Initialize request settings store
    const defaultSettings: RequestSettings = {
      headers: [],
      additionalQueryParameter: "",
      basePath: "",
      useProxy: false,
    };
    const requestSettings = config.requestSettings || defaultSettings;
    this.plugins = [
      new LoggingRestfulPlugin(new ConsoleMessageLogger()),
      new McpRequestSettingsPlugin(requestSettings),
    ];

    this.server = new Server(
      {
        name: config.serverName,
        version: config.serverVersion,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }


  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const tools = await createTools(this.openApiDoc!, this.plugins);
        return { tools };
      } catch (error) {
        defaultLogger.error("Failed to create tools", error)
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, 'Failed to create tools');
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const resources = await createResources(this.openApiDoc!, this.config.serverName);
        return { resources };
      } catch (error) {
        defaultLogger.error("Failed to create resources", error)
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, 'Failed to create resources');
      }
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        const resource = await readResource(this.openApiDoc!, this.config.serverName, request.params.uri, this.plugins);
        return { resource };
      } catch (error) {
        defaultLogger.error("Failed to read resource", error)
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, 'Failed to read resource');
      }
    });

    // List resource templates
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
      try {
        const resourceTemplates = await createResourceTemplates(this.openApiDoc!, this.config.serverName);
        return { resourceTemplates };
      } catch (error) {
        defaultLogger.error("Failed to create resource templates", error)
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, 'Failed to create resource templates');
      }
    });

    // Execute tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args, } = request.params;
      try {
        const result = await executeTool(this.openApiDoc!, this.plugins, name, args);
        return { result };
      } catch (error) {
        defaultLogger.error("Failed to execute tool", error)
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, 'Failed to execute tool');
      }
    });
  }

  async loadOpenApiSpec(url: string): Promise<void> {
    try {
      const parser = new SwaggerParser()
      this.openApiDoc = await parser.dereference(url) as OpenAPI.Document;
    } catch (error) {
      throw new Error(`Failed to load OpenAPI spec from ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async start(): Promise<void> {
    defaultLogger.info("start MCP server", this.config)
    if (!this.openApiDoc) {
      await this.loadOpenApiSpec(this.config.openApiUrl);
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  getOpenApiDoc(): OpenAPI.Document | null {
    return this.openApiDoc;
  }


  getAvailableTools(progressCallback?: ProgressCallback) {
    if (!this.openApiDoc) {
      return [];
    }

    progressCallback?.('Loading available tools', 'start');

    const tools = [];
    const paths = this.openApiDoc.paths;

    if (paths) {
      let toolCount = 0;
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
              toolCount++;

              // 進捗を報告
              if (toolCount % 10 === 0) {
                progressCallback?.(`Loaded ${toolCount} tools`);
              }
            }
          }
        }
      }
      progressCallback?.(`Loaded ${toolCount} tools total`, 'complete');
    }

    return tools;
  }

  getAvailableResources(progressCallback?: ProgressCallback) : ResourceInfo[] {
    if (!this.openApiDoc) {
      return [];
    }

    progressCallback?.('Loading available resources', 'start');

    const resources = [];
    const paths = this.openApiDoc.paths;

    if (paths) {
      let resourceCount = 0;
      for (const [path, pathItem] of Object.entries(paths)) {
        if (pathItem && pathItem.get) {
          const operation = pathItem.get;
          const resourceName = `get_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
          resources.push({
            uri: `openapi://${resourceName}`,
            name: resourceName,
            description: operation.summary || operation.description || `GET ${path}`,
            method: 'GET',
            path,
            parameters: operation.parameters,
            mimeType: 'application/json',
          });
          resourceCount++;

          // 進捗を報告
          if (resourceCount % 10 === 0) {
            progressCallback?.(`Loaded ${resourceCount} resources`);
          }
        }
      }
      progressCallback?.(`Loaded ${resourceCount} resources total`, 'complete');
    }

    return resources;
  }

  async executeResource(resourceName: string, parameters: any = {}): Promise<any> {
    return readResource(this.openApiDoc!, resourceName, parameters, this.plugins)
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    return executeTool(this.openApiDoc!, this.plugins, toolName, parameters)
  }

  // async executeToolWithProgress(toolName: string, parameters: any, eventSender?: SseEventSender): Promise<any> {
  //   if (!this.openApiDoc) {
  //     const error = 'OpenAPI document not loaded';
  //     eventSender?.sendError(-32603, error);
  //     throw new Error(error);
  //   }

  //   try {
  //     eventSender?.sendProgress(`Starting execution of tool: ${toolName}`, 'start');

  //     // Parse tool name to extract method and path
  //     const [method, ...pathParts] = toolName.split('_');
  //     eventSender?.sendProgress(`Parsing tool name: ${toolName}`, 'parse');

  //     // Find the actual path in the OpenAPI document
  //     let actualPath: string | null = null;
  //     const paths = this.openApiDoc.paths;

  //     if (paths) {
  //       for (const p of Object.keys(paths)) {
  //         if (p.replace(/[^a-zA-Z0-9]/g, '_') === pathParts.join('_')) {
  //           actualPath = p;
  //           break;
  //         }
  //       }
  //     }

  //     if (!actualPath) {
  //       const error = `Path not found for tool: ${toolName}`;
  //       eventSender?.sendError(-32602, error);
  //       throw new Error(error);
  //     }

  //     eventSender?.sendProgress(`Found API path: ${method.toUpperCase()} ${actualPath}`, 'validate');

  //     // Create URLSearchParams for RestfulOperation
  //     const searchParams = new URLSearchParams();
  //     searchParams.set('path', actualPath);
  //     searchParams.set('method', method);

  //     const plugins = this.createPlugins();

  //     // Create RestfulOperation
  //     const operation = createRestfulOperation(searchParams, this.openApiDoc, plugins);

  //     if (!operation.exist()) {
  //       const error = `Operation not found: ${method} ${actualPath}`;
  //       eventSender?.sendError(-32602, error);
  //       throw new Error(error);
  //     }

  //     eventSender?.sendProgress(`Preparing API request parameters`, 'prepare');

  //     // Execute the API call
  //     eventSender?.sendProgress(`Executing API call: ${method.toUpperCase()} ${actualPath}`, 'execute');
  //     const response = await operation.execute(parameters as InputRestParameters);

  //     eventSender?.sendProgress(`API call completed successfully`, 'success');

  //     const result = {
  //       url: response.url,
  //       status: response.status,
  //       ok: response.ok,
  //       headers: response.headers,
  //       body: response.responseBody,
  //       bodyType: response.responseBodyType,
  //     };

  //     eventSender?.sendResult({
  //       content: [
  //         {
  //           type: 'text',
  //           text: JSON.stringify(result, null, 2),
  //         },
  //       ],
  //     });

  //     eventSender?.sendProgress(`Tool execution completed`, 'complete');
  //     return result;
  //   } catch (error) {
  //     const errorMessage = error instanceof Error ? error.message : String(error);
  //     eventSender?.sendError(-32603, `Failed to execute tool ${toolName}: ${errorMessage}`);
  //     throw error;
  //   }
  // }
}

// Factory function to create and start MCP server
export async function createOpenApiMcpServer(config: OpenApiMcpServerConfig): Promise<OpenApiMcpServer> {
  const server = new OpenApiMcpServer(config);
  await server.loadOpenApiSpec(config.openApiUrl);
  return server;
} 