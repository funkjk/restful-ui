# ビルドモードとデプロイ

RESTful UI の **静的ビルドモード** と **サーバービルドモード** の違い、および各自の載せ方を説明します。

## 第1章 — ビルドモードの選び方

| | 静的（`BUILD_MODE=static`） | サーバー（`BUILD_MODE=server`、既定） |
|--|------------------------------|--------------------------------------|
| 探索・Try it out | 可 | 可 |
| ビルド | `BUILD_MODE=static` | `BUILD_MODE=server`（未設定時も server） |
| Try it out の通信 | ブラウザ → 対象 API **直接** | プロキシ OFF 時は同左 |
| CORS プロキシ | 不可 | 任意（Settings、**既定 OFF**） |
| 設定のサーバー保存 | 不可 | ConfigStore |
| MCP over HTTP | 不可 | `/api/mcp` 系 |

公開デモ名: 静的 → <a href="https://funkjk.github.io/restful-ui/" target="_blank" rel="noopener noreferrer">Explorer（GitHub Pages）</a> / サーバー → <a href="https://restful-ui.vercel.app/" target="_blank" rel="noopener noreferrer">Full（Vercel）</a>

### 使い分け

- **手元で API を触るだけ** — 静的ビルドモードの公開デモ、または `pnpm run dev`
- **社内 API・設定保存・MCP** — サーバービルドモードを自己ホスト（Vercel など任意の PaaS でも可）
- **機密キーや本番データ** — 公開デモではなく自己ホストを推奨（[network-and-security.md](network-and-security.md)）

ローカルの `pnpm run dev` は **サーバービルドモード**（API ルート・プロキシ・ConfigStore・MCP が有効）です。

---

## 第2章 — 静的ビルドモード

`BUILD_MODE=static` でビルドすると `adapter-static` が選ばれ、静的ファイルのみが出力されます（[`svelte.config.js`](../../svelte.config.js)）。

### できること・できないこと

- ブラウザから OpenAPI を読み込み、Try it out 可能
- `/api/proxy`、`/api/configs`、`/api/mcp` など **サーバー API は存在しない**
- Persist タブ・プロキシ UI は非表示（[development.md](development.md) の「静的ビルドモードのコード分岐」参照）

公開デモ（GitHub Pages の Explorer）もこの方式です。ホスティング手順の詳細はリポジトリの CI 設定を参照してください。

### サブパス配信

サブディレクトリに載せる場合は `BUILD_BASE_PATH` を指定します（例: `/restful-ui`）。

```bash
BUILD_MODE=static BUILD_BASE_PATH=/restful-ui pnpm run build
```

SPA として動かすため `fallback: 'index.html'` が設定されています。

### ビルド時の環境変数（最小例）

静的ビルドでは `$env/static/private` 用にダミー env が必要な場合があります。

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

## 第3章 — サーバービルドモードのデプロイ

### 共通の手順

1. `BUILD_MODE` は **未設定のまま**（既定で `server`）。`static` にしない
2. ホスティング側に環境変数を設定（[環境変数](#環境変数)、[ConfigStore](#configstorestore_type)）
3. `pnpm run build` でビルドし、**下記 API ルートが動くランタイム**に載せる

### 必要な API ルート

サーバービルドモードでは、次の SvelteKit API ルートがホスト上で動く必要があります。

| ルート | 用途 |
|--------|------|
| `/api/proxy` | CORS プロキシ |
| `/api/configs`, `/api/configs/[id]` | 設定 CRUD |
| `/api/mcp`, `/api/mcp/init`, `/api/mcp/[cid]` | MCP |

静的ホストのみの環境ではサーバービルドモードは動きません。

### 環境変数

[`.env.example`](../../.env.example) を参照。

| 変数 | 用途 |
|------|------|
| `STORE_TYPE` | ConfigStore 実装（下表） |
| `DATABASE_URL` | `STORE_TYPE=postgres` 時 |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | `STORE_TYPE=upstash` 時 |

### ConfigStore（`STORE_TYPE`）

| 値 | 用途 | 本番向き |
|----|------|---------|
| `fs` | ローカルファイル（`mcp-configs/`） | ローカル実行向き |
| `inmemory` | メモリのみ | 開発・E2E |
| `upstash` | Upstash Redis | serverless 向き |
| `postgres` | PostgreSQL | 本番向き |

### ホスティングの例

#### Vercel（リポジトリ既定の adapter）

[`svelte.config.js`](../../svelte.config.js) ではサーバービルドモード時に `@sveltejs/adapter-vercel` が選ばれます。adapter の差し替えは不要です。

1. Vercel にリポジトリを接続
2. 環境変数を設定
3. デプロイ（ビルドコマンドは `pnpm run build`）

公開デモ <a href="https://restful-ui.vercel.app/" target="_blank" rel="noopener noreferrer">Full（Vercel）</a> もこの方式です。

#### 自前サーバー（adapter-node 等）

Vercel 以外では SvelteKit の adapter を差し替えます（例: `@sveltejs/adapter-node`）。

- [`svelte.config.js`](../../svelte.config.js) の `buildAdapter()` で `BUILD_MODE !== 'static'` のときの adapter を変更
- Node プロセス、Docker、nginx 等のリバースプロキシの背後で稼働させる


