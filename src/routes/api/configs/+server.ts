import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { listConfigs, saveConfig } from '$lib/restful/config-server/ConfigStore';
import type { ServerConfig } from '$lib/restful/config-server/ServerSupport';
import { requireAuth, getUserId } from '$lib/auth/middleware';
import { defaultLogger as logger } from '$lib/utils/logger';

// 設定一覧を取得
export const GET = async (event: RequestEvent) => {
  try {
    // Debug: Check if event.locals.auth is set
    console.log('GET /api/configs - event.locals.auth:', event.locals?.auth);
    console.log('GET /api/configs - cookies:', event.cookies.getAll());
    
    // Get userId if authenticated, otherwise return empty list (FR-016)
    // event.locals.auth is set by withClerkHandler in hooks.server.ts
    const userId = getUserId(event);
    console.log('GET /api/configs - userId:', userId);
    const configs = await listConfigs(userId ?? undefined);
    const filter = event.url.searchParams.get("filter")
    if (filter) {
      return json(configs.filter((config) => config.config.serverName.includes(filter)));
    } else {
      return json(configs);
    }
  } catch (error) {
    console.error('Failed to list configs:', error);
    return json({
      success: false,
      error: `Failed to list configs: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
};

// save config
export const POST = async (event: RequestEvent) => {
  try {
    // Debug: Check if event.locals.auth is set
    console.log('POST /api/configs - event.locals.auth:', event.locals?.auth);
    console.log('POST /api/configs - cookies:', event.cookies.getAll());
    
    // Require authentication for POST (FR-001, FR-005)
    // event.locals.auth is set by withClerkHandler in hooks.server.ts
    const userId = requireAuth(event);
    console.log('POST /api/configs - userId:', userId);
    
    const config = await event.request.json() as ServerConfig;

    if (!config.openApiUrl) {
      return json({
        success: false,
        error: 'OpenAPI URL is required in config',
      }, { status: 400 });
    }

    const configId = await saveConfig(config, undefined, userId);

    logger.info('Configuration saved', { configurationId: configId, userId, serverName: config.serverName });

    return json({
      configurationId: configId,
    });
  } catch (error) {
    // Handle authentication errors
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      return json({
        success: false,
        error: 'Unauthorized: Authentication required',
      }, { status: 401 });
    }
    
    console.error('Failed to save config:', error);
    return json({
      success: false,
      error: `Failed to save config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
};

