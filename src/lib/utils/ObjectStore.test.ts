import { describe, expect, it } from "vitest";
import { writable } from "svelte/store";
import { get } from "svelte/store";
import {
	loadStoreValue,
	persistStoreValue,
	syncObject,
} from "./ObjectStore";

describe("persistStoreValue", () => {
	it("writes a new object so session subscribers see the change", () => {
		const initial = {};
		const store = writable<Record<string, unknown>>(initial);
		persistStoreValue(store, "GET:/devices", "body.deviceList");
		const next = get(store);
		expect(next).toEqual({ "GET:/devices": "body.deviceList" });
		expect(next).not.toBe(initial);
	});

	it("deletes falsy values instead of storing empty string", () => {
		const store = writable<Record<string, unknown>>({
			"GET:/devices": "body.deviceList",
		});
		persistStoreValue(store, "GET:/devices", "");
		expect(get(store)).toEqual({});
	});
});

describe("loadStoreValue", () => {
	it("returns stored value or default", () => {
		const store = writable<Record<string, unknown>>({
			"GET:/devices": "body.deviceList",
		});
		expect(loadStoreValue(store, "GET:/devices", "")).toBe("body.deviceList");
		expect(loadStoreValue(store, "GET:/other", "")).toBe("");
	});
});

describe("syncObject", () => {
	it("treats empty string as a write and clears the stored key", () => {
		const store = writable<Record<string, unknown>>({
			"GET:/devices": "body.deviceList",
		});
		const result = syncObject("", store, "GET:/devices", "");
		expect(result).toBe("");
		expect(get(store)).toEqual({});
	});

	it("reads from the store when value is undefined", () => {
		const store = writable<Record<string, unknown>>({
			"GET:/devices": "body.deviceList",
		});
		expect(syncObject(undefined, store, "GET:/devices", "")).toBe(
			"body.deviceList",
		);
	});
});
