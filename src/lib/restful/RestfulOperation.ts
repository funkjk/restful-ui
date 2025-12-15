import { OpenAPIV3, type OpenAPIV2, type OpenAPI } from "openapi-types";
import { ExecutePluginChain, FetchPluginChain, InitializeParameterPluginChain, RequestPathPluginChain, type RestfulPlugin } from "./RestfulPlugin";
import { parseToApiResponse, type RestApiResponse } from "./apiFetch";
import "setimmediate";
import { defaultLogger } from "$lib/utils/logger";


export type InputRestParameters = Record<string, any>

export const methods = ["get", "post", "put", "patch", "delete"];

export class OperationParameter {
    path: string;
    method: string;
    additionalParameters: [key: string, value: string][];
    static fromUrlSearchParams(searchParams: URLSearchParams): OperationParameter {
        return new OperationParameter(
            searchParams.get("path") as string,
            searchParams.get("method") as string,
            Array.from(searchParams.entries()).filter(([key]) => !["path", "method"].includes(key)),
        )
    }
    static copy(operationParameter: OperationParameter): OperationParameter {
        return new OperationParameter(
            operationParameter.path,
            operationParameter.method,
            [...operationParameter.additionalParameters],
        )
    }
    constructor(path: string, method: string, additionalParameters: [key: string, value: string][]) {
        this.path = path;
        this.method = method;
        this.additionalParameters = additionalParameters;
    }
}

