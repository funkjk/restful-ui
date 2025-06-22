import { writable, get } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';
import type { OpenAPI } from 'openapi-types';
import type { RequestSettings } from '$lib/types/request-config';
import type { SavedMcpConfig, McpServerConfig } from '$lib/mcp/config';
import * as yaml from 'js-yaml';

export interface McpServerState {
  isRunning: boolean;
  openApiUrl: string | null;
  serverName: string;
  serverVersion: string;
  availableTools: ToolInfo[];
  availableResources: ResourceInfo[];
  error: string | null;
  lastStarted: Date | null;
}

export interface ToolInfo {
  name: string;
  description: string;
  method: string;
  path: string;
  parameters?: any;
}

export interface ResourceInfo {
  uri: string;
  name: string;
  description: string;
  method: string;
  path: string;
  parameters?: any;
  mimeType: string;
}

const initialState: McpServerState = {
  isRunning: false,
  openApiUrl: null,
  serverName: 'openapi-mcp-server',
  serverVersion: '1.0.0',
  availableTools: [],
  availableResources: [],
  error: null,
  lastStarted: null,
};

  // MCPサーバの状態ストア
  export const mcpServerState = writable<McpServerState>(initialState);

  // 永続化された設定ストア
export const mcpSettings = persisted('mcp-settings', {
  serverName: 'openapi-mcp-server',
  serverVersion: '1.0.0',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000
});

