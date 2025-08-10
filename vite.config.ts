import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
	plugins: [sveltekit(), nodePolyfills()],
	ssr: {
		noExternal: ['@modelcontextprotocol/sdk']
	},
	build: {
		rollupOptions: {
			external: [
				'fs/promises',
				'fs',
				'path',
				'os',
				'child_process',
				'crypto',
				'stream',
				'util',
				'events',
				'assert',
				'buffer',
				'querystring',
				'url',
				'http',
				'https',
				'zlib',
				'tty',
				'readline',
				'vm',
				'perf_hooks',
				'async_hooks',
				'timers',
				'domain',
				'constants',
				'punycode',
				'string_decoder',
				'cluster',
				'worker_threads',
				'v8',
				'process'
			]
		}
	},
	optimizeDeps: {
		exclude: ['@modelcontextprotocol/sdk']
	},
	define: {
		'process.env.NODE_ENV': '"production"'
	}
});
