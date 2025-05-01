
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
const defaultEqualFn = (v1: any, v2: any) => v1 == v2
export function unique<T>(array: T[], fn?: (e1: T, e2: T) => boolean) {
  if (!fn) {
    fn = defaultEqualFn
  }
  return array.reduce((prev, value) => {
    if (prev.findIndex((v) => fn(value, v)) >= 0) {
      return prev
    } else {
      return [...prev, value]
    }
  }, [] as T[])
}

export function propsIn(target: string[], collection: string[][]) {
  for (const props of collection) {
    if (props.every((prop, index) => {
      return target[index] == prop
    })) {
      return true
    }
  }
  return false
}

export function notInProperties(target: string[][], all: string[][]): string[][] {
  const ret = []
  for (const props of all) {
    if (!propsIn(props, target)) {
      ret.push(props)
    }
  }
  return ret
}



export function isAllChildren(obj: any, fn: (e: any, propPaths: string[]) => boolean, propPaths?: string[]) {
  if (!obj || !isObject(obj)) {
    return true;
  }
  return Object.keys(obj).every(prop => {
    if (isObject(obj[prop])) {
      return isAllChildren(obj[prop], fn, [...propPaths, prop])
    } else if (fn(obj[prop], [...propPaths, prop])) {
      return true
    } else {
      return false
    }
  })
}

export function getTargetNestKeys2(
  obj: any,
  fn: (e: any, propPaths: string[]) => boolean,
  expandChild: boolean = true,
  propPaths: string[] = []): string[][] {
  if (!obj || !isObject(obj)) {
    return [];
  }
  let keys: string[][] = [];
  for (const prop of Object.keys(obj)) {
    if (isObject(obj[prop])) {
      if (!expandChild && isAllChildren(obj[prop], fn, [...propPaths, prop])) {
        keys.push([prop]);
      } else {
        const childKeys = getTargetNestKeys2(obj[prop], fn).map(e => [
          prop,
          ...e,
        ], [...propPaths, prop]);
        keys = [...keys, ...childKeys];
      }

    } else if (fn(obj[prop], [...propPaths, prop])) {
      keys.push([prop]);
    } else {
      //      keys.push[prop]
    }
  }
  return keys;
}
export const isObject = (x: unknown): x is object =>
  x !== null &&
  (typeof x === 'object' || typeof x === 'function') &&
  !Array.isArray(x);

export const isObjectArray = (x: any) => Array.isArray(x) && isObject(x[0]);


export function range(start: number, end?: number): number[] {
  const ret = []
  if (!end) {
    end = start
    start = 0
  }
  for (let i = start; i < end; i++) {
    ret.push(i)
  };
  return ret
}

export function equalsArray<T>(arr1: T[], arr2: T[], checkLength: boolean = true): boolean {
  if (checkLength && arr1.length != arr2.length) {
    return false
  } else {
    return arr1.every((val1, index) => val1 == arr2[index])
  }
}

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
