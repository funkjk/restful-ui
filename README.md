
# RESTful UI

OpenAPI-based **REST CRUD Explorer** — browse operations, try requests, and drill down from list responses to related endpoints. The same execution core also powers MCP integration for AI clients.

## Live demos

| Edition | URL | Includes |
|---------|-----|----------|
| **Explorer** (static) | [GitHub Pages](https://funkjk.github.io/restful-ui/) | OAS explorer, path tree, try-it-out, bundled sample specs |
| **Full** (hosted) | [Vercel](https://restful-ui.vercel.app/) | + CORS proxy, saved configs, MCP over HTTP |

GitHub Pages is a static build only (`BUILD_STATIC=true`). Config persistence and MCP require the Full edition or local `pnpm run dev`.

## Features

- Automatic parsing of OpenAPI v2/v3 specifications
- Interactive API call testing
- Response display in data tables with CRUD-style navigation under path hierarchies
- Modern Material UI-based design
- MCP server (Full / local — shared `RestfulOperation` engine)
- Pluggable config storage (`STORE_TYPE`: fs, upstash, postgres, inmemory)

## Development

```bash
pnpm install
pnpm run dev          # http://localhost:4210 — full server (API routes)
```

### Build

```bash
pnpm run build              # default (Vercel adapter unless BUILD_STATIC=true)
pnpm run build:gh-pages     # static Explorer for GitHub Pages
pnpm run preview:gh-pages   # preview at /restful-ui base path
```

### Environment

Copy `.env.example` to `.env`. For local development without Redis/Postgres:

```bash
STORE_TYPE=fs
```

See [docs/deploy-gh-pages.md](docs/deploy-gh-pages.md) for GitHub Pages deployment.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Dev server (port 4210) |
| `pnpm run build` | Production build |
| `pnpm run build:gh-pages` | Static build for GitHub Pages |
| `pnpm run test` | Vitest |
| `pnpm run e2e` | Playwright |
| `pnpm run lint` | ESLint |
| `pnpm run check` | Svelte/TS check |

## Project structure

```
src/
├── lib/
│   ├── components/       # UI
│   ├── restful/          # OpenAPI execution, plugins, ConfigStore
│   ├── mcp/              # MCP server
│   └── utils/
├── routes/               # SvelteKit routes (+ api/* for Full edition)
└── theme/
docs/
└── deploy-gh-pages.md
```

## Tech stack

- SvelteKit + TypeScript
- Svelte Material UI (SMUI)
- OpenAPI/Swagger (`@apidevtools/swagger-parser`)
- Vitest + Playwright
- Model Context Protocol
