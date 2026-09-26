import type { VariableEntry } from "$lib/types/request-config";
import {
	celTypeOf,
	createVariablesEnvironment,
	defaultVariableEvalDeps,
	toCelBindingValue,
	toVariableString,
	type VariableEvalDeps,
} from "./celEnvironment";

export interface RequestContext {
	method: string;
	path: string;
	body: string;
}

export async function evaluateEntries(
	entries: VariableEntry[] | undefined,
	request: RequestContext,
	deps: VariableEvalDeps = defaultVariableEvalDeps,
): Promise<Record<string, string>> {
	const result: Record<string, string> = {};
	if (!entries?.length) {
		return result;
	}

	let env = createVariablesEnvironment(deps);
	const bindings: Record<string, unknown> = {
		request: {
			method: request.method,
			path: request.path,
			body: request.body,
		},
	};

	for (const entry of entries) {
		const name = entry.name?.trim();
		if (!name) {
			continue;
		}
		const expression = entry.expression?.trim() ?? "";
		if (!expression) {
			throw new Error(`Variable "${name}" has an empty expression`);
		}

		const raw = await env.evaluate(expression, bindings);
		const value = toCelBindingValue(raw);
		if (value instanceof Uint8Array) {
			throw new Error(
				`Variable "${name}" resolved to bytes; wrap with base64() or hex()`,
			);
		}

		bindings[name] = value;
		result[name] = toVariableString(value);
		env = env.clone().registerVariable(name, celTypeOf(value));
	}

	return result;
}
