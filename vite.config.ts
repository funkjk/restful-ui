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
	},
	resolve: {
		alias: {
			'util': 'vite-plugin-node-polyfills/polyfills/util',
			'os': 'vite-plugin-node-polyfills/polyfills/os',
			'stream': 'vite-plugin-node-polyfills/polyfills/stream',
			'crypto': 'vite-plugin-node-polyfills/polyfills/crypto',
			'buffer': 'vite-plugin-node-polyfills/polyfills/buffer',
			'process': 'vite-plugin-node-polyfills/polyfills/process',
			'events': 'vite-plugin-node-polyfills/polyfills/events',
			'assert': 'vite-plugin-node-polyfills/polyfills/assert',
			'querystring': 'vite-plugin-node-polyfills/polyfills/qs',
			'url': 'vite-plugin-node-polyfills/polyfills/url',
			'http': 'vite-plugin-node-polyfills/polyfills/http',
			'https': 'vite-plugin-node-polyfills/polyfills/https',
			'zlib': 'vite-plugin-node-polyfills/polyfills/zlib',
			'tty': 'vite-plugin-node-polyfills/polyfills/tty',
			'readline': 'vite-plugin-node-polyfills/polyfills/readline',
			'vm': 'vite-plugin-node-polyfills/polyfills/vm',
			'perf_hooks': 'vite-plugin-node-polyfills/polyfills/perf_hooks',
			'async_hooks': 'vite-plugin-node-polyfills/polyfills/async_hooks',
			'timers': 'vite-plugin-node-polyfills/polyfills/timers',
			'domain': 'vite-plugin-node-polyfills/polyfills/domain',
			'constants': 'vite-plugin-node-polyfills/polyfills/constants',
			'punycode': 'vite-plugin-node-polyfills/polyfills/punycode',
			'string_decoder': 'vite-plugin-node-polyfills/polyfills/string_decoder',
			'cluster': 'vite-plugin-node-polyfills/polyfills/cluster',
			'worker_threads': 'vite-plugin-node-polyfills/polyfills/worker_threads',
			'v8': 'vite-plugin-node-polyfills/polyfills/v8'
		}
	}
});
