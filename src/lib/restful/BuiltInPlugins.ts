import { defaultLogger } from "$lib/utils/logger";
import { buildProxyRequestUrl } from "$lib/utils/proxy";
import type { RestApiResponse } from "./apiFetch";
import type { InputRestParameters, RestfulOperation } from "./RestfulOperation";
import { EmptyRestfulPlugin, ExecutePluginChain, FetchPluginChain, RequestPathPluginChain } from "./RestfulPlugin";


// using any for Promise or reactive objecect
export type CacheBody = CacheResponse | CacheBodyParameter | any

export interface CacheStore {
    store(type: CACHE_TYPE, key: string, value: CacheBody): void
    get(type: CACHE_TYPE, key: string): CacheBody
}

export type CacheResponse = Record<string, string>
export interface CacheBodyParameter {
    additionalParameter: Record<string, string>;
    bodyParameter: InputRestParameters;
}

export function compareBodyParameter(a1: CacheBodyParameter, a2: CacheBodyParameter) {
    const a1Value = Object.values(a1).join(",") + a1.bodyParameter
    const a2Value = Object.values(a2).join(",") + a2.bodyParameter
    return a1Value == a2Value
}

export enum CACHE_TYPE {
    GET_RESPONSE = "GET_RESPONSE",
    BODY_PARAMETER = "BODY_PARAMETER"
}
export interface CachedGetResponse {
    response: any,
    executionTime: string
}

export function getCacheKey(keyType: CACHE_TYPE, restfulOperation: RestfulOperation, inputParameters?: InputRestParameters) {
    if (keyType == CACHE_TYPE.GET_RESPONSE) {
        const key = restfulOperation.getRequestPath(inputParameters!)
        return key;
    } else if (keyType == CACHE_TYPE.BODY_PARAMETER) {
        const key = `${restfulOperation.method}:${restfulOperation.path}}`;
        return key;
    }
    return ""

}

export class CachedRestfulPlugin extends EmptyRestfulPlugin {
    constructor(cacheStore: CacheStore) {
        super()
        this.cacheStore = cacheStore
    }
    cacheStore: CacheStore;

    async doExecute(restfulOperation: RestfulOperation, chain: ExecutePluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit) {
        const response = await chain.next(inputParameters, input, init)
        if (response.ok) {
            await this.storeBodyParameter(restfulOperation, inputParameters)
        }
        return response
    }
    async storeBodyParameter(restfulOperation: RestfulOperation, inputParameters: InputRestParameters) {
        if (restfulOperation.getBodyValueName()) {
            const bodyValue = inputParameters[restfulOperation.getBodyValueName()!]
            const pathParameters = restfulOperation.getPathParameters()
            const additionalParameter = pathParameters.reduce((obj, param) => {
                obj[param] = inputParameters[param]
                return obj
            }, {} as any)
            const cacheValue: CacheBodyParameter = {
                additionalParameter,
                bodyParameter: bodyValue
            }
            await this.cacheStore.store(CACHE_TYPE.BODY_PARAMETER, getCacheKey(CACHE_TYPE.BODY_PARAMETER, restfulOperation, inputParameters), cacheValue);
        }
    }
}

export enum LOG_TYPE {
    REQUEST = "REQUEST",
    RESPONSE = "RESPONSE",
    OTHER = "OTHER",
}

