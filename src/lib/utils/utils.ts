
export function getTargetNestKeys(obj: any, fn: (e: any) => boolean): string[] {
  if (!obj || !isObject(obj)) {
    return [];
  }
  let keys: string[] = [];
  for (const prop of Object.keys(obj)) {
    if (fn(obj[prop])) {
      keys.push(prop);
    } else if (isObject(obj[prop])) {
      const childKeys = getTargetNestKeys(obj[prop], fn).map(
        e => prop + '.' + e
      );
      keys = [...keys, ...childKeys];
    }
  }
  return keys;
}

export const isObject = (x: unknown): x is object =>
  x !== null &&
  (typeof x === 'object' || typeof x === 'function') &&
  !Array.isArray(x);

export const isObjectArray = (x: any) => Array.isArray(x) && isObject(x[0]);

export function createRawStringSwaggerParserResolver(raw: string) {

  const myResolver = {
    order: 1,
    canRead: /^static:/i,
    read(): string {
      return raw;
    },
  };
  return myResolver
}
