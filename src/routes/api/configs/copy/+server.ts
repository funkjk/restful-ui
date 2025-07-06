import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { loadConfig, saveConfig } from '$lib/mcp/config-server';
import { v4 as uuidv4 } from 'uuid';

// copy config
export const POST = async ({ request }: RequestEvent) => {
  try {
    console.log("POST", request)
    const body = await request.formData()
    const copyFromConfigurationId = body.get("configurationId") as string;
    const newName = body.get("newName") as string;
    const config = await loadConfig(copyFromConfigurationId)
    if (!config) {
      return json({
        success: false,
        error: `Config ${copyFromConfigurationId} not found`,
      }, { status: 404 });
    }
    if (newName) {
      config.config.serverName = newName;
    }
    const configurationId = uuidv4();
    await saveConfig(config.config, configurationId);
    return json({
      configurationId,
    });
  } catch (error) {
    console.error('Failed to save config:', error);
    return json({
      success: false,
      error: `Failed to save config: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
};
