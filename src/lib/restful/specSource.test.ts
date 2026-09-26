import { describe, expect, it } from "vitest";
import {
	createRawSpecSource,
	createUrlSpecSource,
	isAllowedSpecFileName,
	isSpecSourceError,
	MAX_RAW_SPEC_BYTES,
	PASTED_SPEC_LABEL,
	validateSpecFile,
} from "./specSource";

describe("createUrlSpecSource", () => {
	it("rejects empty url", () => {
		expect(createUrlSpecSource("")).toBe("Spec is empty");
		expect(createUrlSpecSource("   ")).toBe("Spec is empty");
	});

	it("accepts trimmed url", () => {
		const source = createUrlSpecSource("  https://example.com/oas.yaml  ");
		expect(isSpecSourceError(source)).toBe(false);
		if (!isSpecSourceError(source)) {
			expect(source).toEqual({
				kind: "url",
				url: "https://example.com/oas.yaml",
			});
		}
	});
});

describe("createRawSpecSource", () => {
	it("rejects empty text", () => {
		expect(createRawSpecSource("", "file.yaml")).toBe("Spec is empty");
		expect(createRawSpecSource("   ", "file.yaml")).toBe("Spec is empty");
	});

	it("accepts json and yaml text", () => {
		const json = createRawSpecSource('{"openapi":"3.0.0"}', "spec.json");
		expect(json).toEqual({
			kind: "raw",
			text: '{"openapi":"3.0.0"}',
			label: "spec.json",
		});

		const yaml = createRawSpecSource("openapi: 3.0.0\n", PASTED_SPEC_LABEL);
		expect(yaml).toEqual({
			kind: "raw",
			text: "openapi: 3.0.0\n",
			label: PASTED_SPEC_LABEL,
		});
	});

	it("uses pasted spec label when label is blank", () => {
		const source = createRawSpecSource("openapi: 3.0.0", "  ");
		expect(source).toEqual({
			kind: "raw",
			text: "openapi: 3.0.0",
			label: PASTED_SPEC_LABEL,
		});
	});

	it("rejects oversized text", () => {
		const oversized = "a".repeat(MAX_RAW_SPEC_BYTES + 1);
		expect(createRawSpecSource(oversized, "big.yaml")).toBe(
			"Spec exceeds 2MB",
		);
	});
});

describe("file validation", () => {
	it("allows json yaml yml extensions", () => {
		expect(isAllowedSpecFileName("a.json")).toBe(true);
		expect(isAllowedSpecFileName("a.YAML")).toBe(true);
		expect(isAllowedSpecFileName("a.yml")).toBe(true);
		expect(isAllowedSpecFileName("a.txt")).toBe(false);
	});

	it("rejects disallowed type and oversized file", () => {
		expect(validateSpecFile({ name: "a.txt", size: 10 })).toBe(
			"File type not allowed",
		);
		expect(
			validateSpecFile({ name: "a.yaml", size: MAX_RAW_SPEC_BYTES + 1 }),
		).toBe("Spec exceeds 2MB");
		expect(validateSpecFile({ name: "a.yaml", size: 10 })).toBeNull();
	});
});
