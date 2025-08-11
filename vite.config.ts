import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig(({ mode }) => {
	// e2eテスト時はBUILD_STATICをfalseに設定
	const isE2ETest = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'e2e';
	const buildStatic = isE2ETest ? 'false' : 'true';
	const basePath = process.env.BUILD_BASE_PATH ?? ""

	return {
		plugins: [sveltekit(), nodePolyfills()],
		define: {
			'process.env.NODE_ENV': '"production"',
			'global': 'globalThis',
			// 環境変数BUILD_STATICを定義（e2eテスト時はfalse、それ以外はtrue）
			'import.meta.env.BUILD_STATIC': `"${buildStatic}"`,
			'import.meta.env.BUILD_BASE_PATH': `"${basePath}"`
		}
	};
});
