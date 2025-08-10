
# RESTful UI portal application

A SvelteKit-based RESTful UI portal application that loads OpenAPI specifications and provides interactive API exploration and testing.

🌐 **Live Demo**: [https://restful-ui.vercel.app/](https://restful-ui.vercel.app/)

## Features

- 📋 Automatic parsing of OpenAPI v2/v3 specifications
- 🔧 Interactive API call testing
- 📊 Response display in data tables
- 🎨 Modern Material UI-based design
- 🤖 MCP Server functionality (New feature)

## Development Environment Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

## Available Scripts

### Development & Build
- `pnpm run dev` - Start development server (port 4210)
- `pnpm run build` - Production build
- `pnpm run preview` - Preview build results

### Testing & Quality Check
- `pnpm run test` - Unit tests with Vitest
- `pnpm run e2e` - E2E tests with Playwright
- `pnpm run lint` - Code quality check with ESLint
- `pnpm run check` - TypeScript and Svelte type checking

### MCP Server
- `pnpm run mcp:test` - MCP server testing
- `pnpm run mcp:start` - Start MCP server
- `pnpm run mcp:example` - MCP server startup example with PetStore API

### Storybook
- `pnpm run storybook` - Start Storybook
- `pnpm run build-storybook` - Build Storybook

## Project Structure

```
src/
├── lib/
│   ├── components/     # UI components
│   ├── restful/        # REST API operation logic
│   ├── mcp/           # MCP server implementation (NEW!)
│   ├── stores/        # Svelte stores
│   └── utils/         # Utility functions
├── routes/            # SvelteKit routes
└── theme/             # Material UI theme
```

## Technology Stack

- **Frontend**: SvelteKit + TypeScript
- **UI**: Svelte Material UI (SMUI)
- **API**: OpenAPI/Swagger parsing
- **Testing**: Vitest + Playwright
- **MCP**: Model Context Protocol Server
- **Build**: Vite
