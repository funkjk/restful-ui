import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
	plugins: [sveltekit(), nodePolyfills()],
	build: {
		rollupOptions: {
			external: [
				'fs/promises',
				'fs',
				'path',
				'os',
				'child_process'
			]
		}
	}
});
