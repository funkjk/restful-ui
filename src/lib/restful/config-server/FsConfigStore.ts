// import { writeFile, readFile, readdir, unlink, mkdir } from 'fs/promises';
import type { ConfigStore } from './ConfigStore';
import type { ServerConfigResponse } from './ServerSupport';



// 設定保存用ディレクトリ
const CONFIG_DIR = join(process.cwd(), 'mcp-configs');

export const FsConfigStore: ConfigStore = {
    writeConfig: writeConfig,
    readConfig: readConfig,
    listConfigs: listConfigs,
    deleteConfig: deleteConfig,
}

function join(path: string, plusPath: string): string {
    return path + "/" + plusPath;
  }

async function writeConfig(configurationId:string, config: Partial<ServerConfigResponse>): Promise<ServerConfigResponse> {
    return null as any;
    // const configPath = join(CONFIG_DIR, `${configurationId}.json`);
  
    // // ディレクトリが存在しない場合は作成
    // try {
    //   await mkdir(CONFIG_DIR, { recursive: true });
    // } catch (error) {
    //   // ディレクトリが既に存在する場合は無視
    // }
    // const savedConfig = {
    //   ...config,
    //   configurationId: configurationId,
    //   createdAt: config.createdAt ?? new Date(),
    //   updatedAt: new Date(),
    // } as ServerConfigResponse;
  
    // await writeFile(configPath, JSON.stringify(savedConfig, null, 2));
    // return savedConfig;
  }

  async function readConfig(configurationId: string): Promise<ServerConfigResponse | null> {
    return null;
    // const configPath = join(CONFIG_DIR, `${configurationId}.json`);
    // try {
    //   const data = await readFile(configPath, 'utf8');
    //   const config = JSON.parse(data) as ServerConfigResponse;
    //   config.updatedAt = config.updatedAt ? new Date(config.updatedAt) : new Date();
    //   config.createdAt = config.createdAt ? new Date(config.createdAt) : new Date();
    //   return config;
    // } catch (error) {
    //   return null;
    // }
  }


async function listConfigs(): Promise<ServerConfigResponse[]> {
  return [];
    // try {
    //   const files = await readdir(CONFIG_DIR);
    //   const configs: ServerConfigResponse[] = [];
  
    //   for (const file of files) {
    //     if (file.endsWith('.json')) {
    //       try {
    //         const id = file.replace('.json', '');
    //         const config = await readConfig(id);
    //         configs.push(config!);
    //       } catch (error) {
    //         console.warn(`Failed to load config ${file}:`, error);
    //       }
    //     }
    //   }
  
    //   return configs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    // } catch(e) {
    //     console.error("Failed to list configs", e)
    //   return [];
    // }
  }

  async function deleteConfig(configurationId: string): Promise<void> {
    // const configPath = join(CONFIG_DIR, `${configurationId}.json`);
    // await unlink(configPath);
  }