export function createRestfulOperation(searchParams: URLSearchParams | OperationParameter, document: OpenAPI.Document, plugins?: RestfulPlugin[]): RestfulOperation {
    const operationParameter = searchParams instanceof URLSearchParams ? OperationParameter.fromUrlSearchParams(searchParams) : searchParams;
    if (document.hasOwnProperty("swagger")) {
        return new RestfulOperationOasV2(operationParameter, document, plugins)
    } else {
        return new RestfulOperationOasV3(operationParameter, document, plugins)
    }
}
export abstract class RestfulOperation {
    constructor(searchParams: OperationParameter, document: OpenAPI.Document, plugins?: RestfulPlugin[]) {
        this.searchParams = searchParams
        this.document = document
        this.plugins = plugins ?? []
        this.initialize()
        this.operation = this.document.paths![this.path] as OpenAPI.Operation
    }
    plugins: RestfulPlugin[]
    searchParams: OperationParameter;
    path: string = "";
    method?: OpenAPIV3.HttpMethods;
    parameters: Record<string, string> = {}
    document: OpenAPI.Document;
    operation: OpenAPI.Operation;
    initialize() {
        this.path = this.searchParams.path
        this.method = this.searchParams.method as OpenAPIV3.HttpMethods
        this.parameters = {}
        for (const [key, value] of this.searchParams.additionalParameters) {
            this.parameters[key] = value;
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
        const searchParams = new OperationParameter(
            path, method, this.searchParams.additionalParameters)
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
    abstract getBodyTypes(): RequestBodyType[];
    abstract getBodyDefinition(type: RequestBodyType): RequestBodyDefinition | null;
    abstract getResponseSchema(statusCode: string | number): any | null;

    getPropertyDefinitions() {
        const schema = this.getResponseSchema(200);
        if (!schema) {
            defaultLogger.debug("getPropertyDefinitions: schema is null");
            return null;
        }
        
        // allOfからpropertiesをマージするヘルパー関数
        // プロパティを深くマージする（拡張情報を保持するため）
        const mergePropertiesFromAllOf = (allOfItems: any[]): Record<string, any> | null => {
            const mergedProperties: Record<string, any> = {};
            for (const item of allOfItems) {
                if (item.properties) {
                    for (const [propName, propValue] of Object.entries(item.properties)) {
                        // 既存のプロパティがある場合は、深くマージ
                        if (mergedProperties[propName] && typeof propValue === 'object' && propValue !== null && !Array.isArray(propValue)) {
                            mergedProperties[propName] = { ...mergedProperties[propName], ...propValue };
                        } else {
                            // 新しいプロパティまたは非オブジェクトの場合は、そのまま設定
                            mergedProperties[propName] = propValue;
                        }
                    }
                }
            }
            return Object.keys(mergedProperties).length > 0 ? mergedProperties : null;
        };
        
        // プロパティを深くマージするヘルパー関数
        const deepMergeProperties = (target: Record<string, any>, source: Record<string, any>): void => {
            for (const [propName, propValue] of Object.entries(source)) {
                // 既存のプロパティがある場合は、深くマージ（拡張情報を保持）
                if (target[propName] && typeof propValue === 'object' && propValue !== null && !Array.isArray(propValue) && typeof target[propName] === 'object' && target[propName] !== null && !Array.isArray(target[propName])) {
                    target[propName] = { ...target[propName], ...propValue };
                } else {
                    // 新しいプロパティまたは非オブジェクトの場合は、そのまま設定
                    target[propName] = propValue;
                }
            }
        };
        
        let targetPath: any;
        if (schema.type === 'object') {
            // propertiesとallOfの両方をマージ
            const merged: Record<string, any> = {};
            if (schema.allOf) {
                const allOfProps = mergePropertiesFromAllOf(schema.allOf);
                if (allOfProps) {
                    // 深くマージ（拡張情報を保持）
                    deepMergeProperties(merged, allOfProps);
                }
            }
            if (schema.properties) {
                // 深くマージ（拡張情報を保持）- propertiesが優先される
                deepMergeProperties(merged, schema.properties);
            }
            targetPath = Object.keys(merged).length > 0 ? merged : null;
        } else if (schema.type === 'array' && schema.items) {
            // propertiesとallOfの両方をマージ
            const merged: Record<string, any> = {};
            if (schema.items.allOf) {
                const allOfProps = mergePropertiesFromAllOf(schema.items.allOf);
                if (allOfProps) {
                    // 深くマージ（拡張情報を保持）
                    deepMergeProperties(merged, allOfProps);
                }
            }
            if (schema.items.properties) {
                // 深くマージ（拡張情報を保持）- propertiesが優先される
                deepMergeProperties(merged, schema.items.properties);
            }
            targetPath = Object.keys(merged).length > 0 ? merged : null;
        }
        
        return targetPath;
    }
    getPropertyDefinition(propertyName: string) {
        let targetPath = this.getPropertyDefinitions();
        if (targetPath && targetPath[propertyName]) {
            const propertyDef = targetPath[propertyName];
            // 配列型プロパティの場合、items自体を返す（x-restfului-linkがitemsに設定されているため）
            if (propertyDef && typeof propertyDef === 'object' && propertyDef.type === 'array' && propertyDef.items) {
                return propertyDef.items;
            }
            return propertyDef;
        }
        return null;
    }
    
    /**
     * プロパティが配列型かどうかを判定
     */
    isArrayProperty(propertyName: string): boolean {
        let targetPath = this.getPropertyDefinitions();
        if (targetPath && targetPath[propertyName]) {
            const propertyDef = targetPath[propertyName];
            return propertyDef && typeof propertyDef === 'object' && propertyDef.type === 'array';
        }
        return false;
    }
    getPropertiesWithExtension(extensionKey: string): Record<string, any> {
        const targetPath = this.getPropertyDefinitions();
        if (!targetPath) {
            return {};
        }
        const result: Record<string, any> = {};
        try {
            for (const propertyName in targetPath) {
                const propertyDef = targetPath[propertyName];
                if (propertyDef && typeof propertyDef === 'object') {
                    // 型アサーションを使用して拡張情報にアクセス
                    const extended = propertyDef as any;
                    // 配列型プロパティの場合、items内の拡張情報もチェック
                    if (extended.type === 'array' && extended.items && typeof extended.items === 'object') {
                        const itemsExtended = extended.items as any;
                        if (itemsExtended[extensionKey] !== undefined && itemsExtended[extensionKey] !== null) {
                            result[propertyName] = itemsExtended[extensionKey];
                            continue; // 配列型の場合はitems内の拡張情報を優先
                        }
                    }
                    // プロパティ自体に拡張情報がある場合
                    if (extended[extensionKey] !== undefined && extended[extensionKey] !== null) {
                        result[propertyName] = extended[extensionKey];
                    }
                }
            }
        } catch (error) {
            defaultLogger.debug(`getPropertiesWithExtension error: ${error}`);
            return {};
        }
        return result;
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
                            this.searchParams.additionalParameters.forEach(e => searchParams.append(e[0], e[1]));
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
    async execute(inputParameters: InputRestParameters, bodyType?: RequestBodyType): Promise<RestApiResponse> {
        let bodyValue = undefined;
        const requestPath = this.getRequestPath(inputParameters)
        const bodyParamName = this.getBodyValueName()
        let contentType = undefined;
        if (bodyParamName) {
            const rawBodyValue = inputParameters[bodyParamName]
            if (!bodyType) {
                bodyType = this.getBodyTypes()[0]
            }
            if (bodyType === RequestBodyType.JSON) {
                bodyValue = JSON.parse(rawBodyValue)
                contentType = RequestBodyType.JSON
            } else if (bodyType === RequestBodyType.FORM_DATA) {
                bodyValue = rawBodyValue
                contentType = RequestBodyType.FORM_DATA
            }
        }
        const input = requestPath
        const init = {
            method: this.method!.toUpperCase(),
            body: bodyValue,
            headers: contentType ? {
                "Content-Type": contentType,
            } : undefined,
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
            defaultLogger.warn("doFetch", e)
            return {
                ok: false,
                url: input as string,
                error: e
            }
        }

    }
}

export class RestfulOperationOasV2 extends RestfulOperation {
    constructor(searchParams: OperationParameter, document: OpenAPI.Document, plugins?: RestfulPlugin[]) {
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
    getBodyTypes(): RequestBodyType[] {
        // TODO
        if (this.getBodyValueName()) {
            return [RequestBodyType.JSON]
        }
        return []
    }
    getBodyDefinition(type: RequestBodyType): RequestBodyDefinition | null {
        // TODO
        return null
    }
    getResponseSchema(statusCode: string | number = 200) {
        const op = this.getOperation();
        if (!op.responses) return null;
        
        const statusKey = String(statusCode);
        const response = op.responses[statusKey] || op.responses['default'];
        if (!response) return null;
        
        if ('schema' in response && response.schema) {
            return response.schema;
        }
        
        return null;
    }
}

export class RestfulOperationOasV3 extends RestfulOperation {
    constructor(searchParams: OperationParameter, document: OpenAPI.Document, plugins?: RestfulPlugin[]) {
        super(searchParams, document, plugins);
    }
    getDocument() {
        return this.document as OpenAPIV3.Document
    }
    getBasePath(): string {
        const doc = this.getDocument()
        if (doc.servers) {
            let serverUrl = doc.servers[0].url;
            const server = doc.servers[0];
            
            // Expand server variables (e.g., {protocol}, {hostname})
            if (server.variables) {
                for (const [key, variable] of Object.entries(server.variables)) {
                    const value = variable.default || '';
                    serverUrl = serverUrl.replace(`{${key}}`, value);
                }
            }
            
            return serverUrl;
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
    getBodyTypes(): RequestBodyType[] {
        const op = this.getOperation()
        const bodyTypes: RequestBodyType[] = []
        if (op.requestBody && "content" in op.requestBody) {
            for (const content of Object.entries(op.requestBody.content)) {
                const mediaType = content[0]
                if (mediaType.includes(RequestBodyType.JSON)) {
                    bodyTypes.push(RequestBodyType.JSON)
                } else if (mediaType.includes(RequestBodyType.FORM_DATA)) {
                    bodyTypes.push(RequestBodyType.FORM_DATA)
                } else {
                    defaultLogger.debug(`unsupported media type[${mediaType}]`)
                }
            }
        }
        return bodyTypes
    }
    getBodyDefinition(type: RequestBodyType): RequestBodyDefinition | null {
        const op = this.getOperation()
        function mergeProperties(properties: Record<string, any>[]) {
            const result = {} as Record<string, any>
            for (const property of properties) {
                if ("properties" in property) {
                    for (const [name, value] of Object.entries(property.properties)) {
                        result[name] = value
                    }
                }
            }
            return result
        }
        if (op.requestBody && "content" in op.requestBody) {
            for (const content of Object.entries(op.requestBody.content)) {
                const mediaType = content[0]
                if (mediaType.includes(type)) {
                    const schema = content[1].schema ?? {}
                    if ("properties" in schema) {
                        return content[1].schema as RequestBodyDefinition
                    } else {
                        if ("allOf" in schema) {
                            const properties = mergeProperties(schema.allOf ?? [])
                            return {
                                properties,
                                required: []
                            } as RequestBodyDefinition
                        } else if ("oneOf" in schema) {
                            const properties = mergeProperties(schema.oneOf ?? [])
                            return {
                                properties,
                                required: []
                            } as RequestBodyDefinition
                        } else if ("anyOf" in schema) {
                            const properties = mergeProperties(schema.anyOf ?? [])
                            return {
                                properties,
                                required: []
                            } as RequestBodyDefinition
                        } else {
                            defaultLogger.warn("unsupported body definition", {bodyDefinition: content[1].schema})
                        }
                    }
                }
            }
        }
        return null
    }
    getOperation(): OpenAPIV3.OperationObject {
        const doc = this.getDocument()
        const operation = doc.paths[this.path]![this.method!];
        return operation!
    }
    getResponseSchema(statusCode: string | number = 200) {
        const op = this.getOperation();
        if (!op.responses) return null;
        
        const statusKey = String(statusCode);
        const response = op.responses[statusKey] || op.responses['default'];
        if (!response) return null;
        if ('content' in response && response.content) {
            const jsonContent = response.content['application/json'];
            if (jsonContent && jsonContent.schema) {
                return jsonContent.schema;
            }
        }
        
        return null;
    }
}

export enum RequestBodyType {
    FORM_DATA = "application/x-www-form-urlencoded",
    JSON = "application/json",
    // TEXT = "text/plain",
    // XML = "application/xml",
    // HTML = "text/html",
    // MULTIPART_FORM_DATA = "multipart/form-data",
}


export type RequestBodyDefinitionProperty = {
    name: string;
    type?: string;
    description?: string;
    enum?: string[];
    default?: string;
}
export type RequestBodyDefinition = {
    properties: Record<string, RequestBodyDefinitionProperty>;
    required: string[];
}