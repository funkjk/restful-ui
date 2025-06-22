import { OpenAPIV3, type OpenAPIV2, type OpenAPI } from "openapi-types";
import { ExecutePluginChain, FetchPluginChain, InitializeParameterPluginChain, RequestPathPluginChain, type RestfulPlugin } from "./RestfulPlugin";
import { parseToApiResponse, type RestApiResponse } from "./apiFetch";


export type InputRestParameters = Record<string, any>

export const methods = ["get", "post", "put", "patch", "delete"];

export function createRestfulOperation(searchParams: URLSearchParams, document: OpenAPI.Document, plugins?: RestfulPlugin[]): RestfulOperation {
    if (document.hasOwnProperty("swagger")) {
        return new RestfulOperationOasV2(searchParams, document, plugins)
    } else {
        return new RestfulOperationOasV3(searchParams, document, plugins)
    }
}

export abstract class RestfulOperation {
    constructor(searchParams: URLSearchParams, document: OpenAPI.Document, plugins?: RestfulPlugin[]) {
        this.searchParams = searchParams
        this.document = document
        this.plugins = plugins ?? []
        this.initialize()
        this.operation = this.document.paths![this.path] as OpenAPI.Operation
    }
    plugins: RestfulPlugin[]
    searchParams: URLSearchParams;
    path: string = "";
    method?: OpenAPIV3.HttpMethods;
    parameters: Record<string, string> = {}
    document: OpenAPI.Document;
    operation: OpenAPI.Operation;
    initialize() {
        this.path = this.searchParams.get("path") as string
        this.method = this.searchParams.get("method") as OpenAPIV3.HttpMethods
        this.parameters = {}
        for (const [key, value] of this.searchParams) {
            if (!["method", "path"].includes(key)) {
                this.parameters[key] = value;
            }
        }
    }
    abstract getOperation(): OpenAPI.Operation;
    getPathItem() {
        return this.document.paths![this.path]
    }
    getInitialParameterValue(): InputRestParameters {
        return new InitializeParameterPluginChain(this.plugins, this,
            () => {
                const value: InputRestParameters = {}
                const operation = this.getOperation()
                const bodyValueName = this.getBodyValueName()
                if (bodyValueName) {
                    value[bodyValueName] = `{}`;
                }
                if (operation.parameters) {
                    for (const p of operation.parameters) {
                        const param = p as any
                        if (param.default) {
                            value[param.name] = param.default;
                        } else if (param.type == "boolean") {
                            value[param.name] = false;
                        } else if (param.in == "body") {
                        } else {
                            value[param.name] = "";
                        }
                    }
                }
                for (const key of Object.keys(this.parameters)) {
                    value[key] = this.parameters[key];
                }
                return value
            }).next();
    }
    abstract getBasePath(): string;
    getRequestPath(value: InputRestParameters): string {
        return new RequestPathPluginChain(this.plugins, this,
            () => {
                const operation = this.getOperation()
                let requestPath = this.getBasePath() + this.path
                if (operation.parameters && value) {
                    const queryStr = []
                    for (const p of operation.parameters) {
                        const param = p as any
                        if (param.in == "path" && value[param.name]) {
                            requestPath = requestPath.replaceAll(
                                `{${param.name}}`,
                                value[param.name],
                            );
                        } else if (param.in == "query" && value[param.name]) {
                            queryStr.push(param.name + "=" + value[param.name]);
                        }
                    }
                    if (queryStr.length > 0) {
                        requestPath += "?" + queryStr.join("&");
                    }
                }
                for (const key of Object.keys(this.parameters)) {
                    requestPath = requestPath.replaceAll(
                        `{${key}}`,
                        this.parameters[key],
                    );
                }
                return requestPath
            }).next()
    }
    copy(path: string, method: string) {
        const searchParams = new URLSearchParams()
        this.searchParams.forEach(e => searchParams.append(e[0], e[1]));
        searchParams.append("path", path)
        searchParams.append("method", method)
        return createRestfulOperation(searchParams, this.document, this.plugins)
    }
    exist(): boolean {
        const doc = this.document as any
        return doc.paths && doc.paths[this.path] && doc.paths[this.path][this.method!]
    }
    getPathParameters(): string[] {
        const pathParameters: string[] = []
        const operation = this.getOperation()
        if (operation.parameters) {
            for (const p of operation.parameters) {
                const param = p as any
                if (param.in == "path") {
                    pathParameters.push(param.name)
                }
            }
        }
        return pathParameters
    }
    getAdditionalParameters(path?: string): string {
        const targetPath = path ?? this.path
        const pathParameter = this.parameters;
        const additionalParamter = Object.keys(pathParameter)
            .filter((e) => targetPath!.includes(`{${e}}`))
            .map((e) => `${e}=${pathParameter[e]}`)
            .join("&");
        return additionalParamter
    }
    getBodyValueName(): string | null {
        const operation = this.getOperation()
        if (operation.parameters) {
            for (const p of operation.parameters) {
                const param = p as any;
                if (param.in == "body") {
                    return param.name;
                }
            }
        }
        return null

    }
    getPathParameterUnderTargetPath() {
        const doc = this.document
        const parameters: string[] = []
        for (const p in doc?.paths) {
            if (p.startsWith(this.path)) {
                const underPath = p.substring(this.path.length)
                if (underPath.includes("{")) {
                    const parameter = underPath.substring(underPath.indexOf("{") + 1, underPath.indexOf("}"))
                    parameters.push(parameter)
                }
            }
        }
        return parameters
    }
    getUnderOperations(pathParameterName?: string): RestfulOperation[] {
        const returnOperations: RestfulOperation[] = []
        const paths = this.document.paths! as any;
        for (const p of Object.keys(paths)) {
            if (p.startsWith(this.path)) {
                // pathParameterName is not specified or pathParameterName specified and match with path
                if (!pathParameterName || p.includes(`{${pathParameterName}}`)) {
                    for (const m of methods) {
                        // exists path
                        if (paths[p] && paths[p][m]) {
                            const searchParams = new URLSearchParams()
                            this.searchParams.forEach(e => searchParams.append(e[0], e[1]));
                            searchParams.append("path", p)
                            searchParams.append("method", m)
                            returnOperations.push(this.copy(p, m))
                        }
                    }
                }
            }
        }
        return returnOperations
    }
    async execute(inputParameters: InputRestParameters): Promise<RestApiResponse> {
        let bodyValue = undefined;
        const requestPath = this.getRequestPath(inputParameters)
        const bodyParamName = this.getBodyValueName()
        if (bodyParamName) {
            bodyValue = inputParameters[bodyParamName]
        }
        const input = requestPath
        const init = {
            method: this.method!.toUpperCase(),
            body: bodyValue ? JSON.parse(bodyValue) : undefined,
        }
        return await new ExecutePluginChain(this.plugins, this, async (inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit) => {
            const response = await this.doFetch(inputParameters, input, init)
            return response
        }).next(inputParameters, input, init);
    }
    async doFetch(inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit): Promise<RestApiResponse> {
        const fetchChaing = new FetchPluginChain(this.plugins, this, async (_inputParameters: InputRestParameters, input: RequestInfo | URL, init?: RequestInit) => {
            if (init?.body && typeof init.body === "object") {
                init.body = JSON.stringify(init.body)
            }
            return await fetch(input, init);
        })
        try {
            const response = await fetchChaing.next(inputParameters, input, init);
            return parseToApiResponse(response)
        } catch (e) {
            return {
                ok: false,
                url: input as string,
                error: e
            }
        }

    }
}

