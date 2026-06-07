import type { ServerConfig } from "$lib/restful/config-server/ServerSupport";
import type { RequestSetting } from "$lib/restful/BuiltInPlugins";
import type { LinkMapping } from "$lib/types/link-mapping";

export interface SaveConfigRequest {
    openApiUrl: string;
    serverName: string;
    serverVersion: string;
    timeout: number;
    maxRetries: number;
    requestSettings: RequestSetting;
    linkMappings?: LinkMapping[];
}

export interface SaveConfigResponse {
    configurationId: string;
}

export class ConfigService {
    /**
     * サーバー設定を保存する
     * @param request 保存する設定情報
     * @returns 保存結果
     */
    static async saveConfig(request: SaveConfigRequest): Promise<SaveConfigResponse> {
        const serverConfig: ServerConfig = {
            openApiUrl: request.openApiUrl,
            serverName: request.serverName,
            serverVersion: request.serverVersion,
            timeout: request.timeout,
            maxRetries: request.maxRetries,
            requestSettings: request.requestSettings,
            linkMappings: request.linkMappings,
        };

        const response = await fetch("/api/configs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(serverConfig),
        });

        if (!response.ok) {
            throw new Error(`Failed to save config: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data as SaveConfigResponse;
    }

    /**
     * 設定IDからURLを生成する
     * @param configurationId 設定ID
     * @returns 設定ページのURL
     */
    static createConfigUrl(configurationId: string): string {
        return `/cid/${configurationId}`;
    }
} 