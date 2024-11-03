export enum RESEPONSE_BODY_TYPE {
    JSON = "JSON",
    TEXT = "TEXT"
}
export interface RestApiResponse {
    ok: boolean;
    error?: any;
    status?: number;
    url: string;
    headers?: Record<string, string>;
    responseBody?: any;
    responseBodyType?: RESEPONSE_BODY_TYPE
}

export async function doFetch(input: RequestInfo | URL, init?: RequestInit) {
    try {
        const response = await fetch(
            input,
            init
        );
        let responseBody
        let responseBodyType
        const headers: Record<string, string> = {}
        for (let pair of response.headers.entries()) {
            headers[pair[0].toLocaleLowerCase()] = pair[1]
        }
        if (headers["content-type"].includes("json")) {
            responseBody = await response.json()
            responseBodyType = RESEPONSE_BODY_TYPE.JSON
        } else {
            responseBody = await response.text()
            responseBodyType = RESEPONSE_BODY_TYPE.TEXT
        }
        return {
            ok: response.ok,
            status: response.status,
            url: response.url,
            headers: headers,
            responseBody,
            responseBodyType
        }
    } catch (e) {
        return {
            ok: false,
            url: input as string,
            error: e
        }
    }
}