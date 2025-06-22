import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { listConfigs, saveConfig, deleteConfig, type SavedMcpConfig } from '$lib/mcp/config-server';

// 設定一覧を取得
export const GET = async () => {
  try {
    const configs = await listConfigs();
    return json({
      success: true,
      configs,
    });
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
    const { name, description, config, id } = await request.json();

    if (!name || !config) {
      return json({
        success: false,
        error: 'Name and config are required',
      }, { status: 400 });
    }

    if (!config.openApiUrl) {
      return json({
        success: false,
        error: 'OpenAPI URL is required in config',
      }, { status: 400 });
    }

    const configId = await saveConfig(config, name, description, id);

    return json({
      success: true,
      id: configId,
      message: id ? 'Config updated successfully' : 'Config saved successfully',
    });
  } catch (error) {
    console.error('Failed to save config:', error);
    return json({
      success: false,
      error: `Failed to save config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
};

// 設定を削除
export const DELETE = async ({ url }: RequestEvent) => {
  try {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return json({
        success: false,
        error: 'Config ID is required',
      }, { status: 400 });
    }

    await deleteConfig(id);

    return json({
      success: true,
      message: 'Config deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete config:', error);
    return json({
      success: false,
      error: `Failed to delete config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}; 