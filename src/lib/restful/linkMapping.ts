import type { OpenAPI } from "openapi-types";
import type { LinkMapping, LegacyLinkMapping } from "$lib/types/link-mapping";
import { defaultLinkMappingLabel } from "$lib/types/link-mapping";
import type { RestfulOperation } from "./RestfulOperation";
import { methods } from "./RestfulOperation";
import type { LinkSupport } from "./RestfulInterfaces";

function normalizeMethod(method: string): string {
	return method.toLowerCase();
}

function splitPath(path: string): string[] {
	return path.split("/").filter(Boolean);
}

export function extractPathParameterNames(path: string): string[] {
	const names: string[] = [];
	const pattern = /\{([^}]+)\}/g;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(path)) !== null) {
		names.push(match[1]);
	}
	return names;
}

export function pathMatchesPrefix(openApiPath: string, prefix: string): boolean {
	const pathSegs = splitPath(openApiPath);
	const prefixSegs = splitPath(prefix);
	if (pathSegs.length < prefixSegs.length) {
		return false;
	}
	for (let i = 0; i < prefixSegs.length; i++) {
		const prefixSeg = prefixSegs[i];
		const pathSeg = pathSegs[i];
		if (prefixSeg.startsWith("{") && prefixSeg.endsWith("}")) {
			if (!pathSeg.startsWith("{") || !pathSeg.endsWith("}")) {
				return false;
			}
			if (prefixSeg.slice(1, -1) !== pathSeg.slice(1, -1)) {
				return false;
			}
		} else if (prefixSeg !== pathSeg) {
			return false;
		}
	}
	return true;
}

export function extractPathPrefixCandidates(openApiPaths: string[]): string[] {
	const prefixes = new Set<string>();
	for (const path of openApiPaths) {
		let current = "";
		for (const segment of splitPath(path)) {
			current += `/${segment}`;
			if (segment.startsWith("{") && segment.endsWith("}")) {
				prefixes.add(current);
			}
		}
	}
	return Array.from(prefixes).sort();
}

export function getBoundParams(
	parameters: Record<string, string>,
): Record<string, string> {
	return Object.fromEntries(
		Object.entries(parameters).filter(
			([, value]) => value !== null && value !== undefined && value !== "",
		),
	);
}

export function getAvailableTargetParams(
	targetPathPrefix: string,
	boundParams: Record<string, string>,
): string[] {
	const prefixParams = extractPathParameterNames(targetPathPrefix);
	for (const param of prefixParams) {
		if (param in boundParams && boundParams[param]) {
			continue;
		}
		return [param];
	}
	return [];
}

export function isMappingActive(
	mapping: LinkMapping,
	boundParams: Record<string, string>,
): boolean {
	const available = getAvailableTargetParams(mapping.targetPath, boundParams);
	return (
		available.length === 1 && available[0] === mapping.targetParam
	);
}

export function migrateLinkMapping(raw: LegacyLinkMapping): LinkMapping {
	if (raw.targetParam?.trim()) {
		const { targetMethod: _tm, paramMapping: _pm, ...mapping } = raw;
		return mapping;
	}

	let targetParam = raw.column;
	if (raw.paramMapping) {
		const keys = Object.keys(raw.paramMapping);
		if (keys.includes(raw.column)) {
			targetParam = raw.column;
		} else if (keys.length > 0) {
			targetParam = keys[0];
		}
	}

	const { targetMethod: _tm, paramMapping: _pm, ...rest } = raw;
	return {
		...rest,
		targetParam,
	};
}

export function migrateLinkMappings(mappings: unknown[]): LinkMapping[] {
	if (!Array.isArray(mappings)) {
		return [];
	}
	return mappings.map((mapping) =>
		migrateLinkMapping(mapping as LegacyLinkMapping),
	);
}

export function findMappingsForOperation(
	mappings: LinkMapping[],
	path: string,
	method: string,
): LinkMapping[] {
	const normalizedMethod = normalizeMethod(method);
	return migrateLinkMappings(mappings).filter(
		(m) =>
			m.sourcePath === path &&
			normalizeMethod(m.sourceMethod) === normalizedMethod,
	);
}