export class RestfulOperationOasV2 extends RestfulOperation {
    constructor(searchParams: URLSearchParams, document: OpenAPI.Document, plugins?: RestfulPlugin[]) {
        super(searchParams, document, plugins);
    }
    getDocument() {
        return this.document as OpenAPIV2.Document
    }
    getBasePath(): string {
        const doc = this.getDocument()
        if (doc.schemes) {
            return `${doc.schemes[0]}://${doc.host}:${doc.basePath}`
        } else {
            return `${doc.basePath}`
        }
    }
    getOperation(): OpenAPIV2.OperationObject {
        const doc = this.getDocument()
        const method = this.method as OpenAPIV2.HttpMethods
        const operation = doc.paths[this.path][method];
        return operation!
    }
}

export class RestfulOperationOasV3 extends RestfulOperation {
    constructor(searchParams: URLSearchParams, document: OpenAPI.Document, plugins?: RestfulPlugin[]) {
        super(searchParams, document, plugins);
    }
    getDocument() {
        return this.document as OpenAPIV3.Document
    }
    getBasePath(): string {
        const doc = this.getDocument()
        if (doc.servers) {
            return `${doc.servers[0].url}`
        } else {
            return ""
        }
    }
    getBodyValueName(): string | null {
        const op = this.getOperation()
        if (op.requestBody) {
            return "requestBody"
        }
        else {
            return null;
        }
    }
    getOperation(): OpenAPIV3.OperationObject {
        const doc = this.getDocument()
        const operation = doc.paths[this.path]![this.method!];
        return operation!
    }
}