export class LogMessage {
    constructor(message: any[], type: LOG_TYPE) {
        this.date = new Date()
        this.messages = message
        this.type = type
    }
    date: Date;
    messages: any[];
    type: LOG_TYPE;
}
// TODO switch log headers
export class RequestLogMessage extends LogMessage {
    constructor(restfulOperation: RestfulOperation, inputParameters: InputRestParameters, init: RequestInit) {
        const firstLine = `REQUEST: ${restfulOperation.method!.toUpperCase()} ${restfulOperation.getRequestPath(inputParameters)}`
        // const headers = init.headers? JSON.stringify(init.headers) : undefined
        const headers = undefined
        const body = init.body ? JSON.stringify(init.body) : undefined
        const message = [firstLine, headers, body].filter(e => e)
        super(message, LOG_TYPE.REQUEST)
    }
}
export class ResponseLogMessage extends LogMessage {
    constructor(restfulOperation: RestfulOperation, inputParameters: InputRestParameters, init: RequestInit, response: RestApiResponse) {
        const firstLine = `RESPONSE: ${restfulOperation.method!.toUpperCase()} ${restfulOperation.getRequestPath(inputParameters)} => ${response.status ?? 'FAILED'}`
        // const headers = init.headers? JSON.stringify(response.headers) : undefined
        const headers = undefined
        const body = response.responseBody ? JSON.stringify(response.responseBody) : undefined
        const message = [firstLine, headers, body].filter(e => e)
        super(message, LOG_TYPE.RESPONSE)
    }
}

export interface MessageLogger {
    log(message: LogMessage): void
}

export class ConsoleMessageLogger implements MessageLogger {
    log(message: LogMessage): void {
        defaultLogger.info(message)
    }
}

export class LoggingRestfulPlugin extends EmptyRestfulPlugin {
    constructor(logger: MessageLogger) {
        super()
        this.logger = logger
    }
    logger: MessageLogger;

    async doExecute(restfulOperation: RestfulOperation, chain: ExecutePluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit) {
        const requestMessage = this.createRequestMessage(restfulOperation, inputParameters, input, init)
        this.logger.log(requestMessage)
        const response = await chain.next(inputParameters, input, init)
        const responseMessage = this.createResponseMessage(restfulOperation, inputParameters, input, init ?? {}, response)
        this.logger.log(responseMessage)
        return response
    }
    createRequestMessage(restfulOperation: RestfulOperation, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): RequestLogMessage {
        const requestMessage = new RequestLogMessage(restfulOperation, inputParameters, init!);
        return requestMessage;
    }
    createResponseMessage(restfulOperation: RestfulOperation, inputParameters: InputRestParameters, input: RequestInfo | URL, init: RequestInit, response: RestApiResponse): ResponseLogMessage {
        const responseMessage = new ResponseLogMessage(restfulOperation, inputParameters, init!, response)
        return responseMessage
    }
}


export class SetHeaderPlugin extends EmptyRestfulPlugin {

}

export abstract class UseRestfulUIProxyPlugin extends EmptyRestfulPlugin {
    async doFetch(_restfulOperation: RestfulOperation, _chain: FetchPluginChain, _inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        return this.requestUsingProxy(input, init);
    }
    async requestUsingProxy(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const targetUrl = input.toString();
        const proxyUrl = buildProxyRequestUrl(this.getProxyUrl(), targetUrl);
        return fetch(proxyUrl, {
            method: init?.method ?? 'GET',
            headers: init?.headers,
            body: init?.body,
        });
    }
    abstract getProxyUrl(): string;
}
export interface RequestSetting {
    headers: { name: string, value: string }[],
    additionalQueryParameter?: string,
    basePath?: string,
    useProxy: boolean,
}

export abstract class AbstractRequestSettingApplyPlugin extends EmptyRestfulPlugin {
    abstract getRequestSetting():RequestSetting
    doRequestPath(restfulOperation: RestfulOperation, chain: RequestPathPluginChain): string {
        const setting = this.getRequestSetting()
        let requestPath = chain.next()
        if (setting.basePath) {
            const basePath = restfulOperation.getBasePath()
            // Replace basePath if it exists at the start of the requestPath
            if (requestPath.startsWith(basePath)) {
                requestPath = setting.basePath + requestPath.substring(basePath.length)
            }
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

    doExecute(_restfulOperation: RestfulOperation, chain: ExecutePluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<RestApiResponse> {
        const setting = this.getRequestSetting()
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