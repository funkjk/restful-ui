
# My CloudHub Portal

SvelteKitベースのRESTful UIポータルアプリケーションです。OpenAPI仕様書を読み込んでインタラクティブなAPI探索とテストを提供します。

## 特徴

- 📋 OpenAPI v2/v3仕様書の自動解析
- 🔧 インタラクティブなAPI呼び出しテスト
- 📊 データテーブルでのレスポンス表示
- 🎨 Material UIベースのモダンなデザイン
- 🤖 **MCPサーバ機能（新機能）**

## MCP Server Integration

このプロジェクトには、OpenAPI仕様書からMCP（Model Context Protocol）サーバを作成する機能が統合されています。

### MCPサーバの使用方法

```bash
# 依存関係のインストール
pnpm install

# MCPサーバのテスト
pnpm run mcp:test

# PetStore APIでMCPサーバを起動
pnpm run mcp:example

# カスタムAPIでMCPサーバを起動
pnpm run mcp:start -- --url https://your-api.com/openapi.json
```

詳細な使用方法は [src/lib/mcp/README.md](src/lib/mcp/README.md) を参照してください。

## 開発環境のセットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバの起動
pnpm run dev
```

## 利用可能なスクリプト

### 開発・ビルド
- `pnpm run dev` - 開発サーバの起動（ポート4210）
- `pnpm run build` - プロダクションビルド
- `pnpm run preview` - ビルド結果のプレビュー

### テスト・品質チェック
- `pnpm run test` - Vitestでのユニットテスト
- `pnpm run e2e` - Playwrightでのe2eテスト
- `pnpm run lint` - ESLintでのコード品質チェック
- `pnpm run check` - TypeScriptとSvelteの型チェック

### MCPサーバ
- `pnpm run mcp:test` - MCPサーバのテスト
- `pnpm run mcp:start` - MCPサーバの起動
- `pnpm run mcp:example` - PetStore APIでのMCPサーバ起動例

### Storybook
- `pnpm run storybook` - Storybookの起動
- `pnpm run build-storybook` - Storybookのビルド

## プロジェクト構成

```
src/
├── lib/
│   ├── components/     # UIコンポーネント
│   ├── restful/        # REST API操作ロジック
│   ├── mcp/           # MCPサーバ実装 (NEW!)
│   ├── stores/        # Svelteストア
│   └── utils/         # ユーティリティ関数
├── routes/            # SvelteKitルート
└── theme/             # Material UIテーマ
```

## 技術スタック

- **フロントエンド**: SvelteKit + TypeScript
- **UI**: Svelte Material UI (SMUI)
- **API**: OpenAPI/Swagger 解析
- **テスト**: Vitest + Playwright
- **MCP**: Model Context Protocol Server
- **ビルド**: Vite