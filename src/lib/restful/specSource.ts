export type SpecSourceKind = "url" | "raw";

export type SpecSource =
	| { kind: "url"; url: string }
	| { kind: "raw"; text: string; label: string };

export type SpecSourceTab = "url" | "paste" | "file";

export const PASTED_SPEC_LABEL = "pasted spec";
export const MAX_RAW_SPEC_BYTES = 2 * 1024 * 1024;
export const ALLOWED_SPEC_EXTENSIONS = [".json", ".yaml", ".yml"] as const;

export type SpecSourceError =
	| "Spec is empty"
	| "File type not allowed"
	| "Spec exceeds 2MB";

export function createUrlSpecSource(url: string): SpecSource | SpecSourceError {
	const trimmed = url.trim();
	if (!trimmed) {
		return "Spec is empty";
	}
	return { kind: "url", url: trimmed };
}

export function createRawSpecSource(
	text: string,
	label: string,
): SpecSource | SpecSourceError {
	if (!text.trim()) {
		return "Spec is empty";
	}
	if (byteLength(text) > MAX_RAW_SPEC_BYTES) {
		return "Spec exceeds 2MB";
	}
	return {
		kind: "raw",
		text,
		label: label.trim() || PASTED_SPEC_LABEL,
	};
}

export function isAllowedSpecFileName(fileName: string): boolean {
	const lower = fileName.toLowerCase();
	return ALLOWED_SPEC_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function validateSpecFile(file: {
	name: string;
	size: number;
}): SpecSourceError | null {
	if (!isAllowedSpecFileName(file.name)) {
		return "File type not allowed";
	}
	if (file.size > MAX_RAW_SPEC_BYTES) {
		return "Spec exceeds 2MB";
	}
	return null;
}

export function isSpecSourceError(
	value: SpecSource | SpecSourceError,
): value is SpecSourceError {
	return typeof value === "string";
}

function byteLength(text: string): number {
	return new TextEncoder().encode(text).length;
}
