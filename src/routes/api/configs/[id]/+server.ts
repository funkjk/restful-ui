import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { deleteConfig, loadConfig, updateConfig } from '$lib/restful/config-server/ConfigStore';
import type { ServerConfig } from '$lib/restful/config-server/ServerSupport';
import { requireAuth, getUserId } from '$lib/auth/middleware';
import { defaultLogger as logger } from '$lib/utils/logger';

// 特定の設定を読み込み
export const GET = async (event: RequestEvent) => {
  try {
    const { id } = event.params;
    if (!id) {
      return json({
        success: false,
        error: 'Config ID is required',
      }, { status: 400 });
    }

    // Get userId if authenticated for data isolation (FR-008)
    // event.locals.auth is set by withClerkHandler in hooks.server.ts
    const userId = getUserId(event);
    const config = await loadConfig(id, userId ?? undefined);
    
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

export const DELETE = async (event: RequestEvent) => {
  try {
    // Require authentication for DELETE (FR-001, FR-005)
    // event.locals.auth is set by withClerkHandler in hooks.server.ts
    const userId = requireAuth(event);
    
    const { id } = event.params;
    await deleteConfig(id!, userId);
    
    logger.info('Configuration deleted', { configurationId: id, userId });
    
    return json({
      success: true,
    });
  } catch (error) {
    // Handle authentication errors
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      return json({
        success: false,
        error: 'Unauthorized: Authentication required',
      }, { status: 401 });
    }
    
    console.error('Failed to delete config:', error);
    return json({
      success: false,
      error: `Failed to delete config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: error instanceof Error && error.message.includes('ENOENT') ? 404 : 500 });
  }
}

export const PUT = async (event: RequestEvent) => {
  try {
    // Require authentication for PUT (FR-001, FR-005)
    // event.locals.auth is set by withClerkHandler in hooks.server.ts
    const userId = requireAuth(event);
    
    const { id } = event.params;
    const config = await event.request.json() as ServerConfig;
    await updateConfig(id!, config, userId);
    
    logger.info('Configuration updated', { configurationId: id, userId, serverName: config.serverName });
    
    return json({
      success: true,
    });
  } catch (error) {
    // Handle authentication errors
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      return json({
        success: false,
        error: 'Unauthorized: Authentication required',
      }, { status: 401 });
    }
    
    console.error('Failed to update config:', error);
    return json({
      success: false,
      error: `Failed to update config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}   
