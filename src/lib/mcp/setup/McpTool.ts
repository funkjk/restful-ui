// import { createRestfulOperation, OperationParameter, RequestBodyType, type InputRestParameters } from "$lib/restful/RestfulOperation";
// import type { RestfulPlugin } from "$lib/restful/RestfulPlugin";
// import type { ToolInfo } from "$lib/types/api-config";
// import { defaultLogger } from "$lib/utils/logger";
// import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
// import type { OpenAPI } from "openapi-types";

// export async function createTools(
//     openApiDoc: OpenAPI.Document,
//     plugins: RestfulPlugin[]
// ) : Promise<ToolInfo[]> {
//     if (!openApiDoc) {
//         throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
//     }

//     const tools: ToolInfo[] = [];
//     const paths = openApiDoc.paths;
//         if (paths) {
//             for (const [path, pathItem] of Object.entries(paths)) {
//                 if (pathItem) {
//                     const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
//                     for (const method of methods) {
//                         const operation = pathItem[method];
//                         if (operation) {
//                             // Create URLSearchParams for RestfulOperation
//                             const searchParams = new OperationParameter(path, method, []);
//                             const currentOperation = createRestfulOperation(searchParams, openApiDoc, plugins);

//                             let bodyParamName = currentOperation.getBodyValueName();
//                             let operation = currentOperation.getOperation();

//                             let params = currentOperation.getOperation().parameters ?? [] as any[];
//                             const inputParameters = {} as any
//                             for (const param of params) {
//                                 const paramName = param.name;
//                                 let schema = {
//                                     type: "string",
//                                 } as any
//                                 inputParameters[paramName] = schema
//                             }
//                             if (bodyParamName && currentOperation.getBodyTypes().length > 0) {
//                                 const bodyType = currentOperation.getBodyTypes()[0]
//                                 const bodyDifinition = currentOperation.getBodyDefinition(bodyType)
//                                 if (bodyType == RequestBodyType.JSON) {
//                                     inputParameters[bodyParamName] = {
//                                         type: "object",
//                                         additionalProperties: true
//                                     }
//                                 } else if (bodyType === RequestBodyType.FORM_DATA && bodyDifinition && bodyDifinition.properties) {
//                                     for (const [name, property] of Object.entries(bodyDifinition.properties)) {
//                                         inputParameters[name] = {
//                                             type: property.type ?? "string",
//                                             description: property.description,
//                                             enum: property.enum,
//                                             default: property.default,
//                                         }
//                                     }
//                                 } else {
//                                     defaultLogger.warn("illegal body type", { bodyType, bodyDifinition })
//                                 }
//                             }

//                             const toolName = `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
//                             tools.push({
//                                 name: toolName,
//                                 description: operation.summary || operation.description || `${method.toUpperCase()} ${path}`,
//                                 inputSchema: {
//                                     type: 'object',
//                                     properties: inputParameters,
//                                 },
//                             });
//                         }
//                     }
//                 }
//             }
//         }

//     return tools;
// }

// export async function executeTool(
//     openApiDoc: OpenAPI.Document,
//     plugins: RestfulPlugin[],
//     toolName: string,
//     paramArguments: any
// ) {

//     defaultLogger.info(`CallToolRequestSchema ${toolName} args` + JSON.stringify(paramArguments))

//     if (!openApiDoc) {
//       throw new McpError(ErrorCode.InternalError, 'OpenAPI document not loaded');
//     }

//     try {
//       // Parse tool name to extract method and path
//       const [method, ...pathParts] = toolName.split('_');
//       const path = pathParts.join('_').replace(/_/g, '/');

//       // Find the actual path in the OpenAPI document
//       let actualPath: string | null = null;
//       const paths = openApiDoc.paths;

//       if (paths) {
//         for (const p of Object.keys(paths)) {
//           if (p.replace(/[^a-zA-Z0-9]/g, '_') === pathParts.join('_')) {
//             actualPath = p;
//             break;
//           }
//         }
//       }

//       if (!actualPath) {
//         throw new McpError(ErrorCode.InvalidRequest, `Path not found for tool: ${name}`);
//       }

//       // Create URLSearchParams for RestfulOperation
//       const searchParams = new OperationParameter(actualPath, method, []);

//       // Create RestfulOperation
//       const operation = createRestfulOperation(searchParams, openApiDoc, plugins);

//       if (!operation.exist()) {
//         throw new McpError(ErrorCode.InvalidRequest, `Operation not found: ${method} ${actualPath}`);
//       }

//       // Execute the API call
//       if (paramArguments.requestBody && typeof paramArguments.requestBody === "object") {
//         paramArguments.requestBody = JSON.stringify(paramArguments.requestBody);
//       }
//       const response = await operation.execute(paramArguments as InputRestParameters);

//       return {
//         content: [
//           {
//             type: 'text',
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
//       defaultLogger.error(`Failed to execute tool ${name}: ${error instanceof Error ? error.message : String(error)}`, error)
//       throw new McpError(
//         ErrorCode.InternalError,
//         `Failed to execute tool ${name}: ${error instanceof Error ? error.message : String(error)}`
//       );
//     }
// }