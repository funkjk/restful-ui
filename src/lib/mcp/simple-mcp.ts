// import { createLogger } from '$lib/utils/logger';
// // import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// // import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// import {
//     CallToolRequestSchema,
//     ListToolsRequestSchema,
// } from '@modelcontextprotocol/sdk/types.js';

// // console.log(JSON.stringify({"test":"testtest"}))

// // console.log(JSON.stringify(
// //     {"cwd":process.cwd()}))

// const logger = createLogger("simple-mcp")
// // const logger = console
// // Only use process.cwd() in Node.js environment
// if (typeof process !== 'undefined' && process.cwd) {
//   logger.info("cwd:"+process.cwd())
// }

// async function main() {

//     logger.info("start simple-mcp")

//     // Create server instance
//     const server = new Server(
//         {
//             name: "simple-test",
//             version: "1.0.0",
//         },
//         {
//             capabilities: {
//                 tools: {},
//                 resources: {},
//             },
//         }
//     );

//     server.setRequestHandler(ListToolsRequestSchema, async () => {
//         logger.info("ListToolsRequestSchema")
//         return {
//             tools: [{
//                 name: "calculate_sum",
//                 description: "Add two numbers together",
//                 inputSchema: {
//                     type: "object",
//                     properties: {
//                         a: { type: "number" },
//                         b: { type: "number" }
//                     },
//                     required: ["a", "b"]
//                 }
//             }, {
//                 name: "my_test",
//                 description: "my test tool",
//                 inputSchema: {
//                     type: 'object',
//                     properties: {
//                         parameters: {
//                             type: 'object',
//                             description: 'Parameters for the API call',
//                             additionalProperties: true,
//                         },
//                     },
//                 }
//             },

//             ]
//         };
//     });

//     // Handle tool execution
//     server.setRequestHandler(CallToolRequestSchema, async (request) => {
//         logger.info("CallToolRequestSchema", request)
//         if (request.params.name === "calculate_sum") {
//             const { a, b } = request.params.arguments as any;
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: String(a + b)
//                     }
//                 ]
//             };
//         }
//         if (request.params.name === "my_test") {
//             const paramArguments = request.params.arguments as any;
//             logger.info("paramArguments", arguments)
//             return {
//                 content: [
//                     {
//                         type: "text",
//                         text: "my_test"
//                     }
//                 ]
//             };
//         }
//         // Default case - return error
//         throw new Error(`Unknown tool: ${request.params.name}`);
//     });

//     const transport = new StdioServerTransport();
//     await server.connect(transport);
//     logger.error("Weather MCP Server running on stdio");

// }







// // Only run main() in Node.js environment
// if (typeof process !== 'undefined' && process.exit) {
//   main().catch((error) => {
//       console.error("Fatal error in main():", error);
//       process.exit(1);
//   });
// }