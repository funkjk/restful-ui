import type { RestApiResponse } from "./apiFetch"
import type { InputRestParameters, RestfulOperation } from "./RestfulOperation"

export interface RestfulPlugin {
    doRequestPath(restfulOperation: RestfulOperation, chain: RequestPathPluginChain):string
    doInitializeRestInputParameters(restfulOperation: RestfulOperation, chain: InitializeParameterPluginChain):InputRestParameters
    doExecute(restfulOperation: RestfulOperation, chain: ExecutePluginChain, inputParameters: InputRestParameters): Promise<RestApiResponse>
    doFetch(restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<RestApiResponse>
}

export class EmptyRestfulPlugin {
    doRequestPath(restfulOperation: RestfulOperation, chain: RequestPathPluginChain):string{
        return chain.next()
    }
    doInitializeRestInputParameters(restfulOperation: RestfulOperation, chain: InitializeParameterPluginChain):InputRestParameters{
        return chain.next()
    }
    doExecute(restfulOperation: RestfulOperation, chain: ExecutePluginChain, inputParameters: InputRestParameters): Promise<RestApiResponse> {
        return chain.next(inputParameters)
    }
    doFetch(restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<RestApiResponse> {
        return chain.next(inputParameters, input, init)
    }
}

export abstract class PluginChain<T extends any[], R> {
    plugins: RestfulPlugin[]
    operation: RestfulOperation;
    originFunction: Function;
    index = 0;
    constructor(plugins: RestfulPlugin[], operation: RestfulOperation, originFunction: (...param: T) => R) {
        this.plugins = plugins
        this.operation = operation
        this.originFunction = originFunction;
    }
    next(...data: T): R {
        const arg = arguments;
        if (this.plugins.length > this.index) {
            const plugin = this.plugins[this.index]
            this.index++;
            return this.doPlugin(plugin, data)
        } else {
            return this.originFunction(...data)
        }
    }
    abstract doPlugin(plugin: RestfulPlugin, data: T): any;
}
export class RequestPathPluginChain extends PluginChain<[], string>{
    doPlugin(plugin: RestfulPlugin, data: any[]) {
        return plugin.doRequestPath(this.operation, this)
    }
}
export class InitializeParameterPluginChain extends PluginChain<[], InputRestParameters> {
    doPlugin(plugin: RestfulPlugin, data: any[]) {
        return plugin.doInitializeRestInputParameters(this.operation, this)
    }
}
export class ExecutePluginChain extends PluginChain<[InputRestParameters], Promise<RestApiResponse>> {
    async doPlugin(plugin: RestfulPlugin, data: any[]) {
        return await plugin.doExecute(this.operation, this, data[0])
    }
}
export class FetchPluginChain extends PluginChain<[InputRestParameters, RequestInfo | URL, RequestInit?], Promise<RestApiResponse>> {
    async doPlugin(plugin: RestfulPlugin, data: any[]) {
        return await plugin.doFetch(this.operation, this, data[0], data[1], data[2])
    }
}

