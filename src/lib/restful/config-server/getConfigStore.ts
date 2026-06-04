import { STORE_TYPE } from '$env/static/private';
import { PostgresConfigStore } from './PostgresConfigStore';
import type { ConfigStore } from './ConfigStore';
import { FsConfigStore } from './FsConfigStore';
import { InMemoryConfigStore } from './InMemoryConfigStore';
import { createUpstashConfigStore } from './UpstashConfigStore';

export type ConfigStoreType = 'fs' | 'upstash' | 'postgres' | 'inmemory';

let injectedStore: ConfigStore | null = null;
let cachedDefaultStore: ConfigStore | null = null;

export function resolveStoreType(): ConfigStoreType {
	const normalized = STORE_TYPE.trim().toLowerCase();
	if (normalized === 'upstash') {
		return 'upstash';
	}
	if (normalized === 'postgres') {
		return 'postgres';
	}
	if (normalized === 'fs') {
		return 'fs';
	}
	return 'inmemory';
}

/** Build a store from type (tests, hooks, custom wiring). */
export function createConfigStore(type: ConfigStoreType = resolveStoreType()): ConfigStore {
	if (type === 'upstash') {
		return createUpstashConfigStore();
	}
	if (type === 'postgres') {
		return PostgresConfigStore;
	}
	if (type === 'fs') {
		return FsConfigStore;
	}
	return InMemoryConfigStore;
}

/** Override the store used by getConfigStore() (e.g. tests, app bootstrap). */
export function setConfigStore(store: ConfigStore): void {
	cachedDefaultStore = store;
}

/** Clear injection and env-based cache; next getConfigStore() resolves from STORE_TYPE again. */
export function resetConfigStore(): void {
	injectedStore = null;
	cachedDefaultStore = null;
}

/** Server-only: injected store, else STORE_TYPE=fs | upstash */
export function getConfigStore(): ConfigStore {
	if (injectedStore) {
		return injectedStore;
	}
	if (!cachedDefaultStore) {
		cachedDefaultStore = createConfigStore();
	}
	return cachedDefaultStore;
}
