# Full 版の自己ホスト

Explorer（静的）以外の **Full 版** — CORS 用プロキシ、設定保存、MCP over HTTP — を自分の環境で動かす概要です。

## Explorer と Full の違い

| | Explorer | Full（自己ホスト） |
|--|----------|-------------------|
| ビルド | `BUILD_STATIC=true` | 通常ビルド（`adapter-vercel` 等） |
| サーバー | 不要（GitHub Pages 等） | Node サーバーまたはサーバーレス |
| プロキシ | 不可 | 任意（既定 OFF） |
| ConfigStore / Clerk | 不可 | 設定可能 |
| MCP HTTP | 不可 | `/api/mcp` 系 |

## 既定のデプロイ想定

リポジトリ既定は **Vercel**（`svelte.config.js` の `adapter-vercel`）です。

1. Vercel にリポジトリを接続
2. 環境変数を設定（下記）
3. `pnpm run build` でデプロイ

`BUILD_STATIC` は **設定しない**（または `false`）。Full 版として動かします。

## 必要な環境変数（例）

| 変数 | 用途 |
|------|------|
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk（設定保存・ログイン） |
| `CLERK_SECRET_KEY` | Clerk サーバー側 |
| `STORE_TYPE` | `fs` / `upstash` / `postgres` / `inmemory` |
| `DATABASE_URL` | `STORE_TYPE=postgres` 時 |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | `STORE_TYPE=upstash` 時 |

`STORE_TYPE=fs` はサーバーレスでは永続化に向きません。本番では `upstash` または `postgres` を推奨します。

## 別プラットフォームへ載せる場合

SvelteKit のアダプタを変更します（例: `@sveltejs/adapter-node`）。

- `svelte.config.js` の `buildAdapter()` で `BUILD_STATIC !== 'true'` のときの adapter を差し替え
- API ルート（`/api/proxy`, `/api/configs`, `/api/mcp`）が動くランタイムが必要
- 静的ホストのみの環境では Full 版は動きません

## MCP

HTTP 経由の MCP エンドポイントは Full 版で利用できます。ツールの詳細・Cursor 連携は [src/lib/mcp/README.md](../../src/lib/mcp/README.md) を参照してください。

主なルート例:

- `/api/mcp` — MCP プロトコル
- `/api/mcp/init` — 初期化

## セキュリティ上の注意

- **プロキシ**を ON にすると、試行リクエストがホストサーバーを経由します。詳細は [privacy-and-requests.md](privacy-and-requests.md)
- 本番では `CORS_ALLOWED_ORIGINS` で自サイト Origin のみに絞ることを推奨（未設定時は任意 Origin から `/api/proxy` 利用可）
- 本番では Clerk・DB・KV のシークレットをホスティング側の環境変数にのみ置き、リポジトリにコミットしない

## 関連ドキュメント

- [development.md](development.md) — ローカル開発
- [privacy-and-requests.md](privacy-and-requests.md)
- [deploy-gh-pages.md](deploy-gh-pages.md) — Explorer のみ別デプロイ
- English: [../self-host.md](../self-host.md)
