// import { error, json } from "@sveltejs/kit";
// import { getMcpServer, isServerInitialized, startInitializeMcpServer } from "./server-state";

// // Store active MCP SSE connections
// const activeConnections = new Map<string, {
//     controller: ReadableStreamDefaultController;
//     encoder: TextEncoder;
//     sendData: (data: any) => void;
//   }>();
  
//   let connectionIdCounter = 0;
  
export async function getMcpRequest(configurationId: string, request: Request) {
  return new Response("Hello, world!");
}
// export async function getMcpRequest(configurationId: string, request: Request) {
//     console.log("GET request received for MCP SSE connection", configurationId);
    
//     // MCPサーバが初期化されていない場合はエラー
//     if (!await startInitializeMcpServer(configurationId)) {
//       console.error("MCP server not initialized for SSE connection");
//       throw error(503, 'MCP server not initialized. Please call /api/mcp/init first.');
//     }
    
//     try {
//       const encoder = new TextEncoder();
//       let keepAliveInterval: NodeJS.Timeout | null = null;
//       const connectionId = `mcp_${Date.now()}_${++connectionIdCounter}`;
      
//       const stream = new ReadableStream({
//         start(controller) {
//           const startTime = Date.now();
//           try {
//             console.log(`Starting persistent SSE stream for MCP client (ID: ${connectionId})`);
            
//             const sendData = (data: any) => {
//               try {
//                 const message = `data: ${JSON.stringify(data)}\n\n`;
//                 controller.enqueue(encoder.encode(message));
//                 console.log(`[${connectionId}] Sent SSE data:`, data.type || data.method || 'unknown');
//               } catch (err) {
//                 console.error(`[${connectionId}] Error sending SSE data:`, err);
//                 controller.error(err);
//               }
//             };
  
//             // Register this connection
//             activeConnections.set(connectionId, {
//               controller,
//               encoder,
//               sendData
//             });
//             console.log(`[${connectionId}] Connection registered. Total connections:`, activeConnections.size);
  
//             // Send immediate comment to establish headers quickly (no JSON data)
//             console.log(`[${connectionId}] Sending immediate connection confirmation`);
//             controller.enqueue(encoder.encode(`: SSE connection established ${connectionId}\n\n`));
            
//             console.log(`[${connectionId}] SSE connection established, waiting for MCP messages`);
//             // Do NOT send any JSON data - wait for actual MCP requests
  
//             // Set up regular keepalive to prevent timeouts
//             console.log(`[${connectionId}] Setting up keepalive`);
            
//             keepAliveInterval = setInterval(() => {
//               try {
//                 // Send SSE comment keepalive (won't trigger onmessage)
//                 controller.enqueue(encoder.encode(`: keepalive ${new Date().toISOString()}\n\n`));
//                 console.log(`[${connectionId}] Keepalive sent`);
//               } catch (err) {
//                 console.error(`[${connectionId}] Keepalive failed:`, err);
//                 if (keepAliveInterval) {
//                   clearInterval(keepAliveInterval);
//                   keepAliveInterval = null;
//                 }
//               }
//             }, 15000); // 15 seconds interval
  
//             console.log("MCP SSE stream is now persistent and ready");
//           } catch (err) {
//             console.error("Error in SSE stream start:", err);
//             controller.error(err);
//           }
//         },
        
//         cancel() {
//           console.log(`[${connectionId}] MCP SSE stream cancelled by client at`, new Date().toISOString());
          
//           // Clean up connection
//           activeConnections.delete(connectionId);
//           console.log(`[${connectionId}] Connection removed. Remaining connections:`, activeConnections.size);
          
//           if (keepAliveInterval) {
//             clearInterval(keepAliveInterval);
//             keepAliveInterval = null;
//           }
//         }
//       });
  
//       console.log("Returning persistent SSE response for MCP client");
      
//       const response = new Response(stream, {
//         status: 200,
//         headers: {
//           'Content-Type': 'text/event-stream; charset=utf-8',
//           'Cache-Control': 'no-cache, no-store, must-revalidate',
//           'Pragma': 'no-cache',
//           'Expires': '0',
//           'Connection': 'keep-alive',
//           'Access-Control-Allow-Origin': '*',
//           'Access-Control-Allow-Headers': 'Accept, Cache-Control',
//           'Access-Control-Allow-Methods': 'GET'
//         }
//       });
      
//       console.log("SSE Response headers:", Object.fromEntries(response.headers.entries()));
//       return response;
//     } catch (err) {
//       console.error("Error in GET handler:", err);
//       throw error(500, `SSE GET error: ${err instanceof Error ? err.message : String(err)}`);
//     }

// }
 export async function postMcpRequest(configurationId: string, request: Request) {
  return new Response("Hello, world!");
}

