import { describe, expect, it } from "vitest";
import {
	getOpenApiSourceDisplay,
	hasOpenApiSource,
	isInlineOpenApiSource,
	validateOpenApiSource,
	type ServerConfig,
} from "./ServerSupport";
import { MAX_RAW_SPEC_BYTES, PASTED_SPEC_LABEL } from "$lib/restful/specSource";

function baseConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
	return {
		serverName: "demo",
		serverVersion: "1.0.0",
		timeout: 10000,
		maxRetries: 3,
		requestSettings: {
			headers: [],
			useProxy: false,
			proxyBaseUrl: "",
		},
		...overrides,
	};
}

describe("ServerConfig openapi source", () => {
	it("accepts url source", () => {
		const config = baseConfig({ openApiUrl: "https://example.com/oas.yaml" });
		expect(hasOpenApiSource(config)).toBe(true);
		expect(isInlineOpenApiSource(config)).toBe(false);
		expect(getOpenApiSourceDisplay(config)).toBe(
			"https://example.com/oas.yaml",
		);
		expect(() => validateOpenApiSource(config)).not.toThrow();
	});

	it("accepts inline raw source", () => {
		const config = baseConfig({
			openApiDocumentRaw: "openapi: 3.0.0\n",
			openApiDocumentLabel: "demo.yaml",
		});
		expect(hasOpenApiSource(config)).toBe(true);
		expect(isInlineOpenApiSource(config)).toBe(true);
		expect(getOpenApiSourceDisplay(config)).toBe("demo.yaml");
		expect(() => validateOpenApiSource(config)).not.toThrow();
	});

	it("uses pasted spec label when label missing", () => {
		const config = baseConfig({
			openApiDocumentRaw: "openapi: 3.0.0\n",
		});
		expect(getOpenApiSourceDisplay(config)).toBe(PASTED_SPEC_LABEL);
	});

	it("rejects missing source", () => {
		expect(() => validateOpenApiSource(baseConfig())).toThrow(
			/OpenAPI URL or document/,
		);
	});

	it("rejects oversized inline document", () => {
		const config = baseConfig({
			openApiDocumentRaw: "a".repeat(MAX_RAW_SPEC_BYTES + 1),
		});
		expect(() => validateOpenApiSource(config)).toThrow(/2MB/);
	});

	it("prefers url when both are present", () => {
		const config = baseConfig({
			openApiUrl: "https://example.com/oas.yaml",
			openApiDocumentRaw: "openapi: 3.0.0\n",
			openApiDocumentLabel: "demo.yaml",
		});
		expect(isInlineOpenApiSource(config)).toBe(false);
		expect(getOpenApiSourceDisplay(config)).toBe(
			"https://example.com/oas.yaml",
		);
	});
});
