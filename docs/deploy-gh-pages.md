# Deploy to GitHub Pages

## One-time repository setup (required)

If the **deploy** job fails with `404` / `Failed to create deployment`, GitHub Pages is not enabled for Actions yet.

1. Open **Settings → Pages** for the repository:  
   https://github.com/funkjk/restful-ui/settings/pages
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Save, then re-run the workflow (or push to `main`).

The workflow uses the `github-pages` environment on the deploy job. That environment is created when Pages is enabled.

## Workflow

- **build**: static Explorer (`BUILD_STATIC=true`, base path `/restful-ui`)
- **deploy**: `actions/deploy-pages@v4` publishes the uploaded artifact

## Local static build

Match CI env vars (especially KV dummies for `$env/static/private`):

```bash
export BUILD_STATIC=true
export BUILD_BASE_PATH=/restful-ui
export STORE_TYPE=inmemory
export KV_REST_API_URL=https://build.invalid
export KV_REST_API_TOKEN=build-dummy
pnpm exec svelte-kit sync
pnpm run build
```

On Git Bash (Windows), avoid path conversion for the base path:

```bash
MSYS_NO_PATHCONV=1 BUILD_BASE_PATH=/restful-ui ...
```

## URL

After a successful deploy: https://funkjk.github.io/restful-ui/
