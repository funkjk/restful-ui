import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// paths: {
		// 	base: process.env.NODE_ENV === 'production' ? '/my-app/' : '/my-test',
		// },
		adapter: adapter({
			pages: 'build',
			fallback: 'index.html' // may differ from host to host
		}),
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// ignore
				return;
			}
		}
	}
};

export default config;
