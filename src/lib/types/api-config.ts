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

export type ResourceInfo = {
    name: string;
    description: string;
    type: string;
    properties: Record<string, any>;
}
export type ToolInfo = {
    name: string;
    description: string;
}