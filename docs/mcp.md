# MCP integration

In **server build mode**, RESTful UI generates **MCP (Model Context Protocol)** tools from OpenAPI specs so AI clients (Cursor, etc.) can call APIs over HTTP.

## Overview

- **Server build mode only** — static build mode has no MCP endpoints
- UI and MCP share the same [`RestfulOperation`](../src/lib/restful/RestfulOperation.ts) and plugins (see [development.md](development.md), MCP reuse)
- Each OpenAPI path × method is exposed as an MCP tool

## Main HTTP routes

| Route | Purpose |
|-------|---------|
| `POST /api/mcp/init` | Initialize / start MCP server |
| `GET /api/mcp/init` | Get server state |
| `DELETE /api/mcp/init` | Stop server |
| `GET /api/mcp` | MCP (SSE) |
| `POST /api/mcp` | MCP messages (JSON-RPC) |
| `/api/mcp/[cid]` | MCP per saved config ID |

## Basic flow (Cursor)

1. Start server build mode (`pnpm run dev` or self-host)
2. Save an OpenAPI config to ConfigStore and load it at `/cid/{configurationId}/`
3. Call `POST /api/mcp/init` (optionally with `configurationId`)
4. Register `http://localhost:4210/api/mcp` (or `/api/mcp/{cid}`) in Cursor’s MCP settings
5. Invoke each API operation as a tool from the AI client

Tool names are generated from method + path, e.g. `GET /pet/{petId}` → `get_pet_petId`.

## Request settings

MCP execution applies saved `requestSettings` (headers, basePath, query) via [`McpRequestSettingsPlugin`](../src/lib/mcp/McpRequestSettingsPlugin.ts) — the same settings as the UI Settings tab.

## Security

- MCP API calls go **outbound from the RESTful UI server** to the target API
- For sensitive APIs or production data, **self-host** — [network-and-security.md](network-and-security.md)
- MCP on the public Vercel demo is operated by a third party
