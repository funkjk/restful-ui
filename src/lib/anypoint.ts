import { get, writable } from 'svelte/store';
import { settings } from "./stores/settings";
import { loading, logMessages, notifyMessage } from "./stores/ui";
import { EmptyRestfulPlugin, FetchPluginChain, InitializeParameterPluginChain, RequestPathPluginChain, type RestfulPlugin } from './restful/RestfulPlugin';
import type { InputRestParameters, RestfulOperation } from './restful/RestfulOperation';
import type { RestApiResponse } from './restful/apiFetch';
import { SetLoadingPlugin, SetRequestPlugin, type RestfulComponentConfig, type RestfulDisplaySupport } from './restful/SvelteSupport';
import { LoggingRestfulPlugin, type LogMessage } from './restful/BuiltInPlugins';
import { persisted } from 'svelte-persisted-store';

const baseUrl = "https://anypoint.mulesoft.com/"
export async function anypointFetch(resource: string, options: any = {}, data?: any) {

    const envId = get(settings).envId;
    const orgId = get(settings).orgId;

    let appInfo: any;

    options.headers = {
        "X-ANYPNT-ORG-ID": orgId,
        "X-ANYPNT-ENV-ID": envId,
        "content-type": "application/json;charset=UTF-8",
        "Authorization": `bearer ${get(settings).tokenString}`
    };
    if (options.body) {
        options.body = JSON.stringify(options.body)
    }
    let url
    if (resource.startsWith("https://")) {
        url = resource
    } else {
        url = baseUrl + resource;
    }
    // loading.set(true)
    try {
        appInfo = await fetch(url, options);
    } catch (e) {
        notifyMessage.notify("Connect error. " + url)
        // loading.set(false)
        throw e
    }
    // loading.set(false)
    console.log("Anypoint Response", appInfo)
    let responseData
    const contentType = appInfo.headers.get("content-type")
    if (contentType.includes("json")) {
        responseData = await appInfo.json()
    } else {
        responseData = await appInfo.text()
    }
    if (appInfo.status < 400) {
        notifyMessage.notify("request Success. " + url)
        settings.update(e => Object.assign(e, { isAuthorized: true }))
        return responseData;
    } else {
        notifyMessage.notify("request failed (" + appInfo.status + "). " + url)
        if (appInfo.status == 401 || appInfo.status == 403) {
            settings.update(e => Object.assign(e, { isAuthorized: false }))
        }
        throw responseData
    }
}

export function isExtensionEnable() {
    if (!get(settings).extensionId) {
        notifyMessage.notify("invalid extensionId")
        throw new Error("Extension id invalid")
    }
    const prms = new Promise((resolve, reject) => {

        getChrome().runtime.sendMessage(
            get(settings).extensionId,
            { command: "PING" },
            function (response: any) {
                console.log("PING response", response);
                resolve(response)
            },
        );
    });
    return prms


}

export async function updateTokenWithExtension() {
    isExtensionEnable();
    const prms = new Promise((resolve, reject) => {

        getChrome().runtime.sendMessage(
            get(settings).extensionId,
            { command: "UPDATE_ACCESS_TOKEN" },
            function (response: any) {
                console.log("UPDATE_ACCESS_TOKEN response", response);
                get(settings).tokenString = response
                resolve(response)
            },
        );
    });
    return prms
}

export function getProfileFromExtension() {
    isExtensionEnable();
    return new Promise((resolve, reject) => {
        try {
            getChrome().runtime.sendMessage(
                get(settings).extensionId,
                { command: "CALL_ACCOUNT_PROFILE" },
                function (response: any) {
                    resolve(response)
                },
            );
        } catch (e) {
            reject(e)
        }

    })
}
export function getOrgnizationFromExtension(orgId: string) {
    isExtensionEnable();
    return new Promise((resolve, reject) => {
        try {
            getChrome().runtime.sendMessage(
                get(settings).extensionId,
                { command: "CALL_ACCOUNT_ORGANIZATIONS", orgId },
                function (response: any) {
                    resolve(response)
                },
            );
        } catch (e) {
            reject(e)
        }

    })
}

export async function getTokenFromExtension() {
    isExtensionEnable();
    getChrome().runtime.sendMessage(
        get(settings).extensionId,
        { command: "GET_ACCESS_TOKEN" },
        function (response: any) {
            console.log("GET_ACCESS_TOKEN response", response);
            settings.update(e => Object.assign(e, { tokenString: response.tokenString }))
        },
    );
}
function getChrome() {
    const chrome = (window as any).chrome as any
    return chrome;
}


