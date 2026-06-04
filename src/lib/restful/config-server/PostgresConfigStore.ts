import type { ConfigStore } from './ConfigStore';
import type { ServerConfigResponse } from './ServerSupport';
import { getPool } from '$lib/db/postgres';

export const PostgresConfigStore: ConfigStore = {
    writeConfig,
    readConfig,
    listConfigs,
    deleteConfig,
};

async function writeConfig(
    configurationId: string,
    config: Partial<ServerConfigResponse> & { userId?: string },
): Promise<ServerConfigResponse> {
    const pool = getPool();
    const { config: serverConfig, userId } = config;

    if (!serverConfig) {
        throw new Error('ServerConfig is required');
    }

    if (!userId) {
        throw new Error('userId is required');
    }

    const now = new Date();

    const existing = await pool.query(
        'SELECT configuration_id FROM configurations WHERE configuration_id = $1 AND user_id = $2',
        [configurationId, userId],
    );

    if (existing.rows.length > 0) {
        const result = await pool.query(
            `UPDATE configurations 
             SET config = $1, updated_at = $2
             WHERE configuration_id = $3 AND user_id = $4
             RETURNING configuration_id, user_id, config, created_at, updated_at`,
            [JSON.stringify(serverConfig), now, configurationId, userId],
        );

        if (result.rows.length === 0) {
            throw new Error(`Configuration ${configurationId} not found or access denied`);
        }

        const row = result.rows[0];
        return {
            configurationId: row.configuration_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            config: row.config,
        };
    } else {
        const result = await pool.query(
            `INSERT INTO configurations (configuration_id, user_id, config, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING configuration_id, user_id, config, created_at, updated_at`,
            [configurationId, userId, JSON.stringify(serverConfig), now, now],
        );

        const row = result.rows[0];
        return {
            configurationId: row.configuration_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            config: row.config,
        };
    }
}

async function readConfig(configurationId: string, userId?: string): Promise<ServerConfigResponse | null> {
    const pool = getPool();

    let query: string;
    let params: unknown[];

    if (userId) {
        query = 'SELECT configuration_id, user_id, config, created_at, updated_at FROM configurations WHERE configuration_id = $1 AND user_id = $2';
        params = [configurationId, userId];
    } else {
        query = 'SELECT configuration_id, user_id, config, created_at, updated_at FROM configurations WHERE configuration_id = $1';
        params = [configurationId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    const parsedConfig = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
    return {
        configurationId: row.configuration_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        config: parsedConfig,
    };
}

async function listConfigs(userId?: string): Promise<ServerConfigResponse[]> {
    const pool = getPool();

    let query: string;
    let params: unknown[];

    if (userId) {
        query = 'SELECT configuration_id, user_id, config, created_at, updated_at FROM configurations WHERE user_id = $1 ORDER BY updated_at DESC';
        params = [userId];
    } else {
        query = 'SELECT configuration_id, user_id, config, created_at, updated_at FROM configurations ORDER BY updated_at DESC';
        params = [];
    }

    const result = await pool.query(query, params);

    return result.rows.map((row) => {
        const parsedConfig = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
        return {
            configurationId: row.configuration_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            config: parsedConfig,
        };
    });
}

async function deleteConfig(configurationId: string, userId?: string): Promise<void> {
    const pool = getPool();

    let query: string;
    let params: unknown[];

    if (userId) {
        query = 'DELETE FROM configurations WHERE configuration_id = $1 AND user_id = $2';
        params = [configurationId, userId];
    } else {
        query = 'DELETE FROM configurations WHERE configuration_id = $1';
        params = [configurationId];
    }

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
        throw new Error(`Configuration ${configurationId} not found`);
    }
}
