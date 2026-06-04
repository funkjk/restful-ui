import type { ConfigStore } from './ConfigStore';
import type { ServerConfigResponse } from './ServerSupport';


let configs: ServerConfigResponse[] = [];

export const InMemoryConfigStore: ConfigStore = {
    writeConfig: writeConfig,
    readConfig: readConfig,
    listConfigs: listConfigs,
    deleteConfig: deleteConfig,
}

async function writeConfig(configurationId:string, config: Partial<ServerConfigResponse> & { userId?: string }): Promise<ServerConfigResponse> {
    const existingIndex = configs.findIndex(c => c.configurationId === configurationId);
    const existing = existingIndex >= 0 ? configs[existingIndex] : null;
    const newConfig: ServerConfigResponse = {
        ...config,
        configurationId: configurationId,
        createdAt: existing?.createdAt ?? config.createdAt ?? new Date(),
        updatedAt: new Date(),
    } as ServerConfigResponse;
    
    if (existingIndex >= 0) {
        // Update existing config
        configs[existingIndex] = newConfig;
    } else {
        // Add new config
        configs.push(newConfig);
    }
    return newConfig;
  }

  async function readConfig(configurationId: string, userId?: string): Promise<ServerConfigResponse | null> {
    // InMemoryConfigStore ignores userId for backward compatibility
    return configs.find(config => config.configurationId === configurationId) ?? null;
  }


async function listConfigs(userId?: string): Promise<ServerConfigResponse[]> {
    // InMemoryConfigStore ignores userId for backward compatibility
    return configs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }


  async function deleteConfig(configurationId: string, userId?: string): Promise<void> {
    // InMemoryConfigStore ignores userId for backward compatibility
    if (configs.findIndex(config => config.configurationId === configurationId) < 0) {
      throw new Error(`configurationId ${configurationId} not found`)
    }
    configs = configs.filter(config => config.configurationId !== configurationId);
  }