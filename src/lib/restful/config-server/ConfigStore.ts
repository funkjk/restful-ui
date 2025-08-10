import { v4 as uuidv4 } from 'uuid';
import type { ServerConfig, ServerConfigResponse } from './ServerSupport';
import { FsConfigStore } from './FsConfigStore';



export interface ConfigStore {
    writeConfig(configurationId: string, config: Partial<ServerConfigResponse>): Promise<ServerConfigResponse>
    readConfig(configurationId: string): Promise<ServerConfigResponse | null>
    listConfigs(): Promise<ServerConfigResponse[]>
    deleteConfig(configurationId: string): Promise<void>
}
const configStore: ConfigStore = FsConfigStore;


export async function saveConfig(
    config: ServerConfig,
    configurationId?: string,
): Promise<string> {
    validateConfig(config);
    configurationId = configurationId ?? uuidv4();

    await configStore.writeConfig(configurationId, {
        config,
    });
    return configurationId;
}

export async function loadConfig(id: string): Promise<ServerConfigResponse | null> {
    return configStore.readConfig(id);
}


export async function deleteConfig(id: string): Promise<void> {
    await configStore.deleteConfig(id);
}


// 設定を削除
export async function updateConfig(id: string, config: ServerConfig): Promise<void> {
    validateConfig(config);
    const existing = await loadConfig(id);
    if (!existing) {
        throw new Error(`Config ${id} not found`);
    }
    await configStore.writeConfig(id, {
        config,
    });
}

export async function listConfigs(): Promise<ServerConfigResponse[]> {
    const configs = await configStore.listConfigs();
    return configs;
}


function validateConfig(config: ServerConfig): void {
    if (!config.openApiUrl) {
        throw new Error('OpenAPI URL is required in config');
    }
    if (!config.serverName) {
        throw new Error('Server name is required in config');
    }
    if (!config.serverVersion) {
        throw new Error('Server version is required in config');
    }
    if (!config.timeout) {
        throw new Error('Timeout is required in config');
    }
    if (!config.maxRetries) {
        throw new Error('Max retries is required in config');
    }
}