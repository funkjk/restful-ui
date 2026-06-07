# RESTful UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**日本語:** [README.ja.md](README.ja.md)

**An explorer for RESTful APIs — load OpenAPI specs and navigate from list views to individual resources and updates, all in the UI.**

Endpoints are derived from your OpenAPI document; you set parameters and call APIs from the browser. The same execution core (`RestfulOperation`) also powers MCP for AI clients.

## What makes it useful

- **Run from OpenAPI** — Parse the spec, surface endpoints, methods, and parameters in the UI, and try requests immediately
- **Navigate like REST** — After a collection GET, drill from a row or ID into related GET / PUT / DELETE operations on the same API
- **Easy to retry** — Keep GET results and parameter history in the browser so you can revisit the same resource (by default, try-it-out data is not sent to the RESTful UI server; see [Privacy and data paths](#privacy-and-data-paths))

## How you explore and call a RESTful API

### 1. Discover operations from OpenAPI

Load OpenAPI v2/v3 and list operations by path and HTTP method. Set path, query, and body parameters in forms and execute calls from the UI.

### 2. Move from a list to the next operation

Collection GET responses appear in a table. From column values (IDs, path segments, etc.) you can **drill down to related operations** along the path hierarchy (detail GET, PUT, DELETE, and more). Values you pick in the table carry into the next request’s parameters.

### 3. Reach nested endpoints

Navigate to child-path operations under a parent resource the same way. Use the path tree to see the API hierarchy and jump to the method you need.

### 4. Update resources (PUT, etc.)

Base updates on a prior GET: edit only the fields you want to change, then send PUT or similar calls. This matches a practical REST workflow of “fetch, then modify real data.”

### 5. Browser-side retention

Responses and parameter history are stored in the **browser (localStorage / Service Worker)** so you can return to the same resource or repeat similar requests quickly.

```
OpenAPI → collection GET → pick one row → detail GET / PUT / DELETE
                ↘ nested path operations
```

## Live demos

| Build mode | URL | Includes |
|------------|-----|----------|
| **Static** (Explorer demo) | <a href="https://funkjk.github.io/restful-ui/" target="_blank" rel="noopener noreferrer">GitHub Pages</a> | Exploration & try-it-out, path tree, bundled sample specs; optional CORS proxy via external URL (`PUBLIC_CORS_PROXY_URL`) |
| **Server** (Full demo) | <a href="https://restful-ui.vercel.app/" target="_blank" rel="noopener noreferrer">Vercel</a> | + same-origin `/api/proxy`, saved configs, MCP over HTTP |

Local `pnpm run dev` uses the **server build mode** (API routes, proxy, config persistence, MCP).

**The flow in [How you explore and call a RESTful API](#how-you-explore-and-call-a-restful-api) works in static build mode too.** Server-side config save and MCP require server build mode (or local dev). CORS proxy works in static build mode when you point **Proxy base URL** at an external cors-anywhere compatible server (the GitHub Pages demo uses the Vercel Full demo’s `/api/proxy`).

## Not a Swagger UI replacement

**This is not a drop-in replacement for Swagger UI or Scalar.**

Typical OpenAPI UIs focus on reading the spec and one-off try-it-out. RESTful UI focuses on **walking REST-style path APIs from collections to single resources to nested resources while executing calls**. The same execution layer is reused for MCP.

## Build modes

| | Static (`BUILD_MODE=static`) | Server (`BUILD_MODE=server`, default) |
|--|------------------------------|---------------------------------------|
| Explore & try it out | Yes | Yes |
| Build | `BUILD_MODE=static`, static adapter | Server adapter (default: Vercel) |
| Try-it-out traffic | Browser → target API **directly** | Same when proxy is OFF |
| CORS proxy | Optional via **external** proxy URL (`PUBLIC_CORS_PROXY_URL`); no same-origin `/api/proxy` | Optional: same-origin `/api/proxy` or external URL; **OFF by default** (Settings) |
| Saved OpenAPI configs | None | ConfigStore |
| MCP over HTTP | None | `/api/mcp`, etc. |

## Proxy (CORS)

Try it out uses **cross-origin** `fetch` in the browser. If the target API does not allow CORS, the response may not appear in the UI.

With **proxy ON** (Settings → **Use CORS proxy**), the browser calls a **cors-anywhere compatible** proxy base URL. The target URL is appended as a single encoded path segment: `{proxyBase}/{encodeURIComponent(targetUrl)}`.

| Build mode | Default proxy base |
|------------|-------------------|
| Server (or `pnpm run dev`) | Same-origin `/api/proxy` |
| Static | `PUBLIC_CORS_PROXY_URL` if set at build time (GitHub Pages demo → Vercel Full demo) |

You can override **Proxy base URL** in Settings and on the OpenAPI URL entry screen. Remote proxies cannot reach `localhost` on your machine — use a public URL or run RESTful UI locally with same-origin `/api/proxy`.

**Default is OFF.** Use direct calls when CORS already works or you do not want try-it-out traffic on the proxy operator’s server.

## Privacy and data paths

**Proxy OFF (default)** — Try it out uses **direct** `fetch` from the browser to the **target API**. URLs, headers, bodies, and API keys are **not sent to the RESTful UI server**.

**Proxy ON** — Traffic goes through the configured proxy server (same-origin `/api/proxy` or an external URL); **that server sees request contents** (disable logging in production).

**Also note**

- The browser still sends data to the target API (their logs and CORS are outside RESTful UI’s control)
- **Saved OpenAPI configs** (ConfigStore) are server-side in server build mode (separate from try-it-out)
- Caching in [step 5](#5-browser-side-retention) stays in the browser; try-it-out responses are not uploaded to the server by design

Details: [docs/network-and-security.md](docs/network-and-security.md)

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm run dev    # http://localhost:4210
```

For deployment and `STORE_TYPE`, see [docs/deployment.md](docs/deployment.md) and [docs/development.md](docs/development.md).

## Documentation

| Document | Contents |
|----------|----------|
| [docs/exploring-apis.md](docs/exploring-apis.md) | API exploration, try it out, `x-restfului-link` |
| [docs/deployment.md](docs/deployment.md) | Build modes and deployment |
| [docs/development.md](docs/development.md) | Internal architecture and plugins |
| [docs/network-and-security.md](docs/network-and-security.md) | CORS, proxy, traffic paths, stored data |
| [docs/mcp.md](docs/mcp.md) | MCP integration |
| [docs/ja/](docs/ja/README.md) | Japanese docs |
| [README.ja.md](README.ja.md) | Japanese README |

## Tech stack

- SvelteKit + TypeScript
- Svelte Material UI (SMUI)
- OpenAPI/Swagger (`@apidevtools/swagger-parser`)
- Vitest + Playwright
- Model Context Protocol

## License

[MIT](LICENSE)
