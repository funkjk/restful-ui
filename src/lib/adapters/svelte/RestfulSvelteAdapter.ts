import { get, type Writable } from "svelte/store";
import { swPersisted } from "$lib/stores/sw-persisted-store";
import { CACHE_TYPE, compareBodyParameter, type CacheBody, type CacheBodyParameter, type CacheStore, type RequestSetting } from "$lib/restful/BuiltInPlugins";
import { AbstractRequestSettingApplyPlugin, UseRestfulUIProxyPlugin } from "$lib/restful/BuiltInPlugins";
import { EmptyRestfulPlugin, FetchPluginChain, type RestfulPlugin } from "$lib/restful/RestfulPlugin";
import type { InputRestParameters, RestfulOperation } from "$lib/restful/RestfulOperation";
import { getDefaultProxyBaseUrl, resolveProxyBaseUrl } from "$lib/utils/proxy";
import type { RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
import { RuningMode, DefaultLinkSupport } from "$lib/restful/RestfulInterfaces";
import { getAppBasePath } from "$lib/utils/app-base";
import { persisted } from "svelte-persisted-store";

function uniqueArray<T>(arr: T[], fn: (a1: T, a2: T) => boolean) {
    return arr.filter(
        (elem, index, self) => self.findIndex(e => fn(e, elem)) === index)
}

export class SvelteCacheStore implements CacheStore {
    constructor(responses: Writable<any>, bodyParameterHstories: Writable<any>) {
        this.responses = responses
        this.bodyParameterHstories = bodyParameterHstories
    }
    responses: Writable<any>
    bodyParameterHstories: Writable<any>
    store(type: CACHE_TYPE, key: string, value: any): void {
        if (type == CACHE_TYPE.BODY_PARAMETER) {
            this.bodyParameterHstories.update(store => {
                let newHistories: CacheBodyParameter[] = store[key] ?? []
                // add to first
                newHistories = [value, ...newHistories]
                // unique and has max 10 histories
                newHistories = uniqueArray(newHistories, compareBodyParameter)
                store[key] = newHistories
                return store
            })
        } else if (type == CACHE_TYPE.GET_RESPONSE) {
            this.responses.update((store) => {
                store[key] = value;
                return store;
            });
        }
    }
    get(type: CACHE_TYPE, key: string): CacheBody {
        if (type == CACHE_TYPE.BODY_PARAMETER) {
            return get(this.bodyParameterHstories)[key]
        } else if (type == CACHE_TYPE.GET_RESPONSE) {
            return get(this.responses)[key]
        } else {
            throw new Error("Unkwon type " + type)
        }
    }
}

export class SetRequestPlugin extends AbstractRequestSettingApplyPlugin {
    constructor(requestSetting: Writable<RequestSetting>) {
        super()
        this.requestSetting = requestSetting
    }
    requestSetting: Writable<RequestSetting>;
    getRequestSetting(): RequestSetting {
        return get(this.requestSetting)
    }
}

export class SetLoadingPlugin extends EmptyRestfulPlugin {
    constructor(loading: Writable<boolean>) {
        super()
        this.loading = loading
    }
    loading: Writable<boolean>;
    async doFetch(_restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        try {
            this.loading.set(true)
            const response = await chain.next(inputParameters, input, init)
            return response
        } finally {
            this.loading.set(false)
        }
    }
}

export class SvelteRestfulProxy extends UseRestfulUIProxyPlugin {
    constructor(requestSetting: Writable<RequestSetting>) {
        super()
        this.requestSetting = requestSetting
    }
    requestSetting: Writable<RequestSetting>;
    getProxyUrl(): string {
        return resolveProxyBaseUrl(get(this.requestSetting).proxyBaseUrl);
    }
    async doFetch(_restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        if (get(this.requestSetting).useProxy) {
            return this.requestUsingProxy(input, init);
        } else {
            const response = await chain.next(inputParameters, input, init)
            return response
        }
    }
}

export function createRestfulComponentConfig(storageKey: string, baseConfig?: Partial<RestfulComponentConfig>): RestfulComponentConfig {
    // response may be too big, so use ServiceWorker
    const responses = baseConfig?.storage?.responses ?? swPersisted(
        storageKey + "-responses",
        {} as any
    );
    const parameterHistories = baseConfig?.storage?.parameterHistories ?? persisted(
        storageKey + "-parameter-histories",
        {} as any,
        { storage: "session" },
    );
    const selectedTableKeys = baseConfig?.storage?.selectedTableKeys ?? persisted(
        storageKey + "-table-key",
        {} as any,
        { storage: "session" },
    );
    const dataTableFilters = baseConfig?.storage?.dataTableFilters ?? persisted(
        storageKey + "-datatable-filter",
        {} as any,
        { storage: "session" },
    );
    const dataTableSelectedColumn = baseConfig?.storage?.dataTableSelectedColumn ?? persisted(
        storageKey + "-datatable-selected",
        {} as any,
        { storage: "session" },
    );
    const dataTableDisplayTypes = baseConfig?.storage?.dataTableDisplayTypes ?? persisted(
        storageKey + "-datatable-displayTypes",
        {} as any,
        { storage: "session" },
    );
    const requestSetting = baseConfig?.storage?.requestSetting ?? persisted(
        storageKey + "-request-setting",
        {
            headers: [],
            useProxy: false,
            proxyBaseUrl: getDefaultProxyBaseUrl(),
        } as RequestSetting,
        { storage: "session" },
    );
    return {
        ...baseConfig,
        storage: {
            ...baseConfig?.storage,
            responses,
            parameterHistories,
            dataTableFilters,
            dataTableSelectedColumn,
            dataTableDisplayTypes,
            selectedTableKeys,
            requestSetting,
        },
        additionalPlugins: [
            new SetRequestPlugin(requestSetting),
            new SvelteRestfulProxy(requestSetting),
        ] as RestfulPlugin[],
        displaySupport: baseConfig?.displaySupport ?? { getArrayResponse: (restfulOperation, responseBody) => Array.isArray(responseBody) ? responseBody : null },
        linkSupport: baseConfig?.linkSupport ?? new DefaultLinkSupport(getAppBasePath()),
        runningMode: baseConfig?.runningMode ?? RuningMode.SESSION_STORAGE
    }
} 