// export async function postMcpRequest(configurationId: string, request: Request) {
//         console.log("POST request received for MCP message", configurationId);

//         // MCPサーバが初期化されていない場合は起動
//         if (!await startInitializeMcpServer(configurationId)) {
//           console.error("MCP server not initialized");
//           throw error(503, 'MCP server not initialized. Please call /api/mcp/init first.');
//         }
      
//         try {
//           const body = await request.json();
//           console.log("POST request body:", body);
//           const { method, params, id } = body;
      
//           if (!method) {
//             console.error("Method is required");
//             throw error(400, 'Method is required');
//           }
      
//           const serverInstance = getMcpServer(configurationId);
//           if (!serverInstance) {
//             return json({
//               jsonrpc: '2.0',
//               id,
//               error: {
//                 code: -32603,
//                 message: 'MCP server not available'
//               }
//             });
//           }
//           console.log(`Processing MCP request: ${method}`);
      
//           try {
//             // Initialize request
//             if (method === 'initialize') {
//               const result = {
//                 protocolVersion: '2024-11-05',
//                 capabilities: {
//                   tools: {},
//                   resources: {},
//                 },
//                 serverInfo: {
//                   name: 'openapi-mcp-server-sse',
//                   version: '1.0.0',
//                 },
//               };
//               return json({
//                 jsonrpc: '2.0',
//                 id,
//                 result
//               });
//             }
      
//             // List tools request
//             if (method === 'tools/list') {
              
//               const tools = await serverInstance.getAvailableTools();
              
//               return json({
//                 jsonrpc: '2.0',
//                 id,
//                 result: { tools }
//               });
//             }
      
//             // List resources request
//             if (method === 'resources/list') {
              
//               const resources = await serverInstance.getAvailableResources();
              
//               return json({
//                 jsonrpc: '2.0',
//                 id,
//                 result: { resources: resources }
//               });
//             }
      
//             // Read resource request
//             if (method === 'resources/read') {
//               const { uri } = params;
      
//               if (!uri) {
//                 return json({
//                   jsonrpc: '2.0',
//                   id,
//                   error: {
//                     code: -32602,
//                     message: 'URI parameter is required'
//                   }
//                 });
//               }
//               try {
      
//                 const result = await serverInstance.executeResource(uri);
                
//                 return json({
//                   jsonrpc: '2.0',
//                   id,
//                   result: {
//                     contents: [
//                       {
//                         uri,
//                         mimeType: 'application/json',
//                         text: JSON.stringify(result, null, 2),
//                       },
//                     ],
//                   }
//                 });
//               } catch (resourceError) {
//                 console.error("Resource execution error:", resourceError);
//                 return json({
//                   jsonrpc: '2.0',
//                   id,
//                   error: {
//                     code: -32603,
//                     message: `Resource execution failed: ${resourceError instanceof Error ? resourceError.message : String(resourceError)}`
//                   }
//                 });
//               }
//             }
      
//             // List resource templates request
//             if (method === 'resources/templates/list') {
              
//               const resourceTemplates = await serverInstance.getAvailableResourceTemplates();
      
//               return json({
//                 jsonrpc: '2.0',
//                 id,
//                 result: { resourceTemplates }
//               });
//             }
      
//             // Call tool request
//             if (method === 'tools/call') {
//               const { name, arguments: args } = params;
      
//               try {
//                 const result = await serverInstance.executeTool(name, args?.parameters || {});
//                 return json({
//                   jsonrpc: '2.0',
//                   id,
//                   result: {
//                     content: [
//                       {
//                         type: 'text',
//                         text: JSON.stringify(result, null, 2),
//                       },
//                     ],
//                   }
//                 });
//               } catch (toolError) {
//                 console.error("Tool execution error:", toolError);
//                 return json({
//                   jsonrpc: '2.0',
//                   id,
//                   error: {
//                     code: -32603,
//                     message: `Tool execution failed: ${toolError instanceof Error ? toolError.message : String(toolError)}`
//                   }
//                 });
//               }
//             }
      
//             // Unknown method
//             return json({
//               jsonrpc: '2.0',
//               id,
//               error: {
//                 code: -32601,
//                 message: `Method not found: ${method}`
//               }
//             });
      
//           } catch (processingError) {
//             console.error("Error processing MCP message:", processingError);
//             return json({
//               jsonrpc: '2.0',
//               id,
//               error: {
//                 code: -32603,
//                 message: `Internal error: ${processingError instanceof Error ? processingError.message : String(processingError)}`
//               }
//             });
//           }
      
//         } catch (err) {
//           console.error("Error in POST handler:", err);
//           throw error(400, `Parse error: ${err instanceof Error ? err.message : String(err)}`);
//         }
// }