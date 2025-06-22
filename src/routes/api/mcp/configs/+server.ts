import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { listConfigs, saveConfig } from '$lib/mcp/config-server';
import type { McpServerConfig } from '$lib/types/api-config';

// 設定一覧を取得
export const GET = async () => {
  try {
    const configs = await listConfigs();
    return json(configs);
  } catch (error) {
    console.error('Failed to list configs:', error);
    return json({
      success: false,
      error: `Failed to list configs: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
};

// 設定を保存
export const POST = async ({ request }: RequestEvent) => {
  try {
    console.log("POST", request)
    const config = await request.json() as McpServerConfig;
    console.log("config", config)

    if (!config.openApiUrl) {
      return json({
        success: false,
        error: 'OpenAPI URL is required in config',
      }, { status: 400 });
    }

    const configId = await saveConfig(config);

    return json({
      configurationId: configId,
    });
  } catch (error) {
    console.error('Failed to save config:', error);
    return json({
      success: false,
      error: `Failed to save config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
};

