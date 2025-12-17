// ServiceWorkerの登録とメッセージ通信を管理（汎用的）
import { dev } from '$app/environment';

// グローバルな初期化状態（シングルトン）
let globalIsInitialized = false;
let globalInitPromise: Promise<void> | null = null;

export class ServiceWorkerClient {
    private registration: ServiceWorkerRegistration | null = null;
    private messageId = 0;
    private pendingMessages = new Map<number, {
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }>();

    /**
     * ServiceWorkerを登録し、アクティブ化を待つ
     * 重複初期化を防ぐため、グローバルな初期化状態を共有
     */
    async init(scriptPath: string = '/service-worker.js'): Promise<void> {
        if (globalIsInitialized) {
            // 既に初期化済みの場合、このインスタンスのregistrationを設定
            if (!this.registration) {
                const existingRegistration = await navigator.serviceWorker.getRegistration(scriptPath);
                if (existingRegistration) {
                    this.registration = existingRegistration;
                    // メッセージリスナーを設定
                    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
                        this.handleMessage(event);
                    });
                }
            }
            return;
        }

        if (globalInitPromise) {
            await globalInitPromise;
            // 初期化完了後、このインスタンスのregistrationを設定
            if (!this.registration) {
                const existingRegistration = await navigator.serviceWorker.getRegistration(scriptPath);
                if (existingRegistration) {
                    this.registration = existingRegistration;
                    // メッセージリスナーを設定
                    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
                        this.handleMessage(event);
                    });
                }
            }
            return;
        }

        globalInitPromise = (async () => {
            if ('serviceWorker' in navigator) {
                try {
                    // 開発環境ではモジュールタイプを指定
                    const registrationOptions = dev ? { type: 'module' as const } : undefined;
                    this.registration = await navigator.serviceWorker.register(scriptPath, registrationOptions);
                    
                    // メッセージリスナーを設定
                    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
                        this.handleMessage(event);
                    });
                    
                    // ServiceWorkerがアクティブになるまで待つ
                    await this.waitForActivation();
                    globalIsInitialized = true;
                } catch (error) {
                    console.warn('ServiceWorker registration failed:', error);
                    globalInitPromise = null;
                    throw error;
                }
            }
        })();

        return globalInitPromise;
    }

    /**
     * ServiceWorkerからのメッセージを処理
     */
    private handleMessage(event: MessageEvent): void {
        // レスポンスがJSON文字列の場合とオブジェクトの場合の両方に対応
        let responseData: any;
        try {
            // 文字列の場合はJSONパース、オブジェクトの場合はそのまま
            responseData = typeof event.data === 'string' 
                ? JSON.parse(event.data) 
                : event.data;
        } catch (e) {
            // パースに失敗した場合はそのまま使用
            responseData = event.data;
        }
        
        const { id, success, value, error } = responseData;
        const pending = this.pendingMessages.get(id);
        if (pending) {
            this.pendingMessages.delete(id);
            if (success) {
                // valueがJSON文字列の場合はデシリアライズ
                try {
                    const deserializedValue = value !== null && value !== undefined 
                        ? (typeof value === 'string' ? JSON.parse(value) : value)
                        : value;
                    pending.resolve(deserializedValue);
                } catch (e) {
                    // 既にオブジェクトの場合はそのまま返す
                    pending.resolve(value);
                }
            } else {
                pending.reject(new Error(error || 'Unknown error'));
            }
        }
    }

    /**
     * ServiceWorkerがアクティブになるまで待つ
     */
    private async waitForActivation(): Promise<void> {
        if (!this.registration) return;

        if (this.registration.installing) {
            await new Promise<void>((resolve) => {
                const installing = this.registration!.installing!;
                installing.addEventListener('statechange', () => {
                    if (installing.state === 'activated') {
                        resolve();
                    }
                });
            });
        } else if (this.registration.waiting) {
            // 既に待機中の場合はアクティベートを待つ
            await new Promise<void>((resolve) => {
                const waiting = this.registration!.waiting!;
                waiting.addEventListener('statechange', () => {
                    if (waiting.state === 'activated') {
                        resolve();
                    }
                });
            });
        }
    }

    /**
     * ServiceWorkerにメッセージを送信
     */
    async sendMessage(message: any, timeout: number = 5000): Promise<any> {
        if (!this.registration) {
            await this.init();
        }
        
        if (!this.registration || !this.registration.active) {
            throw new Error('ServiceWorker is not available');
        }

        const id = ++this.messageId;
        
        return new Promise((resolve, reject) => {
            this.pendingMessages.set(id, { resolve, reject });
            
            // データをJSONシリアライズ（postMessageでクローンできないオブジェクトを回避）
            let serializedMessage: any;
            try {
                serializedMessage = JSON.parse(JSON.stringify({ ...message, id }));
            } catch (error) {
                reject(new Error(`Failed to serialize message: ${error instanceof Error ? error.message : 'Unknown error'}`));
                return;
            }
            
            this.registration!.active!.postMessage(serializedMessage);
            
            // タイムアウト
            setTimeout(() => {
                if (this.pendingMessages.has(id)) {
                    this.pendingMessages.delete(id);
                    reject(new Error('Timeout'));
                }
            }, timeout);
        });
    }

    /**
     * ServiceWorkerの登録状態を取得
     */
    getRegistration(): ServiceWorkerRegistration | null {
        return this.registration;
    }

    /**
     * ServiceWorkerが利用可能かどうか
     */
    isAvailable(): boolean {
        return this.registration !== null && this.registration.active !== null;
    }
}
