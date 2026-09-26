import { Environment } from "@marcbachmann/cel-js";

export interface VariableEvalDeps {
	nowMs: () => number;
	randomUUID: () => string;
	hmacSha256: (
		message: string,
		key: string,
	) => Promise<Uint8Array>;
}

export async function hmacSha256WebCrypto(
	message: string,
	key: string,
): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		encoder.encode(key),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		cryptoKey,
		encoder.encode(message),
	);
	return new Uint8Array(signature);
}

export const defaultVariableEvalDeps: VariableEvalDeps = {
	nowMs: () => Date.now(),
	randomUUID: () => crypto.randomUUID(),
	hmacSha256: hmacSha256WebCrypto,
};

function bytesToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (const b of bytes) {
		binary += String.fromCharCode(b);
	}
	return btoa(binary);
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Shared CEL environment with custom functions for Variables.
 */
export function createVariablesEnvironment(
	deps: VariableEvalDeps = defaultVariableEvalDeps,
): Environment {
	return new Environment()
		.registerVariable("request", "map")
		.registerFunction("timestamp(): int", () => BigInt(deps.nowMs()))
		.registerFunction("timestamp_s(): int", () =>
			BigInt(Math.floor(deps.nowMs() / 1000)),
		)
		.registerFunction("uuid(): string", () => deps.randomUUID())
		.registerFunction(
			"hmac_sha256(string, string): bytes",
			async (message: string, key: string) => deps.hmacSha256(message, key),
		)
		.registerFunction("base64(bytes): string", (bytes: Uint8Array) =>
			bytesToBase64(bytes),
		)
		.registerFunction("hex(bytes): string", (bytes: Uint8Array) =>
			bytesToHex(bytes),
		);
}

export function celTypeOf(value: unknown): "int" | "string" | "bool" | "map" {
	if (typeof value === "bigint" || typeof value === "number") {
		return "int";
	}
	if (typeof value === "boolean") {
		return "bool";
	}
	if (value !== null && typeof value === "object" && !(value instanceof Uint8Array)) {
		return "map";
	}
	return "string";
}

export function toVariableString(value: unknown): string {
	if (value instanceof Uint8Array) {
		throw new Error(
			"Cannot assign raw bytes to a variable; wrap with base64() or hex()",
		);
	}
	if (typeof value === "bigint" || typeof value === "number") {
		return String(value);
	}
	if (typeof value === "boolean") {
		return value ? "true" : "false";
	}
	if (value === null || value === undefined) {
		return "";
	}
	if (typeof value === "object") {
		return JSON.stringify(value);
	}
	return String(value);
}

export function toCelBindingValue(value: unknown): unknown {
	if (typeof value === "number" && Number.isFinite(value)) {
		return BigInt(Math.trunc(value));
	}
	return value;
}
