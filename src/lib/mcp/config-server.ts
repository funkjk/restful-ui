import type { RequestSettings } from '$lib/types/request-config';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, readFile, readdir, stat, unlink, mkdir } from 'fs/promises';
// import { join } from 'path';

export interface McpServerConfig {
  serverName: string;
  serverVersion: string;
  openApiUrl: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  requestSettings?: RequestSettings;
}

export interface SavedMcpConfig {
  id: string;
  name: string;
  description?: string;
  config: McpServerConfig;
  createdAt: Date;
  updatedAt: Date;
}

function join(path: string, plusPath: string): string {
  return path + "/" + plusPath;
}

// 設定保存用ディレクトリ
const CONFIG_DIR = join(process.cwd(), 'mcp-configs'); // join(process.cwd(), 'mcp-configs');

// 設定を保存
export async function saveConfig(
  config: McpServerConfig,
  name: string,
  description?: string,
  id?: string
): Promise<string> {
  const configId = id || uuidv4();
  const savedConfig: SavedMcpConfig = {
    id: configId,
    name,
    description,
    config,
    createdAt: id ? new Date() : new Date(), // 新規作成時は現在時刻
    updatedAt: new Date(),
  };

  // 既存の設定を更新する場合は、作成日時を保持
  if (id) {
    try {
      const existing = await loadConfig(id);
      savedConfig.createdAt = existing.createdAt;
    } catch {
      // 存在しない場合は新規作成扱い
    }
  }

  const configPath = join(CONFIG_DIR, `${configId}.json`);

  // ディレクトリが存在しない場合は作成
  try {
    await mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    // ディレクトリが既に存在する場合は無視
  }

  await writeFile(configPath, JSON.stringify(savedConfig, null, 2));
  return configId;
}

// 設定を読み込み
export async function loadConfig(id: string): Promise<SavedMcpConfig> {
  const configPath = join(CONFIG_DIR, `${id}.json`);
  const data = await readFile(configPath, 'utf-8');
  const parsed = JSON.parse(data);

  // 日付を復元
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
  };
}

// 設定一覧を取得
export async function listConfigs(): Promise<SavedMcpConfig[]> {
  try {
    const files = await readdir(CONFIG_DIR);
    const configs: SavedMcpConfig[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const id = file.replace('.json', '');
          const config = await loadConfig(id);
          configs.push(config);
        } catch (error) {
          console.warn(`Failed to load config ${file}:`, error);
        }
      }
    }

    // 更新日時でソート（新しいものから）
    return configs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch {
    return [];
  }
}

// 設定を削除
export async function deleteConfig(id: string): Promise<void> {
  const configPath = join(CONFIG_DIR, `${id}.json`);
  await unlink(configPath);
} 