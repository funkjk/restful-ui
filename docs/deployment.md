# Build modes and deployment

How **static** and **server** build modes differ in RESTful UI, and how to deploy each.

## Chapter 1 — Choosing a build mode

| | Static (`BUILD_MODE=static`) | Server (`BUILD_MODE=server`, default) |
|--|------------------------------|---------------------------------------|
| Explore & try it out | Yes | Yes |
| Build | `BUILD_MODE=static` | `BUILD_MODE=server` (default when unset) |
| Try-it-out traffic | Browser → target API **directly** | Same when proxy is OFF |
| CORS proxy | Not available | Optional (Settings, **OFF by default**) |
| Server-side saved configs | No | ConfigStore |
| MCP over HTTP | No | `/api/mcp`, etc. |

Public demos: static → [Explorer (GitHub Pages)](https://funkjk.github.io/restful-ui/) / server → [Full (Vercel)](https://restful-ui.vercel.app/)

### When to use which

- **Just trying APIs locally** — static demo on GitHub Pages, or `pnpm run dev`
- **Internal APIs, saved configs, MCP** — self-host server build mode (any PaaS such as Vercel works)
- **Secrets or production data** — prefer self-host over public demos ([network-and-security.md](network-and-security.md))

Local `pnpm run dev` runs **server build mode** (API routes, proxy, ConfigStore, MCP enabled).

---

## Chapter 2 — Static build mode

With `BUILD_MODE=static`, `adapter-static` is selected and only static files are emitted ([`svelte.config.js`](../svelte.config.js)).

### What works and what does not

- Load OpenAPI in the browser and try it out
- Server APIs such as `/api/proxy`, `/api/configs`, `/api/mcp` **do not exist**
- Persist tab and proxy UI are hidden (see [development.md](development.md), Static build mode code paths)

The public Explorer demo on GitHub Pages uses this mode. For hosting details, see the repository’s CI configuration.

### Subpath hosting

When serving from a subdirectory, set `BUILD_BASE_PATH` (e.g. `/restful-ui`).

```bash
BUILD_MODE=static BUILD_BASE_PATH=/restful-ui pnpm run build
```

`fallback: 'index.html'` is configured so the app runs as an SPA.

### Build-time environment (minimal example)

Static builds may need dummy env for `$env/static/private`:

```bash
export BUILD_MODE=static
export BUILD_BASE_PATH=/restful-ui
export STORE_TYPE=inmemory
export KV_REST_API_URL=https://build.invalid
export KV_REST_API_TOKEN=build-dummy
pnpm exec svelte-kit sync
pnpm run build
```

---

## Chapter 3 — Deploying server build mode

### Common steps

1. Leave `BUILD_MODE` **unset** (defaults to `server`). Do not set `static`
2. Configure environment variables on the host ([Environment variables](#environment-variables), [ConfigStore](#configstorestore_type))
3. Run `pnpm run build` and deploy to a **runtime that serves the API routes below**

### Required API routes

Server build mode needs these SvelteKit API routes on the host:

| Route | Purpose |
|-------|---------|
| `/api/proxy` | CORS proxy |
| `/api/configs`, `/api/configs/[id]` | Config CRUD |
| `/api/mcp`, `/api/mcp/init`, `/api/mcp/[cid]` | MCP |

Server build mode does not work on static-only hosts.

### Environment variables

See [`.env.example`](../.env.example).

| Variable | Purpose |
|----------|---------|
| `STORE_TYPE` | ConfigStore implementation (table below) |
| `DATABASE_URL` | When `STORE_TYPE=postgres` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | When `STORE_TYPE=upstash` |

### ConfigStore (`STORE_TYPE`)

| Value | Use | Production-ready |
|-------|-----|------------------|
| `fs` | Local files (`mcp-configs/`) | Local runs |
| `inmemory` | In-memory only | Dev / E2E |
| `upstash` | Upstash Redis | Serverless |
| `postgres` | PostgreSQL | Production |

### Hosting examples

#### Vercel (default adapter in this repo)

[`svelte.config.js`](../svelte.config.js) selects `@sveltejs/adapter-vercel` for server build mode. No adapter swap is required.

1. Connect the repository to Vercel
2. Set environment variables
3. Deploy (build command: `pnpm run build`)

The public [Full (Vercel)](https://restful-ui.vercel.app/) demo uses this setup.

#### Self-managed server (adapter-node, etc.)

On hosts other than Vercel, swap the SvelteKit adapter (e.g. `@sveltejs/adapter-node`).

- Change the adapter in `buildAdapter()` in [`svelte.config.js`](../svelte.config.js) when `BUILD_MODE !== 'static'`
- Run behind a Node process, Docker, nginx reverse proxy, etc.
