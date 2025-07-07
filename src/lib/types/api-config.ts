import type { ServerConfig } from "$lib/restful/config-server/ServerSupport";

export type ConfiguraionIdObject = {
  configurationId: string;
}
export type McpServerState = {
    isRunning: boolean;
    openApiUrl: string;
    serverName: string;
    serverVersion: string;
    lastStarted?: Date;
    availableTools: ToolInfo[];
    availableResources: ResourceInfo[];
}
export type OperationResponse = {
    success: boolean;
    message: string;
}
export type McpServerInitRequest = ConfiguraionIdObject | ServerConfig;

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