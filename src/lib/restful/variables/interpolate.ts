const PLACEHOLDER = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/**
 * Replace ${name} placeholders using a variable table.
 * Undefined names throw (fail closed).
 */
export function interpolate(
	template: string,
	variables: Record<string, string>,
): string {
	return template.replace(PLACEHOLDER, (_match, name: string) => {
		if (!(name in variables)) {
			throw new Error(`Unknown variable in template: \${${name}}`);
		}
		return variables[name];
	});
}

export function interpolateHeaders(
	headers: Record<string, string>,
	variables: Record<string, string>,
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers)) {
		out[key] = interpolate(value, variables);
	}
	return out;
}
