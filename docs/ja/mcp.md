# MCP 連携

RESTful UI の **サーバービルドモード** では、OpenAPI 仕様から **MCP（Model Context Protocol）** ツールを生成し、AI クライアント（Cursor 等）から HTTP 経由で API を呼び出せます。

## 概要

- **サーバービルドモード限定** — 静的ビルドモードには MCP エンドポイントがありません
- UI と MCP は同じ [`RestfulOperation`](../../src/lib/restful/RestfulOperation.ts) とプラグインを共用します（[development.md](development.md) の「MCP との共用」参照）
- OpenAPI の各 path × method が MCP tool として公開されます

## 主な HTTP ルート

| ルート | 用途 |
|--------|------|
| `POST /api/mcp/init` | MCP サーバーの初期化・起動 |
| `GET /api/mcp/init` | サーバー状態の取得 |
| `DELETE /api/mcp/init` | サーバーの停止 |
| `GET /api/mcp` | MCP（SSE） |
| `POST /api/mcp` | MCP メッセージ（JSON-RPC 形式） |
| `/api/mcp/[cid]` | 設定 ID ごとの MCP エンドポイント |

## 基本的な流れ（Cursor 連携）

1. サーバービルドモードを起動（`pnpm run dev` または自己ホスト）
2. OpenAPI 設定を ConfigStore に保存し、`/cid/{configurationId}/` で読み込む
3. `POST /api/mcp/init` で MCP サーバーを初期化（`configurationId` を指定可能）
4. Cursor の MCP 設定で `http://localhost:4210/api/mcp`（または `/api/mcp/{cid}`）を登録
5. AI クライアントから tool として各 API operation を呼び出す

ツール名は `GET /pet/{petId}` → `get_pet_petId` のように、メソッド + path から自動生成されます。

## リクエスト設定

MCP 実行時も [`McpRequestSettingsPlugin`](../../src/lib/mcp/McpRequestSettingsPlugin.ts) 経由で、保存済みの `requestSettings`（headers, basePath, query）が適用されます。UI の Settings と同じ設定が MCP にも反映されます。

## セキュリティ

- MCP 経由の API 呼び出しは **RESTful UI サーバーから**対象 API へ outbound します
- 機密 API や本番データには **自己ホスト** を推奨します — [network-and-security.md](network-and-security.md)
- 公開デモ（Vercel）上の MCP は第三者運用です
