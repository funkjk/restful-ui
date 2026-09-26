import { describe, expect, it } from "vitest";
import { toPersistedRequestSettings } from "$lib/types/request-config";

describe("toPersistedRequestSettings", () => {
	it("keeps entries with persist true or undefined", () => {
		const settings = toPersistedRequestSettings({
			headers: [],
			useProxy: false,
			variables: {
				entries: [
					{ name: "ts", expression: "timestamp()", persist: true },
					{ name: "secret", expression: '"x"', persist: false },
					{ name: "nonce", expression: "uuid()" },
				],
			},
		});
		expect(settings.variables?.entries.map((e) => e.name)).toEqual([
			"ts",
			"nonce",
		]);
	});

	it("drops variables when all entries are non-persistent", () => {
		const settings = toPersistedRequestSettings({
			headers: [],
			useProxy: false,
			variables: {
				entries: [{ name: "s", expression: '"x"', persist: false }],
			},
		});
		expect(settings.variables).toBeUndefined();
	});
});
