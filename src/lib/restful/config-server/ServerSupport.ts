import type { RequestSettings } from "$lib/types/request-config";

export type ServerConfig = {
    openApiUrl: string;
    useProxy?: boolean;
    serverName: string;
    serverVersion: string;
    timeout: number;
    maxRetries: number;
    requestSettings: RequestSettings;
}
export type ServerConfigResponse = {
    configurationId: string;
    createdAt: Date;
    updatedAt: Date;
    config: ServerConfig;
}