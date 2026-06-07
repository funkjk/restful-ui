# Self-hosting server build mode

Run **server build mode** features—optional CORS proxy, saved configs, MCP over HTTP—on your own infrastructure.

**日本語:** [ja/deployment.md](ja/deployment.md)

## Static vs server build mode

| | Static | Server (self-hosted) |
|--|--------|----------------------|
| Build | `BUILD_MODE=static` | Normal build (`adapter-vercel`, etc.) |
| Server | Not required | Node or serverless runtime |
| Proxy | No | Optional, OFF by default |
| ConfigStore | No | Yes |
| MCP HTTP | No | `/api/mcp`, etc. |

## Default: Vercel

The repo defaults to **Vercel** (`adapter-vercel` in `svelte.config.js`).

1. Connect the repo to Vercel
2. Set environment variables (below)
3. Deploy with `pnpm run build`

Do **not** set `BUILD_MODE=static` for server build mode (default is `BUILD_MODE=server` or unset).

## Environment variables (example)

| Variable | Purpose |
|----------|---------|
| `STORE_TYPE` | `fs` / `upstash` / `postgres` / `inmemory` |
| `DATABASE_URL` | When `STORE_TYPE=postgres` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | When `STORE_TYPE=upstash` |

`STORE_TYPE=fs` is a poor fit for serverless; prefer `upstash` or `postgres` in production.

## Other platforms

Change the SvelteKit adapter (e.g. `@sveltejs/adapter-node`).

- Replace the non-static adapter in `svelte.config.js` `buildAdapter()`
- Runtime must serve `/api/proxy`, `/api/configs`, `/api/mcp`
- Static-only hosts cannot run server build mode

## MCP

See [src/lib/mcp/README.md](../src/lib/mcp/README.md). Main routes: `/api/mcp`, `/api/mcp/init`.

## Security

- Proxy ON routes try-it-out through your host — [privacy-and-requests.md](privacy-and-requests.md)
- In production, set `CORS_ALLOWED_ORIGINS` to your RESTful UI origin(s); unset allows any origin on `/api/proxy`
- Keep secrets in hosting env only, not in git

## Related

- [development.md](development.md)
- [privacy-and-requests.md](privacy-and-requests.md)
- [deploy-gh-pages.md](deploy-gh-pages.md) — static build mode deploy only
- Japanese: [ja/deployment.md](ja/deployment.md)
