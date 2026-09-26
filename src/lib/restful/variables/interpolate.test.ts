import { describe, expect, it } from "vitest";
import { interpolate, interpolateHeaders } from "./interpolate";

describe("interpolate", () => {
	it("replaces placeholders", () => {
		expect(
			interpolate("nonce=${nonce}&t=${ts}", {
				nonce: "abc",
				ts: "123",
			}),
		).toBe("nonce=abc&t=123");
	});

	it("throws on unknown variable", () => {
		expect(() => interpolate("x=${missing}", {})).toThrow(
			/Unknown variable/,
		);
	});

	it("interpolates header map", () => {
		expect(
			interpolateHeaders(
				{ Authorization: "tok", sign: "${sign}" },
				{ sign: "SIG" },
			),
		).toEqual({ Authorization: "tok", sign: "SIG" });
	});
});
