import { writable, get } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';
import type { RequestSettings } from '$lib/types/request-config';
import type { McpServerState, McpServerConfig, McpServerConfigObject } from '$lib/types/api-config';

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
export type McpServerClientState = McpServerState & {
  error: string | null;
}

const initialState: McpServerClientState = {
  isRunning: false,
  openApiUrl: "",
  serverName: 'openapi-mcp-server',
  serverVersion: '1.0.0',
  availableTools: [],
  availableResources: [],
  error: null,
};

  // MCPサーバの状態ストア
  export const mcpServerState = writable<McpServerClientState>(initialState);

  // 永続化された設定ストア
export const mcpSettings = persisted('mcp-settings', {
  serverName: 'openapi-mcp-server',
  serverVersion: '1.0.0',
  timeout: 30000,
  maxRetries: 3,
});

// MCPサーバの操作関数
export const mcpActions = {
  async loadServer(): Promise<McpServerState> {
    const response = await fetch('/api/mcp/init');
    if (!response.ok) {
      throw new Error('Failed to load MCP server');
    }
    const state = await response.json() as McpServerState;
    mcpServerState.set({
      ...state,
      error: null,
    });
    return state;
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
      await mcpActions.loadServer();
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
  async startServerFromConfig(configurationId: string): Promise<void> {
    try {
      const response = await fetch('/api/mcp/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configurationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start MCP server from config');
      }
      await mcpActions.loadServer();
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
  async listConfigs(): Promise<McpServerConfigObject[]> {
    try {
      const response = await fetch('/api/mcp/configs');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch configs');
      }

      const result = await response.json();
      return result as McpServerConfigObject[];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Unknown error occurred while fetching configs'
      );
    }
  },

  // 設定を読み込み
  async loadConfig(id: string): Promise<McpServerConfig> {
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
      const response = await fetch(`/api/mcp/configs/${id}`, {
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
  applyConfig(savedConfig: McpServerConfig): void {
    mcpSettings.set(savedConfig)
  },
};
