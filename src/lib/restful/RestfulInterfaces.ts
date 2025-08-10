import type { RestfulOperation } from "./RestfulOperation";
import type { RestfulPlugin } from "./RestfulPlugin";
import type { ServerConfig } from "./config-server/ServerSupport";

export interface RestfulDisplaySupport {
    getArrayResponse(restfulOperation: RestfulOperation, responseBody: Record<string, any>): Record<string, any>[] | null
}

export const DefaultDisplaySupport: RestfulDisplaySupport = {
    getArrayResponse(_restfulOperation: RestfulOperation, responseBody: Record<string, any>): Record<string, any>[] | null {
        if (Array.isArray(responseBody)) {
            return responseBody
        } else {
            return null
        }
    }
}

export enum RuningMode {
    SESSION_STORAGE = "session-storage",
    LOAD_CONFIG = "load-config"
}

export interface RestfulComponentConfig {
    documentUrl?: string;
    documentRaw?: string;
    storage: {
        responses: any;
        parameterHistories: any;
        dataTableFilters: any;
        dataTableSelectedColumn: any;
        dataTableDisplayTypes: any;
        selectedTableKeys: any;
        requestSetting: any;
    }
    additionalPlugins: RestfulPlugin[];
    displaySupport: RestfulDisplaySupport;
    linkSupport: LinkSupport;
    runningMode: RuningMode;
}

export interface ConfigLoaderComponentConfig extends RestfulComponentConfig {
    runningMode: RuningMode.LOAD_CONFIG;
    configurationId: string;
    config: ServerConfig;
}

export type LinkParameter = {
    basePath?: string
    page?: string
    restPath?: string
    restMethod?: string
    additionalSearch?: string
}

export interface LinkSupport {
    createBasePath(parameter: LinkParameter): string
    createQuery(parameter: LinkParameter): string
    createLink(parameter: LinkParameter): string
}

export class DefaultLinkSupport implements LinkSupport {
    basePath: string
    constructor(basePath: string) {
        this.basePath = basePath
    }
    createBasePath(_parameter: LinkParameter) {
        const basePath = _parameter.basePath ?? this.basePath
        return basePath + "#"
    }
    createQuery(parameter: LinkParameter) {
        let query = ""
        if (parameter.page) {
            query += `?*page=${parameter.page}`
        } else {
            query += "?*page=top"
        }
        if (parameter.restPath || parameter.restMethod) {
            query += `&path=${parameter.restPath}&method=${parameter.restMethod}`
        }
        if (parameter.additionalSearch) {
            query += `&${parameter.additionalSearch}`
        }
        return query
    }
    createLink(parameter: LinkParameter) {
        const basePath = this.createBasePath(parameter)  
        const query = this.createQuery(parameter)
        return new URL(basePath + query, window.location.origin).href.toString();
    }
} 