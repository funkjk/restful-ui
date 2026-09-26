import { createHmac, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { evaluateEntries } from "./evaluateEntries";
import type { VariableEvalDeps } from "./celEnvironment";

const NOW_MS = 1_700_000_000_000;
const NONCE = "11111111-2222-4333-8444-555555555555";

function fixedDeps(nowMs = NOW_MS, uuid = NONCE): VariableEvalDeps {
	return {
		nowMs: () => nowMs,
		randomUUID: () => uuid,
		hmacSha256: async (message, key) =>
			new Uint8Array(createHmac("sha256", key).update(message, "utf8").digest()),
	};
}

const request = { method: "GET", path: "/configs", body: "" };

describe("evaluateEntries", () => {
	it("skips empty names and evaluates in order", async () => {
		const vars = await evaluateEntries(
			[
				{ name: "", expression: "1" },
				{ name: "ts", expression: "timestamp()" },
				{ name: "later", expression: "ts + 30 * 60 * 1000" },
			],
			request,
			fixedDeps(),
		);
		expect(vars.ts).toBe(String(NOW_MS));
		expect(vars.later).toBe(String(NOW_MS + 30 * 60 * 1000));
	});

	it("supports uuid and request.path", async () => {
		const vars = await evaluateEntries(
			[
				{ name: "nonce", expression: "uuid()" },
				{ name: "p", expression: "request.path" },
			],
			request,
			fixedDeps(),
		);
		expect(vars.nonce).toBe(NONCE);
		expect(vars.p).toBe("/configs");
	});

	it("matches Node crypto for SwitchBot-style HMAC", async () => {
		const token = "demo-token";
		const secret = "demo-secret";
		const vars = await evaluateEntries(
			[
				{ name: "ts", expression: "timestamp()" },
				{ name: "nonce", expression: "uuid()" },
				{
					name: "sign",
					expression: `base64(hmac_sha256("${token}" + string(ts) + nonce, "${secret}"))`,
				},
			],
			request,
			fixedDeps(),
		);
		const expected = createHmac("sha256", secret)
			.update(`${token}${NOW_MS}${NONCE}`, "utf8")
			.digest("base64");
		expect(vars.sign).toBe(expected);
	});

	it("throws when assigning raw bytes", async () => {
		await expect(
			evaluateEntries(
				[
					{
						name: "raw",
						expression: 'hmac_sha256("a", "b")',
					},
				],
				request,
				fixedDeps(),
			),
		).rejects.toThrow(/bytes/);
	});

	it("throws on empty expression", async () => {
		await expect(
			evaluateEntries([{ name: "x", expression: "  " }], request, fixedDeps()),
		).rejects.toThrow(/empty expression/);
	});
});

describe("randomUUID smoke", () => {
	it("works", () => {
		expect(randomUUID()).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
	});
});
