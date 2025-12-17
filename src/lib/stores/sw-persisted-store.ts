// ServiceWorkerを使ったpersistedストア（Dexie経由）
import { writable, type Writable } from 'svelte/store';
import { indexedDBWorker } from '../services/indexeddb-worker';

/**
 * ServiceWorkerを使ったpersistedストアを作成
 * メインスレッドをブロックせずにIndexedDBに保存（Dexie経由）
 */
export function swPersisted<T>(key: string, initialValue: T): Writable<T> {
    const store = writable<T>(initialValue);
    let isInitialized = false;
    let isUpdating = false;

    // 初期値を読み込む
    indexedDBWorker.init().then(() => {
        indexedDBWorker.get(key).then((value) => {
            if (value !== null && value !== undefined) {
                // 初期化時のsetは保存しないようにする
                isUpdating = true;
                store.set(value);
                // 非同期でリセット（subscribeが先に実行されるのを防ぐ）
                Promise.resolve().then(() => {
                    isUpdating = false;
                });
            }
            isInitialized = true;
        }).catch(() => {
            isInitialized = true;
        });
    });

    // ストアの変更を監視（初期化時の読み込みを防ぐため）
    store.subscribe((value) => {
        // 初期化前または更新中は何もしない（保存は set/update 内で直接行う）
        if (!isInitialized || isUpdating) {
            return;
        }
    });

    return {
        subscribe: store.subscribe,
        set: (value: T) => {
            if (!isInitialized) return;
            isUpdating = true;
            store.set(value);
            // 直接保存処理を実行（subscribeに依存しない）
            Promise.resolve().then(() => {
                indexedDBWorker.set(key, value).then(() => {
                    isUpdating = false;
                }).catch((error) => {
                    console.error('Failed to save to IndexedDB:', error);
                    isUpdating = false;
                });
            });
        },
        update: (fn: (value: T) => T) => {
            if (!isInitialized) return;
            isUpdating = true;
            let newValue: T;
            store.update((currentValue) => {
                newValue = fn(currentValue);
                return newValue;
            });
            // 直接保存処理を実行（subscribeに依存しない）
            Promise.resolve().then(() => {
                indexedDBWorker.set(key, newValue!).then(() => {
                    isUpdating = false;
                }).catch((error) => {
                    console.error('Failed to save to IndexedDB:', error);
                    isUpdating = false;
                });
            });
        }
    };
}
