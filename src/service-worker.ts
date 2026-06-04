/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />
// ServiceWorker: Dexieを使ってIndexedDBを操作（TypeScript版）
// SvelteKit標準機能を使用

// ServiceWorkerの型定義
declare const self: ServiceWorkerGlobalScope;

// Dexieをimport（ビルド時にバンドルされる）
// 開発環境ではモジュールとして実行されるため、通常のimportが動作する
import Dexie, { type Table } from 'dexie';

// Dexieデータベースの定義
class PersistedStoreDB extends Dexie {
    stores!: Table<{ key: string; value: any }, string>;

    constructor() {
        super('restful-ui-db');
        this.version(1).stores({
            stores: 'key' // keyをインデックスとして使用
        });
    }
}

let database: PersistedStoreDB | null = null;

// Dexieを初期化
function initDB() {
    if (!database) {
        database = new PersistedStoreDB();
    }
    return database;
}

// メッセージハンドラー
self.addEventListener('message', async (event: MessageEvent) => {
    const { type, key, value: serializedValue, id } = event.data;
    
    // event.sourceがClientオブジェクトの場合、それを使って返信
    // そうでない場合は、すべてのクライアントに送信
    const sendResponse = (data: any) => {
        // レスポンスをJSONシリアライズ（postMessageでクローンできないオブジェクトを回避）
        let serializedData: string;
        try {
            serializedData = JSON.stringify(data);
        } catch (error) {
            serializedData = JSON.stringify({
                id: data.id,
                success: false,
                error: `Failed to serialize response: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
        
        if (event.source && 'postMessage' in event.source) {
            (event.source as any).postMessage(serializedData);
        } else {
            // フォールバック: すべてのクライアントに送信
            (self as any).clients.matchAll().then((clients: any[]) => {
                clients.forEach((client: any) => {
                    client.postMessage(serializedData);
                });
            });
        }
    };

    try {
        const db = initDB();
        console.log('db initialized', db.name, db.verno);
        
        // 受信したデータをJSONデシリアライズ
        let value: any;
        if (serializedValue !== undefined && serializedValue !== null) {
            try {
                value = typeof serializedValue === 'string' 
                    ? JSON.parse(serializedValue) 
                    : serializedValue;
            } catch (error) {
                sendResponse({
                    id,
                    success: false,
                    error: `Failed to deserialize value: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
                return;
            }
        }
        
        switch (type) {
            case 'get': {
                const result = await db.stores.get(key);
                sendResponse({
                    id,
                    success: true,
                    value: result?.value ?? null
                });
                break;
            }

            case 'set': {
                try {
                    await db.stores.put({ key, value });
                    sendResponse({
                        id,
                        success: true
                    });
                } catch (error) {
                    console.error('set error', key, error);
                    sendResponse({
                        id,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                break;
            }

            case 'delete': {
                await db.stores.delete(key);
                sendResponse({
                    id,
                    success: true
                });
                break;
            }

            default:
                sendResponse({
                    id,
                    success: false,
                    error: `Unknown type: ${type}`
                });
        }
    } catch (error) {
        console.error('error', error);
        sendResponse({
            id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
