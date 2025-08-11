import adapter from '@sveltejs/adapter-auto';
import StaticAdapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const basePath = process.env.BUILD_BASE_PATH ?? ""
console.log("in build basePath="+basePath)
/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// paths: {
		// 	base: process.env.NODE_ENV === 'production' ? '/my-app/' : '/my-test',
		// },
		adapter: StaticAdapter({
			pages: 'build',
			fallback: 'index.html' // may differ from host to host
		}),
        paths: {
            base: basePath
        },
		prerender: {
			handleHttpError: () => {
				// ignore
				return;
			}
		}
	}
};

export default config;
