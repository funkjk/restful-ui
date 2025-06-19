import { writable } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';
import type { OpenAPI } from 'openapi-types';

export interface McpServerState {
  isRunning: boolean;
  openApiUrl: string | null;
  serverName: string;
  serverVersion: string;
  openApiDoc: OpenAPI.Document | null;
  availableTools: ToolInfo[];
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

const initialState: McpServerState = {
  isRunning: false,
  openApiUrl: null,
  serverName: 'openapi-mcp-server',
  serverVersion: '1.0.0',
  openApiDoc: null,
  availableTools: [],
  error: null,
  lastStarted: null,
};

// MCPサーバの状態ストア
export const mcpServerState = writable<McpServerState>(initialState);

// 永続化された設定ストア
export const mcpSettings = persisted('mcp-settings', {
  openApiUrl: '',
  serverName: 'openapi-mcp-server',
  serverVersion: '1.0.0',
  useProxy: false,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
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
      
      const openApiDoc = await response.json() as OpenAPI.Document;
      
      // ツール一覧を生成
      const tools = generateToolsFromOpenApi(openApiDoc);
      
      mcpServerState.update(state => ({
        ...state,
        openApiDoc,
        availableTools: tools,
        error: null,
      }));
      
    } catch (error) {
      mcpServerState.update(state => ({
        ...state,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        openApiDoc: null,
        availableTools: [],
      }));
      throw error;
    }
  },

  // MCPサーバを開始（HTTP API経由）
  async startServer(config: { openApiUrl: string; serverName?: string; serverVersion?: string; timeout?: number; maxRetries?: number }): Promise<void> {
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
};

// OpenAPI仕様書からツール一覧を生成する関数
function generateToolsFromOpenApi(openApiDoc: OpenAPI.Document): ToolInfo[] {
  const tools: ToolInfo[] = [];
  const paths = openApiDoc.paths;

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