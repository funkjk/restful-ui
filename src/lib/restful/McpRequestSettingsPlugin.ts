import { get, type Writable } from "svelte/store";
import { EmptyRestfulPlugin, ExecutePluginChain, FetchPluginChain, RequestPathPluginChain } from "./RestfulPlugin";
import type { InputRestParameters, RestfulOperation } from "./RestfulOperation";
import type { RestApiResponse } from "./apiFetch";
import type { RequestSettings } from "$lib/types/request-config";
import { UseRestfulUIProxyPlugin } from "./BuiltInPlugins";

/**
 * MCPサーバー設定をAPI実行時に適用するプラグイン
 */
export class McpRequestSettingsPlugin extends EmptyRestfulPlugin {
  constructor(requestSettings: Writable<RequestSettings>) {
    super();
    this.requestSettings = requestSettings;
  }

  requestSettings: Writable<RequestSettings>;


  doExecute(
    _restfulOperation: RestfulOperation,
    chain: ExecutePluginChain,
    inputParameters: InputRestParameters,
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<RestApiResponse> {
    const settings = get(this.requestSettings);
    const nextInit = init ?? {};

    // Headers の適用
    if (settings.headers && settings.headers.length > 0) {
      const additionalHeaders: Record<string, string> = {};
      for (const header of settings.headers) {
        if (header.name && header.value) {
          additionalHeaders[header.name] = header.value;
        }
      }
      nextInit.headers = { ...nextInit.headers, ...additionalHeaders };
    }
    if (nextInit.body && typeof nextInit.body === "object") {
      nextInit.headers = { ...nextInit.headers, ...{ "Content-Type": "application/json" } };
    }

    return chain.next(inputParameters, input, nextInit);
  }
}

/**
 * MCPサーバー設定のProxyを適用するプラグイン
 */
export class McpProxyPlugin extends UseRestfulUIProxyPlugin {
  constructor(requestSettings: Writable<RequestSettings>) {
    super();
    this.requestSettings = requestSettings;
  }

  requestSettings: Writable<RequestSettings>;

  getProxyUrl(): string {
    throw new Error("Proxy URL is not implemented");
  }

  async doFetch(
    _restfulOperation: RestfulOperation,
    chain: FetchPluginChain,
    inputParameters: InputRestParameters,
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const settings = get(this.requestSettings);

    if (settings.useProxy) {
      return this.requestUsingProxy(input, init);
    } else {
      return chain.next(inputParameters, input, init);
    }
  }
}

/**
 * MCPサーバー設定をRestfulOperationで使用するためのヘルパー
 */
export function createMcpRequestPlugins(
  requestSettings: Writable<RequestSettings>
): [McpRequestSettingsPlugin, McpProxyPlugin] {
  return [
    new McpRequestSettingsPlugin(requestSettings),
    new McpProxyPlugin(requestSettings)
  ];
} 