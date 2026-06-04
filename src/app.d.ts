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

// 環境変数の型定義
declare module '$env/static/public' {
	export const BUILD_STATIC: string;
}

// import.meta.envの型定義
interface ImportMetaEnv {
	readonly BUILD_STATIC: string;
	readonly BUILD_BASE_PATH: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

export {};
