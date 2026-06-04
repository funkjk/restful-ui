/** Deploy base path from BUILD_BASE_PATH at build time (e.g. '' or '/restful-ui'). */
export function getAppBasePath(): string {
	const base = import.meta.env.BUILD_BASE_PATH ?? '';
	return base || '/';
}

/** Prefix an app-root-relative path with the deploy base path. */
export function withAppBase(path: string): string {
	const base = getAppBasePath();
	if (base === '/') {
		return path;
	}
	if (path === '/' || path === '') {
		return `${base}/`;
	}
	return base + (path.startsWith('/') ? path : `/${path}`);
}
