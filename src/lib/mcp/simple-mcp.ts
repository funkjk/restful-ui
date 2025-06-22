import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
    ListResourceTemplatesRequestSchema,
    ErrorCode,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';

async function main() {
    console.log("start simple-mcp")

    // Create server instance
    const server = new Server(
        {
            name: "simple-test",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
                resources: {},
            },
        }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
        console.log("ListToolsRequestSchema")
        return {
            tools: [{
                name: "calculate_sum",
                description: "Add two numbers together",
                inputSchema: {
                    type: "object",
                    properties: {
                        a: { type: "number" },
                        b: { type: "number" }
                    },
                    required: ["a", "b"]
                }
            }, {
                name: "my_test",
                description: "my test tool",
                inputSchema: {
                    type: 'object',
                    properties: {
                        parameters: {
                            type: 'object',
                            description: 'Parameters for the API call',
                            additionalProperties: true,
                        },
                    },
                }
            },

            ]
        };
    });

    // Handle tool execution
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        console.log("CallToolRequestSchema", request)
        if (request.params.name === "calculate_sum") {
            const { a, b } = request.params.arguments as any;
            return {
                content: [
                    {
                        type: "text",
                        text: String(a + b)
                    }
                ]
            };
        }
        if (request.params.name === "my_test") {
            const paramArguments = request.params.arguments as any;
            console.log("paramArguments", paramArguments)
            return {
                content: [
                    {
                        type: "text",
                        text: "my_test"
                    }
                ]
            };
        }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");



}







main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});