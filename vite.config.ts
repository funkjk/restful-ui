import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

function resolveBuildMode(env: Record<string, string>): BuildMode {
	const isE2ETest = env.NODE_ENV === 'test' || env.TEST_MODE === 'e2e';
	if (isE2ETest) {
		return 'server';
	}
	const raw = process.env.BUILD_MODE ?? env.BUILD_MODE ?? 'server';
	return raw === 'static' ? 'static' : 'server';
}

type BuildMode = 'static' | 'server';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	const buildMode = resolveBuildMode(env);
	const basePath = process.env.BUILD_BASE_PATH ?? ""
	
	// 実際の環境変数の値を使用（E2Eテスト時は'test'、それ以外は'production'）
	const nodeEnv = process.env.NODE_ENV || env.NODE_ENV || 'production';

	return {
		plugins: [sveltekit(), nodePolyfills({
			// クライアントサイドのみでポリフィルを有効化
			// サーバーサイドではcryptoとbufferのpolyfillを除外（Node.jsのネイティブ実装を使用）
			exclude: ['crypto', 'buffer', 'fs', 'fs/promises'],
			globals: {
				Buffer: true,
			},
			protocolImports: true,
		})],
		ssr: {
			// サーバーサイドではポリフィルを無効化し、Node.jsのネイティブ実装を使用
			noExternal: [],
			external: ['fs', 'fs/promises', 'path'],
			resolve: {
				// サーバーサイドではブラウザ用のpolyfillを無視し、Node.jsのネイティブ実装を使用
				conditions: ['node', 'import', 'module'],
			},
		},
		define: {
			'process.env.NODE_ENV': JSON.stringify(nodeEnv),
			'process.env.BUILD_MODE': JSON.stringify(buildMode),
			'global': 'globalThis',
			'import.meta.env.BUILD_MODE': JSON.stringify(buildMode),
			'import.meta.env.BUILD_BASE_PATH': `"${basePath}"`,
			// ビルド日時をISO形式（日本時間）で定義
			'import.meta.env.BUILD_TIME': JSON.stringify(
				(() => {
					const now = new Date();
					const jstOffset = 9 * 60; // JSTはUTC+9時間
					const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
					const year = jstTime.getUTCFullYear();
					const month = String(jstTime.getUTCMonth() + 1).padStart(2, '0');
					const day = String(jstTime.getUTCDate()).padStart(2, '0');
					const hours = String(jstTime.getUTCHours()).padStart(2, '0');
					const minutes = String(jstTime.getUTCMinutes()).padStart(2, '0');
					const seconds = String(jstTime.getUTCSeconds()).padStart(2, '0');
					return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
				})()
			)
		}
	};
});
