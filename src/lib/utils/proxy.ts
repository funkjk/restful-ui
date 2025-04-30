
import { page } from '$app/stores';
import { get } from 'svelte/store';
export function createProxyUrl(
  urlstring: string
): string {
  let baseUrl = get(page).url.origin + get(page).url.pathname
  baseUrl = baseUrl.substring(0, baseUrl.length - get(page).route.id!.length);
  if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
  }
  const url = new URL(urlstring);
  if (url.port) {
      return (`${baseUrl}api/proxy/${url.protocol}/${url.hostname}:${url.port}${url.pathname}`);
  } else {
      return (`${baseUrl}api/proxy/${url.protocol}/${url.hostname}${url.pathname}`);
  }
}