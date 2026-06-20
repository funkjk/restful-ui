import { describe, expect, it } from "vitest";
import type { LinkMapping } from "$lib/types/link-mapping";
import { DefaultLinkSupport } from "./RestfulInterfaces";
import {
	buildUserLinkGroups,
	buildUserLinkSearchParams,
	extractPathPrefixCandidates,
	findMappingsForColumn,
	findTargetPaths,
	getAvailableTargetParams,
	migrateLinkMapping,
	pathMatchesPrefix,
	resolveMethodForPath,
	resolveMethodsForPath,
} from "./linkMapping";
import { createRestfulOperation, OperationParameter } from "./RestfulOperation";

const petstoreDocument = {
	paths: {
		"/pet/findByStatus": { get: {} },
		"/pet/{petId}": { get: {}, post: {}, delete: {} },
		"/pet/{petId}/uploadImage": { post: {} },
	},
} as any;

const petstoreMapping: LinkMapping = {
	id: "test-1",
	sourcePath: "/pet/findByStatus",
	sourceMethod: "get",
	column: "id",
	targetPath: "/pet/{petId}",
	targetParam: "petId",
};

describe("pathMatchesPrefix", () => {
	it("matches exact and deeper paths", () => {
		expect(pathMatchesPrefix("/pet/{petId}", "/pet/{petId}")).toBe(true);
		expect(pathMatchesPrefix("/pet/{petId}/uploadImage", "/pet/{petId}")).toBe(
			true,
		);
	});

	it("does not match sibling paths", () => {
		expect(pathMatchesPrefix("/pet/findByStatus", "/pet/{petId}")).toBe(false);
	});
});

describe("findTargetPaths", () => {
	it("returns prefix matches sorted", () => {
		expect(findTargetPaths(petstoreDocument, "/pet/{petId}")).toEqual([
			"/pet/{petId}",
			"/pet/{petId}/uploadImage",
		]);
	});
});

describe("getAvailableTargetParams", () => {
	it("returns first unresolved param only", () => {
		expect(
			getAvailableTargetParams("/pet/{petId}/resource/{resourceId}", {}),
		).toEqual(["petId"]);
		expect(
			getAvailableTargetParams("/pet/{petId}/resource/{resourceId}", {
				petId: "123",
			}),
		).toEqual(["resourceId"]);
	});

	it("returns empty when all resolved", () => {
		expect(
			getAvailableTargetParams("/pet/{petId}", { petId: "123" }),
		).toEqual([]);
	});
});

describe("buildUserLinkSearchParams", () => {
	it("generates petId query param for Petstore case", () => {
		expect(buildUserLinkSearchParams(petstoreMapping, "123", "")).toBe(
			"petId=123",
		);
	});

	it("preserves inherited params", () => {
		expect(
			buildUserLinkSearchParams(petstoreMapping, "456", "status=available"),
		).toBe("status=available&petId=456");
	});
});

describe("findMappingsForColumn", () => {
	it("finds active mapping for matching operation and column", () => {
		expect(
			findMappingsForColumn(
				[petstoreMapping],
				"/pet/findByStatus",
				"get",
				"id",
				{},
			),
		).toEqual([petstoreMapping]);
	});

	it("filters inactive mappings when target param already bound", () => {
		expect(
			findMappingsForColumn(
				[petstoreMapping],
				"/pet/findByStatus",
				"get",
				"id",
				{ petId: "123" },
			),
		).toEqual([]);
	});
});

describe("migrateLinkMapping", () => {
	it("migrates legacy paramMapping to targetParam", () => {
		expect(
			migrateLinkMapping({
				...petstoreMapping,
				targetParam: undefined as unknown as string,
				targetMethod: "get",
				paramMapping: { petId: "{value}" },
			}),
		).toMatchObject({
			targetParam: "petId",
		});
	});
});

describe("resolveMethodsForPath", () => {
	it("returns all defined methods for a path", () => {
		expect(resolveMethodsForPath(petstoreDocument, "/pet/{petId}")).toEqual([
			"get",
			"post",
			"delete",
		]);
	});

	it("returns only defined methods when GET is missing", () => {
		expect(
			resolveMethodsForPath(petstoreDocument, "/pet/{petId}/uploadImage"),
		).toEqual(["post"]);
	});
});

describe("resolveMethodForPath", () => {
	it("returns the first defined method", () => {
		expect(resolveMethodForPath(petstoreDocument, "/pet/{petId}")).toBe("get");
	});

	it("falls back to first available method when GET is missing", () => {
		expect(
			resolveMethodForPath(petstoreDocument, "/pet/{petId}/uploadImage"),
		).toBe("post");
	});
});

describe("buildUserLinkGroups", () => {
	it("includes each HTTP method defined on matching paths", () => {
		const operation = createRestfulOperation(
			new OperationParameter("/pet/findByStatus", "get", [
				["status", "available"],
			]),
			petstoreDocument,
		);
		const groups = buildUserLinkGroups(
			new DefaultLinkSupport("/"),
			operation,
			[petstoreMapping],
			"id",
			"123",
		);
		expect(groups).toHaveLength(1);
		expect(groups[0].paths).toEqual([
			expect.objectContaining({ openApiPath: "/pet/{petId}", method: "get" }),
			expect.objectContaining({ openApiPath: "/pet/{petId}", method: "post" }),
			expect.objectContaining({
				openApiPath: "/pet/{petId}",
				method: "delete",
			}),
			expect.objectContaining({
				openApiPath: "/pet/{petId}/uploadImage",
				method: "post",
			}),
		]);
	});
});

describe("extractPathPrefixCandidates", () => {
	it("collects placeholder-ending prefixes", () => {
		expect(
			extractPathPrefixCandidates([
				"/pet/{petId}",
				"/pet/{petId}/uploadImage",
				"/pet/findByStatus",
			]),
		).toEqual(["/pet/{petId}"]);
	});
});
