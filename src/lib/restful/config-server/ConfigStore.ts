import { v4 as uuidv4 } from 'uuid';
import type { ServerConfig, ServerConfigResponse } from './ServerSupport';
import { InMemoryConfigStore } from './InMemoryConfigStore';
import { getConfigStore } from './getConfigStore';

export interface ConfigStore {
    writeConfig(configurationId: string, config: Partial<ServerConfigResponse> & { userId?: string }): Promise<ServerConfigResponse>
    readConfig(configurationId: string, userId?: string): Promise<ServerConfigResponse | null>
    listConfigs(userId?: string): Promise<ServerConfigResponse[]>
    deleteConfig(configurationId: string, userId?: string): Promise<void>
}

let configStore: ConfigStore | null = null;

async function getResolvedConfigStore(): Promise<ConfigStore> {
    if (configStore) {
        return configStore;
    }
    if (process.env.E2E_TEST === 'true') {
        configStore = InMemoryConfigStore;
    } else {
        configStore = getConfigStore();
    }
    return configStore;
}

export async function saveConfig(
    config: ServerConfig,
    configurationId?: string,
    userId?: string,
): Promise<string> {
    validateConfig(config);
    configurationId = configurationId ?? uuidv4();

    await (await getResolvedConfigStore()).writeConfig(configurationId, {
        config,
        userId,
    });
    return configurationId;
}

export async function loadConfig(id: string, userId?: string): Promise<ServerConfigResponse | null> {
    return (await getResolvedConfigStore()).readConfig(id, userId);
}

export async function deleteConfig(id: string, userId?: string): Promise<void> {
    await (await getResolvedConfigStore()).deleteConfig(id, userId);
}

export async function updateConfig(id: string, config: ServerConfig, userId?: string): Promise<void> {
    validateConfig(config);
    const existing = await loadConfig(id, userId);
    if (!existing) {
        throw new Error(`Config ${id} not found`);
    }
    await (await getResolvedConfigStore()).writeConfig(id, {
        config,
        userId,
    });
}

export async function listConfigs(userId?: string): Promise<ServerConfigResponse[]> {
    return (await getResolvedConfigStore()).listConfigs(userId);
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
