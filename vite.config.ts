import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
	plugins: [sveltekit(), nodePolyfills({
		include: ['util', 'os', 'stream', 'crypto', 'buffer', 'process', 'events', 'assert', 'querystring', 'url', 'http', 'https', 'zlib', 'tty', 'readline', 'vm', 'timers', 'domain', 'constants', 'punycode', 'string_decoder', 'cluster']
	})],
	ssr: {
		noExternal: ['@modelcontextprotocol/sdk']
	},
	build: {
	},
	optimizeDeps: {
		exclude: ['@modelcontextprotocol/sdk']
	},
	define: {
		'process.env.NODE_ENV': '"production"',
		'global': 'globalThis'
	}
});
