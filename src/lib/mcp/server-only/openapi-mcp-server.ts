// Server-side only MCP server code
// This file should NEVER be imported in browser code

import { browser } from '$app/environment';

// Guard against browser execution
if (browser) {
  throw new Error('MCP server code cannot run in browser environment');
}

// Check if we're in a Node.js environment
if (typeof process === 'undefined' || !process.versions || !process.versions.node) {
  throw new Error('MCP server requires Node.js environment');
}

// Check for required Node.js modules
const requiredModules = ['util', 'os', 'stream', 'crypto', 'buffer', 'process', 'events'];
for (const moduleName of requiredModules) {
  try {
    require(moduleName);
  } catch (error) {
    throw new Error(`Required Node.js module '${moduleName}' is not available`);
  }
}

// Only import Node.js specific modules on server-side
// import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPI } from 'openapi-types';
import { ConsoleMessageLogger, LoggingRestfulPlugin } from '$lib/restful/BuiltInPlugins';
import { McpRequestSettingsPlugin } from '../McpRequestSettingsPlugin';
import type { RequestSettings } from '$lib/types/request-config';
import { defaultLogger } from '$lib/utils/logger';
import type { RestfulPlugin } from '$lib/restful/RestfulPlugin';
import { createTools, executeTool } from '../setup/McpTool';
import { createResources, createResourceTemplates, readResource } from '../setup/McpResrouce';
import type { ResourceInfo, ResourceTemplateInfo, ToolInfo } from '$lib/types/api-config';

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
  // private server: Server;
  private server: any;
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

    // this.server = new Server(
    //   {
    //     name: config.serverName,
    //     version: config.serverVersion,
    //   },
    //   {
    //     capabilities: {
    //       tools: {},
    //       resources: {},
    //     },
    //   }
    // );

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
        defaultLogger.info("ListResourcesRequestSchema:"+this.config.serverName, resources)
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
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
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
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
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

    // const transport = new StdioServerTransport();
    // await this.server.connect(transport);
  }

  getOpenApiDoc(): OpenAPI.Document | null {
    return this.openApiDoc;
  }

  async getAvailableTools(progressCallback?: ProgressCallback) : Promise<ToolInfo[]> {
    if (!this.openApiDoc) {
      return [];
    }

    progressCallback?.('Loading available tools', 'start');

    const tools: ToolInfo[] = await createTools(this.openApiDoc!, this.plugins);
    progressCallback?.('Loading available tools', 'complete');
    return tools;
  }

  async getAvailableResources(progressCallback?: ProgressCallback) : Promise<ResourceInfo[]> {
    if (!this.openApiDoc) {
      return [];
    }

    progressCallback?.('Loading available resources', 'start');

    const resourcesResponse = await createResources(this.openApiDoc!, this.config.serverName);
    return resourcesResponse;
  }

  async getAvailableResourceTemplates(progressCallback?: ProgressCallback) : Promise<ResourceTemplateInfo[]> {
    if (!this.openApiDoc) {
      return [];
    }

    const resourceTemplatesResponse = await createResourceTemplates(this.openApiDoc!, this.config.serverName);
    return resourceTemplatesResponse;
  }
  
  async executeResource(resourceName: string): Promise<any> {
    return readResource(this.openApiDoc!, this.config.serverName, resourceName, this.plugins)
  }

  async executeTool(toolName: string, parameters: any): Promise<any> {
    return executeTool(this.openApiDoc!, this.plugins, toolName, parameters)
  }
}

// Factory function to create and start MCP server
export async function createOpenApiMcpServer(config: OpenApiMcpServerConfig): Promise<OpenApiMcpServer> {
  const server = new OpenApiMcpServer(config);
  await server.loadOpenApiSpec(config.openApiUrl);
  return server;
}
