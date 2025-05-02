import { get, type Writable } from "svelte/store";
import { CACHE_TYPE, compareBodyParameter, type CacheBody, type CacheBodyParameter, type CacheStore } from "./BuiltInPlugins";
import { EmptyRestfulPlugin, FetchPluginChain, RequestPathPluginChain, type RestfulPlugin } from "./RestfulPlugin";
import type { InputRestParameters, RestfulOperation } from "./RestfulOperation";
import type { RestApiResponse } from "./apiFetch";

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
export interface RequestSetting {
    headers: any,
    additionalQueryParameter?: string,
    basePath?: string,
    useProxy: boolean,
}

export class SetRequestPlugin extends EmptyRestfulPlugin {
    constructor(requestSetting: Writable<RequestSetting>) {
        super()
        this.requestSetting = requestSetting
    }
    requestSetting: Writable<RequestSetting>;
    doRequestPath(restfulOperation: RestfulOperation, chain: RequestPathPluginChain): string {
        const setting = get(this.requestSetting)
        let requestPath = chain.next()
        if (setting.basePath) {
            const basePath = restfulOperation.getBasePath()
            requestPath = requestPath.replace(basePath, setting.basePath)
        }
        if (setting.additionalQueryParameter) {
            if (requestPath.includes("?")) {
                requestPath += "&" + setting.additionalQueryParameter
            } else {
                requestPath += "?" + setting.additionalQueryParameter
            }
        }
        return requestPath
    }

    doFetch(_restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<RestApiResponse> {
        const setting = get(this.requestSetting)
        const nextInit = init ?? {}
        if (setting.headers) {
            const additionalHeaders: any = {}
            for (const header of setting.headers) {
                additionalHeaders[header.name] = header.value
            }
            nextInit.headers = { ...nextInit.headers, ...additionalHeaders }
        }
        return chain.next(inputParameters, input, nextInit)
    }
}
export class SetLoadingPlugin extends EmptyRestfulPlugin {
    constructor(loading: Writable<boolean>) {
        super()
        this.loading = loading
    }
    loading: Writable<boolean>;
    async doFetch(restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<RestApiResponse> {
        try {
            this.loading.set(true)
            const response = await chain.next(inputParameters, input, init)
            return response
        } finally {
            this.loading.set(false)
        }
    }
}

export interface RestfulDisplaySupport {
    getArrayResponse(restfulOperation: RestfulOperation, responseBody: Record<string, any>): Record<string, any>[] | null
}
// TODO remove it
export const DefaultDisplaySupport: RestfulDisplaySupport = {
    getArrayResponse(restfulOperation: RestfulOperation, responseBody: Record<string, any>): Record<string, any>[] | null {
        if (Array.isArray(responseBody)) {
            return responseBody
        } else {
            return null
        }
    }
}

export interface RestfulComponentConfig {
    documentUrl?: string;
    documentRaw?: string;
    storage: {
        responses: Writable<any>;
        parameterHistories: Writable<any>;
        dataTableFilters: Writable<any>;
        dataTableSelectedColumn: Writable<any>;
        selectedTableKeys: Writable<any>;
        requestSetting: Writable<RequestSetting>;
    }
    additionalPlugins: RestfulPlugin[];
    displaySupport: RestfulDisplaySupport;
}

