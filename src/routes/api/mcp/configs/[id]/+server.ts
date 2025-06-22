import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { loadConfig } from '$lib/mcp/config-server';

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

    return json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Failed to load config:', error);
    return json({
      success: false,
      error: `Failed to load config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: error instanceof Error && error.message.includes('ENOENT') ? 404 : 500 });
  }
}; 