export function findMappingsForColumn(
	mappings: LinkMapping[],
	path: string,
	method: string,
	column: string,
	boundParams: Record<string, string> = {},
): LinkMapping[] {
	return findMappingsForOperation(mappings, path, method)
		.filter((m) => m.column === column)
		.filter((m) => isMappingActive(m, boundParams));
}

export function findTargetPaths(
	document: OpenAPI.Document,
	targetPathPrefix: string,
): string[] {
	const paths = document.paths ?? {};
	return Object.keys(paths)
		.filter((path) => pathMatchesPrefix(path, targetPathPrefix))
		.sort();
}

export function resolveMethodForPath(
	document: OpenAPI.Document,
	path: string,
): string | null {
	const pathItem = document.paths?.[path] as
		| Record<string, unknown>
		| undefined;
	if (!pathItem) {
		return null;
	}
	if (pathItem.get) {
		return "get";
	}
	for (const method of methods) {
		if (pathItem[method]) {
			return method;
		}
	}
	return null;
}

export function buildUserLinkSearchParams(
	mapping: LinkMapping,
	value: string,
	inheritedParams: string,
): string {
	const parts: string[] = [];
	if (inheritedParams) {
		parts.push(inheritedParams);
	}
	parts.push(
		`${mapping.targetParam}=${encodeURIComponent(value)}`,
	);
	return parts.join("&");
}

export function buildUserLinkHref(
	linkSupport: LinkSupport,
	currentOperation: RestfulOperation,
	mapping: LinkMapping,
	targetOpenApiPath: string,
	value: string,
): string | null {
	const method = resolveMethodForPath(
		currentOperation.document,
		targetOpenApiPath,
	);
	if (!method) {
		return null;
	}
	const inherited = currentOperation.getAdditionalParameters(
		targetOpenApiPath,
	);
	const searchParams = buildUserLinkSearchParams(
		mapping,
		value,
		inherited,
	);
	return linkSupport.createLink({
		page: "operation",
		restPath: targetOpenApiPath,
		restMethod: method,
		additionalSearch: searchParams,
	});
}

export type UserLinkGroup = {
	mapping: LinkMapping;
	paths: { openApiPath: string; href: string }[];
};

export function buildUserLinkGroups(
	linkSupport: LinkSupport,
	currentOperation: RestfulOperation,
	mappings: LinkMapping[],
	column: string,
	value: string,
): UserLinkGroup[] {
	const boundParams = getBoundParams(currentOperation.parameters);
	return findMappingsForColumn(
		mappings,
		currentOperation.path,
		currentOperation.method ?? "get",
		column,
		boundParams,
	).map((mapping) => ({
		mapping,
		paths: findTargetPaths(currentOperation.document, mapping.targetPath)
			.map((openApiPath) => ({
				openApiPath,
				href:
					buildUserLinkHref(
						linkSupport,
						currentOperation,
						mapping,
						openApiPath,
						value,
					) ?? "",
			}))
			.filter((entry) => entry.href),
	})).filter((group) => group.paths.length > 0);
}

export function validateLinkMapping(mapping: LinkMapping): string[] {
	const warnings: string[] = [];
	if (!mapping.sourcePath.trim()) {
		warnings.push("sourcePath is required");
	}
	if (!mapping.sourceMethod.trim()) {
		warnings.push("sourceMethod is required");
	}
	if (!mapping.column.trim()) {
		warnings.push("column is required");
	}
	if (!mapping.targetPath.trim()) {
		warnings.push("targetPath is required");
	}
	if (!mapping.targetParam.trim()) {
		warnings.push("targetParam is required");
	}
	const pathParams = extractPathParameterNames(mapping.targetPath);
	if (!pathParams.includes(mapping.targetParam)) {
		warnings.push(
			`targetParam "${mapping.targetParam}" is not a placeholder in targetPath`,
		);
	}
	return warnings;
}

export { defaultLinkMappingLabel };
