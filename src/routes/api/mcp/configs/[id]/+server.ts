import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { deleteConfig, loadConfig, updateConfig } from '$lib/mcp/config-server';
import type { McpServerConfig } from '$lib/types/api-config';

// 特定の設定を読み込み
export const GET = async ({ params }: RequestEvent) => {
  try {
    const { id } = params;
    if (!id) {
      return json({
        success: false,
        error: 'Config ID is required',
      }, { status: 400 });
    }

    const config = await loadConfig(id);
    if (!config) {
      return json({
        success: false,
        error: 'Config not found',
      }, { status: 404 });
    }

    return json(config);
  } catch (error) {
    console.error('Failed to load config:', error);
    return json({
      success: false,
      error: `Failed to load config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: error instanceof Error && error.message.includes('ENOENT') ? 404 : 500 });
  }
}; 

export const DELETE = async ({ params }: RequestEvent) => {
  try {
    const { id } = params;
    await deleteConfig(id!);
    return json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete config:', error);
    return json({
      success: false,
      error: `Failed to delete config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: error instanceof Error && error.message.includes('ENOENT') ? 404 : 500 });
  }
}

export const PUT = async ({ params, request }: RequestEvent) => {
  try {
    const { id } = params;
    const config = await request.json() as McpServerConfig;
    await updateConfig(id!, config);
    return json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to update config:', error);
    return json({
      success: false,
      error: `Failed to update config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}   
