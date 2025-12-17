// IndexedDB操作をServiceWorker経由で実行
import { ServiceWorkerClient } from './service-worker-client';

class IndexedDBWorker {
    private client: ServiceWorkerClient;

    constructor() {
        this.client = new ServiceWorkerClient();
    }

    async init(): Promise<void> {
        await this.client.init('/service-worker.js');
    }

    private async sendMessage(type: string, key: string, value?: any): Promise<any> {
        if (!this.client.isAvailable()) {
            await this.init();
        }

        // データをJSONシリアライズ（postMessageでクローンできないオブジェクトを回避）
        let serializedValue: string | undefined;
        try {
            serializedValue = value !== undefined ? JSON.stringify(value) : undefined;
        } catch (error) {
            throw new Error(`Failed to serialize value: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        return this.client.sendMessage({ type, key, value: serializedValue });
    }

    async get(key: string): Promise<any> {
        return this.sendMessage('get', key);
    }

    async set(key: string, value: any): Promise<void> {
        return this.sendMessage('set', key, value);
    }

    async delete(key: string): Promise<void> {
        return this.sendMessage('delete', key);
    }
}

export const indexedDBWorker = new IndexedDBWorker();
