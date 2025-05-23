
import { base } from '$app/paths';
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


// TODO this is for file server problem
export function createLink(basePath: string, page?: string, restPath?: string, restMethod?: string, additionalSearch?: string): string {
  let path = ""
  if (basePath.includes("[...path]")) {
    path = basePath.replaceAll("/[...path]", "") + "/index.html#"
  } else if (basePath === "/") {
    path = basePath + "#"
  } else {
    path = basePath + "/index.html#"
  }
  if (page) {
    path += `?*page=${page}`
  }
  if (restPath || restMethod) {
    path += `&path=${restPath}&method=${restMethod}`
  }
  if (additionalSearch) {
    path += `&${additionalSearch}`
  }
  const origin = window.location.origin
  return new URL(base + path, origin).href.toString();
}

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
