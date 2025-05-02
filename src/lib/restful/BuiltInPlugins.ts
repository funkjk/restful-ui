import { getBaseUrl } from "$lib/utils/proxy";
import type { RestApiResponse } from "./apiFetch";
import type { InputRestParameters, RestfulOperation } from "./RestfulOperation";
import { EmptyRestfulPlugin, ExecutePluginChain, FetchPluginChain } from "./RestfulPlugin";
import type { RequestSetting } from "./SvelteSupport";


// using any for Promise or reactive objecect
export type CacheBody =  CacheResponse | CacheBodyParameter | any

export interface CacheStore {
    store(type:CACHE_TYPE, key:string, value:CacheBody):void
    get(type:CACHE_TYPE, key:string): CacheBody
}

export type CacheResponse = Record<string, string>
export interface CacheBodyParameter {
    additionalParameter:Record<string, string>;
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
            await this.storeGetResponse(restfulOperation, inputParameters, response.responseBody)
        }
        return response
    }
    async storeBodyParameter(restfulOperation: RestfulOperation, inputParameters: InputRestParameters) {
        if (restfulOperation.getBodyValueName()) {
            const bodyValue = inputParameters[restfulOperation.getBodyValueName()!]
            const pathParameters = restfulOperation.getPathParameters()
            const additionalParameter = pathParameters.reduce((obj,param)=> {
                obj[param] = inputParameters[param]
                return obj
            }, {} as any)
            const cacheValue:CacheBodyParameter = {
                additionalParameter,
                bodyParameter:bodyValue
            }
            await this.cacheStore.store(CACHE_TYPE.BODY_PARAMETER, getCacheKey(CACHE_TYPE.BODY_PARAMETER , restfulOperation, inputParameters), cacheValue);
        }
    }
    async storeGetResponse(restfulOperation: RestfulOperation, inputParameters: InputRestParameters, responseBody: Record<string, string>) {
        if (restfulOperation.method == "get") {
            await this.cacheStore.store(CACHE_TYPE.GET_RESPONSE, getCacheKey(CACHE_TYPE.GET_RESPONSE,restfulOperation, inputParameters), responseBody);
        }
    }


}

export enum LOG_TYPE {
    REQUEST = "REQUEST",
    RESPONSE = "RESPONSE",
    OTHER = "OTHER",
}

export class LogMessage {
    constructor(message:any[], type:LOG_TYPE){
        this.date = new Date()
        this.messages = message
        this.type = type
    }
    date:Date;
    messages:any[];
    type:LOG_TYPE;
}
// TODO switch log headers
export class RequestLogMessage extends LogMessage {
    constructor(restfulOperation: RestfulOperation, inputParameters:InputRestParameters, init: RequestInit){
        const firstLine = `REQUEST: ${restfulOperation.method!.toUpperCase()} ${restfulOperation.getRequestPath(inputParameters)}`
        // const headers = init.headers? JSON.stringify(init.headers) : undefined
        const headers = undefined
        const body = init.body? JSON.stringify(init.body) : undefined
        const message = [firstLine, headers, body].filter(e => e)
        super(message, LOG_TYPE.REQUEST)
    }
}
export class ResponseLogMessage extends LogMessage {
    constructor(restfulOperation: RestfulOperation, inputParameters:InputRestParameters, init: RequestInit, response:RestApiResponse){
        const firstLine = `RESPONSE: ${restfulOperation.method!.toUpperCase()} ${restfulOperation.getRequestPath(inputParameters)} => ${response.status ?? 'FAILED'}`
        // const headers = init.headers? JSON.stringify(response.headers) : undefined
        const headers = undefined
        const body = response.responseBody? JSON.stringify(response.responseBody) : undefined
        const message = [firstLine, headers, body].filter(e => e)
        super(message, LOG_TYPE.RESPONSE)
    }
}

export interface MessageLogger {
    log(message:LogMessage):void
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
    createRequestMessage(restfulOperation: RestfulOperation, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit):RequestLogMessage {
		const requestMessage = new RequestLogMessage(restfulOperation, inputParameters, init!);
        return requestMessage;
    }
    createResponseMessage(restfulOperation: RestfulOperation, inputParameters: InputRestParameters, input: RequestInfo | URL, init: RequestInit, response:RestApiResponse):ResponseLogMessage {
		const responseMessage = new ResponseLogMessage(restfulOperation, inputParameters, init!, response)
        return responseMessage
    }
}


export class SetHeaderPlugin extends EmptyRestfulPlugin {
    
}

export class UseRestfulUIProxyPlugin extends EmptyRestfulPlugin {
    reqestSetting:RequestSetting
    constructor(requestSetting:RequestSetting) {
        super()
        this.reqestSetting = requestSetting
    }
    async doFetch(_restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        if (this.reqestSetting.useProxy) {
            return this.requestUsingProxy();
        } else {
            return await chain.next(inputParameters, input, init)
        }
    }
    async requestUsingProxy() : Promise<Response>{
        const url = getBaseUrl() + "/api/proxy"
        const requestBody = {
            
        }
        fetch("")
        return {} as Response
    }
    getProxyUrl() : string{
        return getBaseUrl() +  "/api/proxy";
    }
    async doProxyRequest(init:RequestInit) : Promise<Response> {
        const response = await fetch(this.getProxyUrl(), init)
        return response
    }
}
