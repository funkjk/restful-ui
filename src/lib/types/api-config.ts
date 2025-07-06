import type { ServerConfig } from "$lib/restful/serverSupport";
import type { ResourceInfo, ToolInfo } from "$lib/stores/mcp";
import type { RequestSettings } from "./request-config";

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