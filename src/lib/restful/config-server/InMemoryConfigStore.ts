import type { ConfigStore } from './ConfigStore';
import type { ServerConfigResponse } from './ServerSupport';


let configs: ServerConfigResponse[] = [];

export const InMemoryConfigStore: ConfigStore = {
    writeConfig: writeConfig,
    readConfig: readConfig,
    listConfigs: listConfigs,
    deleteConfig: deleteConfig,
}

async function writeConfig(configurationId:string, config: Partial<ServerConfigResponse>): Promise<ServerConfigResponse> {
    configs.push({
        ...config,
        configurationId: configurationId,
        createdAt: config.createdAt ?? new Date(),
        updatedAt: new Date(),
    } as ServerConfigResponse);
    return configs[configs.length - 1];
  }

  async function readConfig(configurationId: string): Promise<ServerConfigResponse | null> {
    return configs.find(config => config.configurationId === configurationId) ?? null;
  }


async function listConfigs(): Promise<ServerConfigResponse[]> {
    return configs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }


  async function deleteConfig(configurationId: string): Promise<void> {
    if (configs.findIndex(config => config.configurationId === configurationId) < 0) {
      throw new Error(`configurationId ${configurationId} not found`)
    }
    configs = configs.filter(config => config.configurationId !== configurationId);
  }