// ServiceWorkerの登録初期化専用
// ServiceWorkerに依存する初期化処理（IndexedDBWorkerの初期化）も実施
import { ServiceWorkerClient } from './service-worker-client';
import { indexedDBWorker } from './indexeddb-worker';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * ServiceWorkerの登録と初期化を実行
 * ServiceWorkerに依存する初期化処理（IndexedDBWorkerの初期化）も実施
 */
export async function initServiceWorker(): Promise<void> {
    if (isInitialized) {
        return;
    }
    
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            // ServiceWorkerClientを使ってServiceWorkerを登録
            // ServiceWorkerClientはグローバルな初期化状態を共有するため、重複初期化を防ぐ
            const client = new ServiceWorkerClient();
            await client.init('/service-worker.js');
            
            // ServiceWorkerに依存する初期化処理（IndexedDBWorkerの初期化）
            // IndexedDBWorkerは内部でServiceWorkerClientを使用するため、
            // ServiceWorkerの登録後に初期化を実行
            await indexedDBWorker.init();
            
            isInitialized = true;
        } catch (error) {
            console.error('ServiceWorker initialization failed:', error);
            initPromise = null;
            throw error;
        }
    })();

    return initPromise;
}
