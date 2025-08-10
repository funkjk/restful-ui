// import { createRestfulOperation } from "$lib/restful/RestfulOperation";
// import type { RestfulPlugin } from "$lib/restful/RestfulPlugin";
// import type { ResourceInfo, ResourceTemplateInfo } from "$lib/types/api-config";
// import { defaultLogger } from "$lib/utils/logger";
// import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
// import type { OpenAPI } from "openapi-types";
// // @ts-ignore
// import UriTemplate from 'uri-template-lite';

// export async function createResources(
//     openApiDoc: OpenAPI.Document,
//     serverName: string
// ) : Promise<ResourceInfo[]> {


//     if (!openApiDoc) {
//         throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
//       }

//       const resources: ResourceInfo[] = [];
//       const paths = openApiDoc.paths;


//       if (paths) {
//         for (const [path, pathItem] of Object.entries(paths)) {
//           if (pathItem && pathItem.get) {
//             if (path.includes("{") || path.includes("}")) {
//               continue;
//             }
//             const operation = pathItem.get;
//             const resourceName = `get_${path}`;

//             resources.push({
//               uri: `openapi://${serverName}${path}`,
//               name: resourceName,
//               description: operation.summary || operation.description || `GET ${path}`,
//               mimeType: 'application/json',
//             });
//           }
//         }
//       }

//       return resources;
// }

// export async function createResourceTemplates(
//     openApiDoc: OpenAPI.Document,
//     serverName: string
// ) : Promise<ResourceTemplateInfo[]> {
//     const resourceTemplates: ResourceTemplateInfo[] = [];
//     if (!openApiDoc) {
//       throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
//     }

//     const paths = openApiDoc.paths;
//     if (paths) {
//       for (const [path, pathItem] of Object.entries(paths)) {
//         if (pathItem && pathItem.get) {
//           if (!path.includes("{") && !path.includes("}")) {
//             continue;
//           }
//           const operation = pathItem.get;
//           const resourceName = `get_${path}`;
//           resourceTemplates.push({
//             uriTemplate: `openapi://${serverName}${path}`,
//             name: resourceName,
//             description: operation.summary || operation.description || `GET ${path}`,
//             mimeType: 'application/json',
//           });
//         }
//       }
//     }

//     return resourceTemplates;

// }

// export async function readResource(
//     openApiDoc: OpenAPI.Document,
//     serverName: string,
//     uri: string,
//     plugins: RestfulPlugin[]
// ) {
//     if (!openApiDoc || !openApiDoc.paths) {
//         throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
//     }

//     defaultLogger.info("ReadResourceRequestSchema" + uri)

//     // Parse URI to extract resource name
//     const match = uri.match(/^openapi:\/(.+)$/);
//     if (!match) {
//       throw new McpError(ErrorCode.InvalidRequest, `Invalid resource URI: ${uri}`);
//     }

//     let resourceName = match[1].replace(`${serverName}/`, "");
//     defaultLogger.info("resourceName", resourceName)
//     let queryString = ""
//     if (resourceName.includes("?")) {
//       const [path, query] = resourceName.split("?");
//       resourceName = path
//       queryString = query
//     }

//     const resoucePath = resourceName.replace(/^get_/, "");

//     const paths = openApiDoc.paths
//     // Find the actual path in the OpenAPI document
//     let actualPath: string | null = null;
//     let additionalQueryParameter = {} as any
//     for (const [path] of Object.entries(paths)) {
//       // @ts-ignore // there are no latest types for uri-template-lite
//       const template = new UriTemplate(path)
//       const match = template.match(resoucePath)
//       if (match) {
//         actualPath = path
//         additionalQueryParameter = match
//         break
//       }
//     }

//     if (!actualPath) {
//       throw new McpError(ErrorCode.InvalidRequest, `Path not found for resource: ${resourceName}`);
//     }

//     // Create URLSearchParams for RestfulOperation

//     const searchParams = new URLSearchParams(queryString)
//     searchParams.set("path", actualPath)
//     searchParams.set("method", "get")


//     // Create RestfulOperation
//     const operation = createRestfulOperation(searchParams, openApiDoc, plugins);

//     if (!operation.exist()) {
//       throw new McpError(ErrorCode.InvalidRequest, `Operation not found: GET ${actualPath}`);
//     }

//     try {
//       // Execute the API call with empty parameters for GET requests
//       const response = await operation.execute(additionalQueryParameter);

//       return {
//         contents: [
//           {
//             uri,
//             mimeType: 'application/json',
//             text: JSON.stringify({
//               url: response.url,
//               status: response.status,
//               ok: response.ok,
//               headers: response.headers,
//               body: response.responseBody,
//               bodyType: response.responseBodyType,
//             }, null, 2),
//           },
//         ],
//       };
//     } catch (error) {
//       throw new McpError(
//         ErrorCode.InternalError,
//         `Failed to read resource ${resourceName}: ${error instanceof Error ? error.message : String(error)}`
//       );
//     }
// }