npx @modelcontextprotocol/inspector 


{
    "mcpServers": {
        "default-server": {
            "type": "sse",
            "url": "http://localhost:3001/sse",
            "note": "For SSE connections, add this URL directly in your MCP Client"
        }
    }
}

mcp-server-logger /Users/kenji.funaki/projects/prv/product/restful-ui/mcp-server.log tsx src/lib/mcp/server.ts https://petstore.swagger.io/v2/swagger.json
