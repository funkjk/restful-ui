import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { listConfigs, saveConfig } from '$lib/restful/config-server/ConfigStore';
import type { ServerConfig } from '$lib/restful/config-server/ServerSupport';
import {  getUserId } from '$lib/auth/middleware';

export const GET = async (event: RequestEvent) => {
  try {
    
    const userId = getUserId(event);
    console.log('GET /api/configs - userId:', userId);
    const configs = await listConfigs(userId ?? undefined);
    return json(configs.map((config) => ({
      id: config.configurationId,
      name: config.config.serverName,
    })));
  } catch (error) {
    console.error('Failed to list configs:', error);
    return json({
      success: false,
      error: `Failed to list configs: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
};