// MCPサーバの操作関数
export const mcpActions = {
  // OpenAPI仕様書を読み込んでツール一覧を生成
  async loadOpenApiSpec(url: string): Promise<void> {
    try {
      mcpServerState.update(state => ({ 
        ...state, 
        error: null, 
        openApiUrl: url 
      }));

      // OpenAPI仕様書を取得
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
      }
      
      // Content-TypeまたはURLの拡張子でファイル形式を判定
      const contentType = response.headers.get('content-type') || '';
      const isYaml = contentType.includes('yaml') || 
                     contentType.includes('yml') || 
                     url.toLowerCase().endsWith('.yaml') || 
                     url.toLowerCase().endsWith('.yml');
      
      let openApiDoc: OpenAPI.Document;
      
      if (isYaml) {
        // YAML形式の場合
        const text = await response.text();
        openApiDoc = yaml.load(text) as OpenAPI.Document;
      } else {
        // JSON形式の場合（デフォルト）
        openApiDoc = await response.json() as OpenAPI.Document;
      }
      
      // ツール一覧とリソース一覧を生成
      const tools = generateToolsFromOpenApi(openApiDoc);
      const resources = generateResourcesFromOpenApi(openApiDoc);
      
      mcpServerState.update(state => ({
        ...state,
        openApiDoc,
        availableTools: tools,
        availableResources: resources,
        error: null,
      }));
      
    } catch (error) {
      mcpServerState.update(state => ({
        ...state,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        openApiDoc: null,
        availableTools: [],
        availableResources: [],
      }));
      throw error;
    }
  },
  async loadServer(): Promise<McpServerState> {
    const response = await fetch('/api/mcp/init');
    if (!response.ok) {
      throw new Error('Failed to load MCP server');
    }
    return response.json();
  },

  // MCPサーバを開始（HTTP API経由）
  async startServer(config: { 
    openApiUrl: string; 
    serverName?: string; 
    serverVersion?: string; 
    timeout?: number; 
    maxRetries?: number;
    requestSetting?: RequestSettings;
  }): Promise<void> {
    try {
      const response = await fetch('/api/mcp/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start MCP server');
      }

      mcpServerState.update(state => ({
        ...state,
        isRunning: true,
        error: null,
        lastStarted: new Date(),
      }));
    } catch (error) {
      mcpServerState.update(state => ({
        ...state,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isRunning: false,
      }));
      throw error;
    }
  },

  // 設定IDからMCPサーバを開始
  async startServerFromConfig(configId: string): Promise<void> {
    try {
      const response = await fetch('/api/mcp/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start MCP server from config');
      }

      mcpServerState.update(state => ({
        ...state,
        isRunning: true,
        error: null,
        lastStarted: new Date(),
      }));
    } catch (error) {
      mcpServerState.update(state => ({
        ...state,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isRunning: false,
      }));
      throw error;
    }
  },

  // MCPサーバを停止（HTTP API経由）
  async stopServer(): Promise<void> {
    try {
      const response = await fetch('/api/mcp/init', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to stop MCP server');
      }

      mcpServerState.update(state => ({
        ...state,
        isRunning: false,
        lastStarted: null,
      }));
    } catch (error) {
      mcpServerState.update(state => ({
        ...state,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
      throw error;
    }
  },

  // エラーをクリア
  clearError(): void {
    mcpServerState.update(state => ({
      ...state,
      error: null,
    }));
  },

  // 設定を更新
  updateSettings(newSettings: Partial<typeof mcpSettings>): void {
    mcpSettings.update(settings => ({
      ...settings,
      ...newSettings,
    }));
  },

  // 設定を保存
  async saveConfig(openApiUrl: string, requestSettings: RequestSettings,name: string, description?: string, id?: string): Promise<string> {
    try {
      // 現在の設定を取得
      const settings = get(mcpSettings);

      const config: McpServerConfig = {
        openApiUrl,
        serverName: settings.serverName,
        serverVersion: settings.serverVersion,
        timeout: settings.timeout,
        maxRetries: settings.maxRetries,
        retryDelay: settings.retryDelay,
        requestSettings: requestSettings,
      };

      const response = await fetch('/api/mcp/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, config, id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save config');
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Unknown error occurred while saving config'
      );
    }
  },

  // 設定一覧を取得
  async listConfigs(): Promise<SavedMcpConfig[]> {
    try {
      const response = await fetch('/api/mcp/configs');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch configs');
      }

      const result = await response.json();
      return result.configs;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Unknown error occurred while fetching configs'
      );
    }
  },

  // 設定を読み込み
  async loadConfig(id: string): Promise<SavedMcpConfig> {
    try {
      const response = await fetch(`/api/mcp/configs/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load config');
      }

      const result = await response.json();
      return result.config;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Unknown error occurred while loading config'
      );
    }
  },

  // 設定を削除
  async deleteConfig(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/mcp/configs?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete config');
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Unknown error occurred while deleting config'
      );
    }
  },

  // 設定を適用（UI上の設定を更新）
  applyConfig(savedConfig: SavedMcpConfig): void {
    mcpSettings.update(() => ({
      openApiUrl: savedConfig.config.openApiUrl,
      serverName: savedConfig.config.serverName,
      serverVersion: savedConfig.config.serverVersion,
      useProxy: false, // デフォルト値
      timeout: savedConfig.config.timeout || 30000,
      maxRetries: savedConfig.config.maxRetries || 3,
      retryDelay: savedConfig.config.retryDelay || 1000,
      requestSettings: savedConfig.config.requestSettings || {
        headers: [],
        additionalQueryParameter: "",
        basePath: "",
        useProxy: false,
      },
    }));
  },
};

// OpenAPI仕様書からツール一覧を生成する関数（GETメソッド以外）
function generateToolsFromOpenApi(openApiDoc: OpenAPI.Document): ToolInfo[] {
  const tools: ToolInfo[] = [];
  const paths = openApiDoc.paths;

  if (paths) {
    for (const [path, pathItem] of Object.entries(paths)) {
      if (pathItem) {
        // Only include non-GET methods as tools
        const methods = ['post', 'put', 'patch', 'delete'] as const;
        for (const method of methods) {
          const operation = pathItem[method];
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

// OpenAPI仕様書からリソース一覧を生成する関数（GETメソッドのみ）
function generateResourcesFromOpenApi(openApiDoc: OpenAPI.Document): ResourceInfo[] {
  const resources: ResourceInfo[] = [];
  const paths = openApiDoc.paths;

  if (paths) {
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
      }
    }
  }

  return resources;
} 