import { KV_REST_API_URL, KV_REST_API_TOKEN } from '$env/static/private';
import { Redis } from '@upstash/redis';
import type { ConfigStore } from './ConfigStore';
import type { ServerConfigResponse } from './ServerSupport';

const KEY_PREFIX = 'restful-ui:config:';
const INDEX_KEY = 'restful-ui:config:ids';

let redis: Redis | undefined;

function getRedis(): Redis {
	if (!redis) {
		redis = new Redis({
			url: KV_REST_API_URL,
			token: KV_REST_API_TOKEN,
		});
	}
	return redis;
}

function configKey(configurationId: string): string {
	return `${KEY_PREFIX}${configurationId}`;
}

function parseConfigResponse(raw: unknown): ServerConfigResponse | null {
	if (!raw || typeof raw !== 'object') {
		return null;
	}
	const config = raw as ServerConfigResponse;
	return {
		...config,
		createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
		updatedAt: config.updatedAt ? new Date(config.updatedAt) : new Date(),
	};
}

export function createUpstashConfigStore(client?: Redis): ConfigStore {
	const redisClient = client ?? getRedis();
	return {
		async writeConfig(
			configurationId: string,
			config: Partial<ServerConfigResponse>,
		): Promise<ServerConfigResponse> {
			const savedConfig = {
				...config,
				configurationId,
				createdAt: config.createdAt ?? new Date(),
				updatedAt: new Date(),
			} as ServerConfigResponse;

			const pipeline = redisClient.pipeline();
			pipeline.set(configKey(configurationId), savedConfig);
			pipeline.sadd(INDEX_KEY, configurationId);
			await pipeline.exec();

			return savedConfig;
		},

		async readConfig(configurationId: string): Promise<ServerConfigResponse | null> {
			const raw = await redisClient.get<ServerConfigResponse>(configKey(configurationId));
			return parseConfigResponse(raw);
		},

		async listConfigs(): Promise<ServerConfigResponse[]> {
			const ids = await redisClient.smembers<string[]>(INDEX_KEY);
			if (!ids?.length) {
				return [];
			}

			const keys = ids.map(configKey);
			const values = await redisClient.mget<ServerConfigResponse[]>(...keys);
			const configs: ServerConfigResponse[] = [];

			for (let i = 0; i < ids.length; i++) {
				const parsed = parseConfigResponse(values[i]);
				if (parsed) {
					configs.push(parsed);
				}
			}

			return configs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
		},

		async deleteConfig(configurationId: string): Promise<void> {
			const pipeline = redisClient.pipeline();
			pipeline.del(configKey(configurationId));
			pipeline.srem(INDEX_KEY, configurationId);
			await pipeline.exec();
		},
	};
}
