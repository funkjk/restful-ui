import type { RestApiResponse } from "./apiFetch"
import type { InputRestParameters, RestfulOperation } from "./RestfulOperation"

export interface RestfulPlugin {
    doRequestPath(restfulOperation: RestfulOperation, chain: RequestPathPluginChain):string
    doInitializeRestInputParameters(restfulOperation: RestfulOperation, chain: InitializeParameterPluginChain):InputRestParameters
    doExecute(restfulOperation: RestfulOperation, chain: ExecutePluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<RestApiResponse>
    doFetch(restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<Response>
}

export class EmptyRestfulPlugin {
    doRequestPath(_restfulOperation: RestfulOperation, chain: RequestPathPluginChain):string{
        return chain.next()
    }
    doInitializeRestInputParameters(_restfulOperation: RestfulOperation, chain: InitializeParameterPluginChain):InputRestParameters{
        return chain.next()
    }
    doExecute(_restfulOperation: RestfulOperation, chain: ExecutePluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<RestApiResponse> {
        return chain.next(inputParameters, input, init)
    }
    doFetch(_restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        return chain.next(inputParameters, input, init)
    }
}

export abstract class PluginChain<T extends any[], R> {
    plugins: RestfulPlugin[]
    operation: RestfulOperation;
    originFunction: (...param: T) => R;
    index = 0;
    constructor(plugins: RestfulPlugin[], operation: RestfulOperation, originFunction: (...param: T) => R) {
        this.plugins = plugins
        this.operation = operation
        this.originFunction = originFunction;
    }
    next(...data: T): R {
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
    doPlugin(plugin: RestfulPlugin) {
        return plugin.doRequestPath(this.operation, this)
    }
}
export class InitializeParameterPluginChain extends PluginChain<[], InputRestParameters> {
    doPlugin(plugin: RestfulPlugin) {
        return plugin.doInitializeRestInputParameters(this.operation, this)
    }
}
export class ExecutePluginChain extends PluginChain<[InputRestParameters, RequestInfo | URL, RequestInit?], Promise<RestApiResponse>> {
    async doPlugin(plugin: RestfulPlugin, data: any[]) {
        return await plugin.doExecute(this.operation, this, data[0], data[1], data[2])
    }
}
export class FetchPluginChain extends PluginChain<[InputRestParameters, RequestInfo | URL, RequestInit?], Promise<Response>> {
    async doPlugin(plugin: RestfulPlugin, data: any[]) {
        return await plugin.doFetch(this.operation, this, data[0], data[1], data[2])
    }
}

