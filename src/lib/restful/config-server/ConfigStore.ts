import { v4 as uuidv4 } from 'uuid';
import type { ServerConfig, ServerConfigResponse } from './ServerSupport';
// import { FsConfigStore } from './FsConfigStore';
import { InMemoryConfigStore } from './InMemoryConfigStore';
import { CockroachDBConfigStore } from './CockroachDBConfigStore';
import { env } from '$env/dynamic/private';



export interface ConfigStore {
    writeConfig(configurationId: string, config: Partial<ServerConfigResponse> & { userId?: string }): Promise<ServerConfigResponse>
    readConfig(configurationId: string, userId?: string): Promise<ServerConfigResponse | null>
    listConfigs(userId?: string): Promise<ServerConfigResponse[]>
    deleteConfig(configurationId: string, userId?: string): Promise<void>
}

// Select ConfigStore implementation based on environment variable
// Default to CockroachDB if DATABASE_URL is set, otherwise use InMemoryConfigStore
const configStore: ConfigStore = env.DATABASE_URL ? CockroachDBConfigStore : InMemoryConfigStore;


export async function saveConfig(
    config: ServerConfig,
    configurationId?: string,
    userId?: string,
): Promise<string> {
    validateConfig(config);
    configurationId = configurationId ?? uuidv4();

    await configStore.writeConfig(configurationId, {
        config,
        userId,
    });
    return configurationId;
}

export async function loadConfig(id: string, userId?: string): Promise<ServerConfigResponse | null> {
    return configStore.readConfig(id, userId);
}


export async function deleteConfig(id: string, userId?: string): Promise<void> {
    await configStore.deleteConfig(id, userId);
}


// 設定を更新
export async function updateConfig(id: string, config: ServerConfig, userId?: string): Promise<void> {
    validateConfig(config);
    const existing = await loadConfig(id, userId);
    if (!existing) {
        throw new Error(`Config ${id} not found`);
    }
    await configStore.writeConfig(id, {
        config,
        userId,
    });
}

export async function listConfigs(userId?: string): Promise<ServerConfigResponse[]> {
    console.log("configStore", configStore);
    const configs = await configStore.listConfigs(userId);
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