// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// 環境変数の型定義
declare global {
	namespace App {
		interface Locals {
			auth?: (options?: import('@clerk/shared/types').PendingSessionOptions) => import('@clerk/backend').SessionAuthObject;
		}
		interface PageData {}
		interface Error {}
		interface Platform {}
	}
}

declare module '$env/static/public' {
	export const BUILD_MODE: 'static' | 'server';
}

interface ImportMetaEnv {
	readonly BUILD_MODE: 'static' | 'server';
	readonly BUILD_BASE_PATH: string;
	readonly PUBLIC_CORS_PROXY_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

export {};
