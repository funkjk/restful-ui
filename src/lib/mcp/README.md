# OpenAPI MCP Server

OpenAPI/Swagger仕様書からMCPサーバを作成し、API呼び出し機能を提供するツールです。

## 特徴

- OpenAPI v2/v3仕様書の自動解析
- REST APIエンドポイントの自動ツール化
- 既存のRestfulOperationクラスを活用した堅牢なAPI呼び出し
- 設定可能なタイムアウト・再試行機能
- 環境変数とコマンドライン引数による設定

## 使用方法

### Webアプリケーションでの使用方法（推奨）

```bash
# 開発サーバを起動
pnpm run dev

# ブラウザで http://localhost:4210/mcp-server にアクセス
# WebUIからOpenAPI URLを設定してMCPサーバを起動
```

**Cursorとの統合方法:**

1. 開発サーバを起動: `pnpm run dev`
2. ブラウザで http://localhost:4210/mcp-server にアクセス
3. OpenAPI URLを入力してMCPサーバを初期化
4. `mcp-config.json` をCursorのMCP設定として追加
5. CursorからHTTP経由で `http://localhost:4210/api/mcp` に自動接続

### 基本的な使用方法（コマンドライン）

```bash
# 簡単な使用方法（OpenAPI URLを直接指定）
npm run mcp:start https://petstore.swagger.io/v2/swagger.json

# 詳細な設定を指定
npm run mcp:start -- --url https://petstore.swagger.io/v2/swagger.json --name my-api-server --timeout 60000
```

### コマンドライン引数

```bash
npm run mcp:start -- [options]

Options:
  -u, --url <url>           OpenAPI specification URL (required)
  -n, --name <name>         MCP server name (default: openapi-mcp-server)
  -v, --version <version>   MCP server version (default: 1.0.0)
  -b, --base-url <url>      Base URL for API calls
  -t, --timeout <ms>        Request timeout in milliseconds (default: 30000)
  -r, --max-retries <num>   Maximum number of retries (default: 3)
  -d, --retry-delay <ms>    Delay between retries in milliseconds (default: 1000)
```

### 環境変数

```bash
export OPENAPI_URL="https://petstore.swagger.io/v2/swagger.json"
export MCP_SERVER_NAME="my-api-server"
export MCP_SERVER_VERSION="1.0.0"
export API_BASE_URL="https://api.example.com"
export API_TIMEOUT="60000"
export API_MAX_RETRIES="5"
export API_RETRY_DELAY="2000"

npm run mcp:start
```

## 使用例

### PetStore APIの例

```bash
# PetStore APIのMCPサーバを起動
npm run mcp:example
```

このコマンドは、Swagger PetStore APIのMCPサーバを起動します。
起動後、以下のようなツールが利用可能になります：

- `get_pet_petId`: ペットの情報を取得
- `post_pet`: 新しいペットを追加
- `put_pet`: ペット情報を更新
- `delete_pet_petId`: ペットを削除
- `get_pet_findByStatus`: ステータスでペットを検索
- など

### ツールの呼び出し例

MCPクライアントから以下のようにツールを呼び出すことができます：

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_pet_petId",
    "arguments": {
      "parameters": {
        "petId": "1"
      }
    }
  }
}
```

## 実装の詳細

### アーキテクチャ

1. **OpenAPI仕様書の解析**: `@apidevtools/swagger-parser`を使用してOpenAPI仕様書を読み込み・解析
2. **ツールの生成**: 各APIエンドポイントを個別のMCPツールとして自動生成
3. **API呼び出し**: 既存の`RestfulOperation`クラスを使用して実際のAPI呼び出しを実行
4. **レスポンス処理**: APIレスポンスをJSONフォーマットでMCPクライアントに返却

### ツール名の生成規則

APIエンドポイントからツール名は以下の規則で生成されます：

- HTTPメソッド + パス（特殊文字を`_`に置換）
- 例: `GET /pet/{petId}` → `get_pet_petId`
- 例: `POST /pet` → `post_pet`

### エラーハンドリング

- OpenAPI仕様書の読み込みエラー
- 無効なURLの検証
- API呼び出しのタイムアウト・再試行
- MCPプロトコルエラーのハンドリング

## 開発

### ファイル構成

```
src/lib/mcp/
├── openapi-mcp-server.ts  # メインのMCPサーバ実装
├── server.ts              # エントリーポイント
├── config.ts              # 設定管理
└── README.md              # このファイル
```

### テスト

```bash
# 開発環境での実行
npm run mcp:start -- --url https://your-api.com/openapi.json

# デバッグモード
DEBUG=1 npm run mcp:start -- --url https://your-api.com/openapi.json
```

## 制限事項

- 現在はHTTP/HTTPSのみサポート
- 認証機能は未実装（将来のバージョンで対応予定）
- WebSocketやServer-Sent Eventsは未サポート
- 大きなレスポンスサイズの制限なし（メモリ使用量に注意）

## トラブルシューティング

### よくある問題

1. **OpenAPI仕様書が読み込めない**
   - URLが正しいか確認
   - CORS設定を確認
   - ネットワーク接続を確認

2. **API呼び出しがタイムアウトする**
   - `--timeout`オプションで値を増加
   - `--max-retries`で再試行回数を調整

3. **MCPクライアントが接続できない**
   - stdio接続が正常に動作しているか確認
   - MCPクライアントの設定を確認

### デバッグ

```bash
# 詳細なログ出力
DEBUG=mcp:* npm run mcp:start -- --url https://your-api.com/openapi.json
``` 