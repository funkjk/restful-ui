export interface LinkMapping {
	id: string;
	sourcePath: string;
	sourceMethod: string;
	column: string;
	targetPath: string;
	targetParam: string;
	label?: string;
}

export type LegacyLinkMapping = LinkMapping & {
	targetMethod?: string;
	paramMapping?: Record<string, string>;
};

export function createLinkMapping(
	partial: Omit<LinkMapping, "id"> & { id?: string },
): LinkMapping {
	return {
		id: partial.id ?? crypto.randomUUID(),
		...partial,
	};
}

export function defaultLinkMappingLabel(mapping: LinkMapping): string {
	return mapping.label ?? `${mapping.targetPath} → {${mapping.targetParam}}`;
}
