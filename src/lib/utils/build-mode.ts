export type BuildMode = 'static' | 'server';

export const BUILD_MODE = import.meta.env.BUILD_MODE as BuildMode;

export function isStaticBuildMode(): boolean {
	return BUILD_MODE === 'static';
}

export function isServerBuildMode(): boolean {
	return BUILD_MODE === 'server';
}
