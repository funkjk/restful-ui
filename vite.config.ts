import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	// e2eテスト時はBUILD_STATICをfalseに設定
	const isE2ETest = env.NODE_ENV === 'test' || env.TEST_MODE === 'e2e';
	const buildStatic = isE2ETest 
		? 'false' 
		: (env.BUILD_STATIC ?? 'true');
	const basePath = process.env.BUILD_BASE_PATH ?? ""
	
	// 実際の環境変数の値を使用（E2Eテスト時は'test'、それ以外は'production'）
	const nodeEnv = process.env.NODE_ENV || env.NODE_ENV || 'production';

	return {
		plugins: [sveltekit(), nodePolyfills({
			// クライアントサイドのみでポリフィルを有効化
			// サーバーサイドではcryptoとbufferのpolyfillを除外（Node.jsのネイティブ実装を使用）
			exclude: ['crypto', 'buffer'],
			globals: {
				Buffer: true,
			},
			protocolImports: true,
		})],
		ssr: {
			// サーバーサイドではポリフィルを無効化し、Node.jsのネイティブ実装を使用
			noExternal: [],
			resolve: {
				// サーバーサイドではブラウザ用のpolyfillを無視し、Node.jsのネイティブ実装を使用
				conditions: ['node', 'import', 'module'],
			},
		},
		define: {
			'process.env.NODE_ENV': JSON.stringify(nodeEnv),
			'global': 'globalThis',
			// 環境変数BUILD_STATICを定義（e2eテスト時はfalse、それ以外はtrue）
			'import.meta.env.BUILD_STATIC': `"${buildStatic}"`,
			'import.meta.env.BUILD_BASE_PATH': `"${basePath}"`
		}
	};
});