export function doFetch(url: string, init: RequestInit): Promise<RestApiResponse> {
    isExtensionEnable();
    const requestPath = url.replaceAll("https://anypoint.mulesoft.com/", "").replaceAll("https://anypoint.mulesoft.com:/", "")
    return new Promise((resolve, reject) => {
        try {
            getChrome().runtime.sendMessage(
                get(settings).extensionId,
                { command: "FETCH_ANYPOINT", requestPath, init },
                function (response: any) {
                    console.log("response", response)
                    if (response.error) {
                        reject(response.error)
                    } else {
                        resolve(response)

                    }
                },
            );
        } catch (e) {
            reject(e)
        }

    })
}

export class AnypointRestfulPlugin extends EmptyRestfulPlugin {
    doRequestPath(restfulOperation: RestfulOperation, chain: RequestPathPluginChain): string {
        let path = chain.next();
        path = path.replaceAll("{version}", "v1")
        return path
    }
    doInitializeRestInputParameters(restfulOperation: RestfulOperation, chain: InitializeParameterPluginChain): InputRestParameters {
        const value = chain.next()
        const operation = restfulOperation.getOperation()
        if (operation.parameters) {
            for (let p of operation.parameters) {
                const param = p as any
                if (param.name == "X-ANYPNT-ENV-ID") {
                    value[param.name] = get(settings).envId;
                }
            }
        }
        return value
    }
}

export class AnypointLastRestfulPlugin extends EmptyRestfulPlugin {
    async doFetch(restfulOperation: RestfulOperation, chain: FetchPluginChain, inputParameters: any, input: RequestInfo | URL, init?: RequestInit): Promise<RestApiResponse> {

        const envId = get(settings).envId;
        const orgId = get(settings).orgId;

        const options = init ?? {} as RequestInit

        options.headers = {
            "X-ANYPNT-ORG-ID": orgId,
            "X-ANYPNT-ENV-ID": envId,
            "content-type": "application/json;charset=UTF-8",
            "Authorization": `bearer ${get(settings).tokenString}`
        };
        if (options.body) {
            // TODO move to RestfulOperation
            options.body = JSON.stringify(options.body)
        }

        try {
            const response = await doFetch(input as string, options)
            if (response.ok) {
                settings.update(e => Object.assign(e, { isAuthorized: true }))
            }
            if (response.status == 401 || response.status == 403) {
                settings.update(e => Object.assign(e, { isAuthorized: false }))
            }
            return response
        } catch (e) {
            notifyMessage.notify("Connect error. " + input)
            throw e
        }
        // TODO 401 error

        // TODO notify
    }
}

export const AnypointDisplaySupport: RestfulDisplaySupport = {
    getArrayResponse(restfulOperation: RestfulOperation, responseBody: Record<string, any>): Record<string, any>[] | null {
        if (responseBody) {
            if (Array.isArray(responseBody)) {
                return responseBody
            } else if (responseBody.data) {
                return responseBody.data
            } else if (responseBody.assets) {
                return responseBody.assets
            }
        }
        return null
    }
}



const apiManagerPlugin = new EmptyRestfulPlugin()
apiManagerPlugin.doInitializeRestInputParameters = (restfulOperation: RestfulOperation, chain: InitializeParameterPluginChain): InputRestParameters => {
    const initialValue = chain.next()
    initialValue["organizationId"] = get(settings).orgId
    initialValue["environmentId"] = get(settings).envId
    return initialValue
}
const messageLogger = {
    log(message: LogMessage): void {
        logMessages.update(e => [...e, message])
    }
}


export const createDefaultConfig = (storageKey: string, documentRaw: string): RestfulComponentConfig => {

    const responses = persisted(
        storageKey + ".responses",
        {} as { [requestPath: string]: any },
    );
    const parameterHistories = persisted(storageKey + ".histories", {} as any);
    const selectedTableKeys = persisted(storageKey + ".selectedTableKeys", {} as any);
    const dataTableFilters = persisted(
        storageKey + ".data-table-filters",
        {} as any,
    );
    const dataTableSelectedColumn = persisted(
        storageKey + ".data-table-selected-columns",
        {} as any,
    );
    const requestSetting = persisted(
        storageKey + ".request-setting",
        {} as any,
    );
    return {
        documentRaw,
        storage: {
            responses,
            parameterHistories,
            dataTableFilters,
            dataTableSelectedColumn,
            selectedTableKeys,
            requestSetting,
        },
        additionalPlugins: [
            apiManagerPlugin,
            new LoggingRestfulPlugin(messageLogger),
            new SetLoadingPlugin(loading),
            new AnypointRestfulPlugin(),
            new SetRequestPlugin(requestSetting),
            new AnypointLastRestfulPlugin(),
        ] as RestfulPlugin[],
        displaySupport: AnypointDisplaySupport
    }
}
