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
import { z } from "zod";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI } from 'openapi-types';
import { createRestfulOperation, OperationParameter, RequestBodyType, type InputRestParameters } from '../restful/RestfulOperation';
import { ConsoleMessageLogger, LoggingRestfulPlugin } from '$lib/restful/BuiltInPlugins';
import { createMcpRequestPlugins } from '../restful/McpRequestSettingsPlugin';
import { writable, get, type Writable } from 'svelte/store';
import type { RequestSettings } from '$lib/types/request-config';
import { defaultLogger } from '$lib/utils/logger';
// @ts-ignore
import UriTemplate from 'uri-template-lite';
import { URLSearchParams } from 'url';

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
  private requestSettingsStore: Writable<RequestSettings>;

  constructor(config: OpenApiMcpServerConfig) {
    this.config = config;

    // Initialize request settings store
    const defaultSettings: RequestSettings = {
      headers: [],
      additionalQueryParameter: "",
      basePath: "",
      useProxy: false,
    };
    this.requestSettingsStore = writable(config.requestSettings || defaultSettings);
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

  private createPlugins() {
    const loggingPlugin = new LoggingRestfulPlugin(new ConsoleMessageLogger());
    const [mcpRequestPlugin, mcpProxyPlugin] = createMcpRequestPlugins(this.requestSettingsStore);

    return [
      loggingPlugin,
      mcpRequestPlugin,
      mcpProxyPlugin,
    ];
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (!this.openApiDoc) {
        throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
      }

      const tools = [];
      const paths = this.openApiDoc.paths;
      try {
        

      if (paths) {
        for (const [path, pathItem] of Object.entries(paths)) {
          if (pathItem) {
            const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
            for (const method of methods) {
              const operation = pathItem[method];
              if (operation) {
                // Create URLSearchParams for RestfulOperation
                const searchParams = new OperationParameter(path, method, []);
                const currentOperation = createRestfulOperation(searchParams, this.openApiDoc, this.createPlugins());

                let bodyParamName = currentOperation.getBodyValueName();
                let operation = currentOperation.getOperation();

                let params = currentOperation.getOperation().parameters ?? [] as any[];
                const inputParameters = {} as any
                for (const param of params) {
                  const paramName = param.name;
                  let schema = {
                    type: "string",
                  } as any
                  inputParameters[paramName] = schema
                }
                if (bodyParamName && currentOperation.getBodyTypes().length > 0) {
                  const bodyType = currentOperation.getBodyTypes()[0]
                  const bodyDifinition = currentOperation.getBodyDefinition(bodyType)
                  if (bodyType == RequestBodyType.JSON) {
                    inputParameters[bodyParamName] = {
                      type: "object",
                      additionalProperties: true
                    }
                  } else if (bodyType === RequestBodyType.FORM_DATA && bodyDifinition && bodyDifinition.properties) {
                    for (const [name, property] of Object.entries(bodyDifinition.properties)) {
                      inputParameters[name] = {
                        type: property.type ?? "string",
                        description: property.description,
                        enum: property.enum,
                        default: property.default,
                      }
                    }
                  } else {
                    defaultLogger.warn("illegal body type", {bodyType, bodyDifinition})
                  }
                }

                const toolName = `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
                tools.push({
                  name: toolName,
                  description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
                  inputSchema: {
                    type: 'object',
                    properties: inputParameters,
                  },
                });
              }
            }
          }
        }
      }
      } catch (error) {
        defaultLogger.error("Error in ListToolsRequestSchema", error)
        throw new McpError(ErrorCode.InternalError, 'Error in ListToolsRequestSchema');
      }

      return { tools };
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      if (!this.openApiDoc) {
        throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
      }

      const resources = [];
      const paths = this.openApiDoc.paths;


      if (paths) {
        for (const [path, pathItem] of Object.entries(paths)) {
          if (pathItem && pathItem.get) {
            if (path.includes("{") || path.includes("}")) {
              continue;
            }
            const operation = pathItem.get;
            const resourceName = `get_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;

            resources.push({
              uri: `openapi://${this.config.serverName}${path}`,
              name: resourceName,
              description: operation.summary || operation.description || `GET ${path}`,
              mimeType: 'application/json',
            });
          }
        }
      }

      return { resources };
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      defaultLogger.info("ReadResourceRequestSchema" + JSON.stringify(request.params))
      const { uri } = request.params;

      if (!this.openApiDoc) {
        throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
      }

      // Parse URI to extract resource name
      const match = uri.match(/^openapi:\/(.+)$/);
      if (!match) {
        throw new McpError(ErrorCode.InvalidRequest, `Invalid resource URI: ${uri}`);
      }

      let resourceName = match[1].replace(`${this.config.serverName}/`, "");
      defaultLogger.info("resourceName", resourceName)
      let queryString = ""
      if (resourceName.includes("?")) {
        const [path, query] = resourceName.split("?");
        resourceName = path
        queryString = query
      }


      const paths = this.openApiDoc.paths ?? {};
      // Find the actual path in the OpenAPI document
      let actualPath: string | null = null;
      let additionalQueryParameter = {} as any
      for (const [path] of Object.entries(paths)) {
        // @ts-ignore // there are no latest types for uri-template-lite
        const template = new UriTemplate(path)
        const match = template.match(resourceName)
        if (match) {
          actualPath = path
          additionalQueryParameter = match
          break
        }
      }

      if (!actualPath) {
        throw new McpError(ErrorCode.InvalidRequest, `Path not found for resource: ${resourceName}`);
      }

      // Create URLSearchParams for RestfulOperation

      const searchParams = new URLSearchParams(queryString)
      searchParams.set("path", actualPath)
      searchParams.set("method", "get")

      const plugins = this.createPlugins();

      // Create RestfulOperation
      const operation = createRestfulOperation(searchParams, this.openApiDoc, plugins);

      if (!operation.exist()) {
        throw new McpError(ErrorCode.InvalidRequest, `Operation not found: GET ${actualPath}`);
      }

      try {
        // Execute the API call with empty parameters for GET requests
        const response = await operation.execute(additionalQueryParameter);

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
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
          `Failed to read resource ${resourceName}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // List resource templates
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {

      const resourceTemplates = [];
      if (!this.openApiDoc) {
        throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
      }

      const paths = this.openApiDoc.paths;
      if (paths) {
        for (const [path, pathItem] of Object.entries(paths)) {
          if (pathItem && pathItem.get) {
            if (!path.includes("{") && !path.includes("}")) {
              continue;
            }
            const operation = pathItem.get;
            const resourceName = `get_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
            resourceTemplates.push({
              uriTemplate: `openapi://${this.config.serverName}${path}`,
              name: resourceName,
              description: operation.summary || operation.description || `GET ${path}`,
              mimeType: 'application/json',
            });
          }
        }
      }

      // return { resourceTemplates };
      return { resourceTemplates };
    });

    // Execute tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args, } = request.params;

      defaultLogger.info(`CallToolRequestSchema ${name} args` + JSON.stringify(request.params))

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
        const searchParams = new OperationParameter(actualPath, method, []);

        const plugins = this.createPlugins();

        // Create RestfulOperation
        const operation = createRestfulOperation(searchParams, this.openApiDoc, plugins);

        if (!operation.exist()) {
          throw new McpError(ErrorCode.InvalidRequest, `Operation not found: ${method} ${actualPath}`);
        }

        // Execute the API call
        const paramArguments = request.params.arguments as any;
        if (paramArguments.requestBody && typeof paramArguments.requestBody === "object") {
          paramArguments.requestBody = JSON.stringify(paramArguments.requestBody);
        }
        const response = await operation.execute(paramArguments as InputRestParameters);

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
        defaultLogger.error(`Failed to execute tool ${name}: ${error instanceof Error ? error.message : String(error)}`, error)
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
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

  // Request settings management
  getRequestSettings(): RequestSettings {
    return get(this.requestSettingsStore);
  }

  updateRequestSettings(settings: RequestSettings): void {
    this.requestSettingsStore.set(settings);
  }

  getRequestSettingsStore(): Writable<RequestSettings> {
    return this.requestSettingsStore;
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

  getAvailableResources(progressCallback?: ProgressCallback) {
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
    if (!this.openApiDoc) {
      throw new Error('OpenAPI document not loaded');
    }

    // Parse resource name to extract method and path
    const [method, ...pathParts] = resourceName.split('_');

    if (method !== 'get') {
      throw new Error(`Resource must be a GET operation: ${resourceName}`);
    }

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
      throw new Error(`Path not found for resource: ${resourceName}`);
    }

    // Create URLSearchParams for RestfulOperation
    const searchParams = new URLSearchParams();
    searchParams.set('path', actualPath);
    searchParams.set('method', 'get');

    const plugins = this.createPlugins();

    // Create RestfulOperation
    const operation = createRestfulOperation(searchParams, this.openApiDoc, plugins);

    if (!operation.exist()) {
      throw new Error(`Operation not found: GET ${actualPath}`);
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

  async executeTool(toolName: string, parameters: any): Promise<any> {
    defaultLogger.info("executeTool", toolName, parameters)
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

    const plugins = this.createPlugins();

    // Create RestfulOperation
    const operation = createRestfulOperation(searchParams, this.openApiDoc, plugins);

    if (!operation.exist()) {
      throw new Error(`Operation not found: ${method} ${actualPath}`);
    }

    defaultLogger.info("executeTool", parameters)

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

  async executeToolWithProgress(toolName: string, parameters: any, eventSender?: SseEventSender): Promise<any> {
    if (!this.openApiDoc) {
      const error = 'OpenAPI document not loaded';
      eventSender?.sendError(-32603, error);
      throw new Error(error);
    }

    try {
      eventSender?.sendProgress(`Starting execution of tool: ${toolName}`, 'start');

      // Parse tool name to extract method and path
      const [method, ...pathParts] = toolName.split('_');
      eventSender?.sendProgress(`Parsing tool name: ${toolName}`, 'parse');

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
        const error = `Path not found for tool: ${toolName}`;
        eventSender?.sendError(-32602, error);
        throw new Error(error);
      }

      eventSender?.sendProgress(`Found API path: ${method.toUpperCase()} ${actualPath}`, 'validate');

      // Create URLSearchParams for RestfulOperation
      const searchParams = new URLSearchParams();
      searchParams.set('path', actualPath);
      searchParams.set('method', method);

      const plugins = this.createPlugins();

      // Create RestfulOperation
      const operation = createRestfulOperation(searchParams, this.openApiDoc, plugins);

      if (!operation.exist()) {
        const error = `Operation not found: ${method} ${actualPath}`;
        eventSender?.sendError(-32602, error);
        throw new Error(error);
      }

      eventSender?.sendProgress(`Preparing API request parameters`, 'prepare');

      // Execute the API call
      eventSender?.sendProgress(`Executing API call: ${method.toUpperCase()} ${actualPath}`, 'execute');
      const response = await operation.execute(parameters as InputRestParameters);

      eventSender?.sendProgress(`API call completed successfully`, 'success');

      const result = {
        url: response.url,
        status: response.status,
        ok: response.ok,
        headers: response.headers,
        body: response.responseBody,
        bodyType: response.responseBodyType,
      };

      eventSender?.sendResult({
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      });

      eventSender?.sendProgress(`Tool execution completed`, 'complete');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      eventSender?.sendError(-32603, `Failed to execute tool ${toolName}: ${errorMessage}`);
      throw error;
    }
  }
}

// Factory function to create and start MCP server
export async function createOpenApiMcpServer(config: OpenApiMcpServerConfig): Promise<OpenApiMcpServer> {
  const server = new OpenApiMcpServer(config);
  await server.loadOpenApiSpec(config.openApiUrl);
  return server;
} 