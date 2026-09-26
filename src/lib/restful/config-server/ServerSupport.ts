import type { LinkMapping } from "$lib/types/link-mapping";
import type { RequestSettings } from "$lib/types/request-config";
import {
	MAX_RAW_SPEC_BYTES,
	PASTED_SPEC_LABEL,
} from "$lib/restful/specSource";

export type ServerConfig = {
	/** Fetchable OpenAPI URL. Optional when openApiDocumentRaw is set. */
	openApiUrl?: string;
	/** Inline OpenAPI document (JSON or YAML text). */
	openApiDocumentRaw?: string;
	/** Display label for inline document (filename or "pasted spec"). */
	openApiDocumentLabel?: string;
	useProxy?: boolean;
	serverName: string;
	serverVersion: string;
	timeout: number;
	maxRetries: number;
	requestSettings: RequestSettings;
	linkMappings?: LinkMapping[];
};

export type ServerConfigResponse = {
	configurationId: string;
	createdAt: Date;
	updatedAt: Date;
	config: ServerConfig;
};

export function hasOpenApiSource(config: ServerConfig): boolean {
	return Boolean(
		config.openApiUrl?.trim() || config.openApiDocumentRaw?.trim(),
	);
}

export function getOpenApiSourceDisplay(config: ServerConfig): string {
	const url = config.openApiUrl?.trim();
	if (url) {
		return url;
	}
	return config.openApiDocumentLabel?.trim() || PASTED_SPEC_LABEL;
}

export function isInlineOpenApiSource(config: ServerConfig): boolean {
	return Boolean(config.openApiDocumentRaw?.trim()) && !config.openApiUrl?.trim();
}

export function validateOpenApiSource(config: ServerConfig): void {
	const url = config.openApiUrl?.trim();
	const raw = config.openApiDocumentRaw?.trim();
	if (!url && !raw) {
		throw new Error("OpenAPI URL or document is required in config");
	}
	if (raw && byteLength(config.openApiDocumentRaw!) > MAX_RAW_SPEC_BYTES) {
		throw new Error("OpenAPI document exceeds 2MB");
	}
}

function byteLength(text: string): number {
	return new TextEncoder().encode(text).length;
}
