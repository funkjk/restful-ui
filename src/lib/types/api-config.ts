import type { ResourceInfo, ToolInfo } from "$lib/stores/mcp";
import type { RequestSettings } from "./request-config";

export type ConfiguraionIdObject = {
  configurationId: string;
}
export type McpServerConfig = {
    openApiUrl: string;
    serverName: string;
    serverVersion: string;
    timeout: number;
    maxRetries: number;
    requestSettings: RequestSettings;
}
export type McpServerConfigObject = {
    configurationId: string;
    createdAt: Date;
    updatedAt: Date;
    config: McpServerConfig;
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
export type McpServerInitRequest = ConfiguraionIdObject | McpServerConfig;