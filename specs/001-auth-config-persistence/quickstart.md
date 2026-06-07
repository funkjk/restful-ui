# Quick Start Guide: 認証機能とConfig情報のDBへの永続化

**Date**: 2025-01-27  
**Feature**: 001-auth-config-persistence

## 前提条件

- Node.js 18以上
- CockroachDB Serverlessアカウント（無料プラン）
- Clerkアカウント（無料プラン）

## セットアップ手順

### 1. Clerkのセットアップ

1. [Clerk](https://clerk.com)でアカウントを作成
2. 新しいアプリケーションを作成
3. API Keysを取得:
   - `PUBLIC_CLERK_PUBLISHABLE_KEY` (公開キー、PUBLIC_プレフィックスが必要)
   - `CLERK_SECRET_KEY` (秘密キー)
   - `CLERK_WEBHOOK_SIGNING_SECRET` (Webhook署名用、オプション)
4. Webhookエンドポイントを設定（オプション、ユーザー削除イベント用）:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - イベント: `user.deleted`

### 2. CockroachDBのセットアップ

1. [CockroachDB Cloud](https://cockroachlabs.cloud)でアカウントを作成
2. Serverlessクラスターを作成（無料プラン）
3. 接続文字列を取得（`DATABASE_URL`）

### 3. 環境変数の設定

`.env`ファイルを作成または更新:

```env
# Clerk
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# CockroachDB
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Clerk Webhook (オプション、ユーザー削除イベント用)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

### 4. パッケージのインストール

```bash
pnpm add svelte-clerk pg
pnpm add -D @types/pg
```

### 5. データベーススキーマの作成

CockroachDBに接続してスキーマを作成:

```sql
CREATE TABLE configurations (
  configuration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id STRING NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  INDEX idx_user_id (user_id)
);
```

### 6. 実装ファイルの作成

以下のファイルを作成:

1. `src/hooks.server.ts` - Clerkミドルウェア
2. `src/lib/auth/clerk.ts` - Clerkヘルパー
3. `src/lib/auth/middleware.ts` - 認証チェック
4. `src/lib/db/cockroach.ts` - データベース接続
5. `src/lib/restful/config-server/CockroachDBConfigStore.ts` - データベース実装
6. `src/routes/api/webhooks/clerk/+server.ts` - Webhookハンドラー（オプション）

### 7. 既存APIの更新

既存のAPIエンドポイントに認証チェックを追加:

- `src/routes/api/configs/+server.ts`
- `src/routes/api/configs/[id]/+server.ts`

### 8. フロントエンドの更新

認証UIコンポーネントを追加:

- サインイン/サインアップページ
- ユーザーボタン（ヘッダーなど）

## 動作確認

### 1. 開発サーバーの起動

```bash
pnpm dev
```

### 2. 認証フローのテスト

1. アプリケーションにアクセス
2. サインアップ/サインイン
3. 設定を作成
4. 設定一覧を確認
5. 設定を更新/削除

### 3. 未認証ユーザーのテスト

1. サインアウト
2. 設定一覧を取得（空のリストが返ることを確認）
3. 設定を作成しようとする（401エラーを確認）

### 4. データベースの確認

CockroachDBダッシュボードでデータが保存されていることを確認:

```sql
SELECT * FROM configurations;
```

## トラブルシューティング

### Clerk認証が動作しない

- 環境変数が正しく設定されているか確認
- `hooks.server.ts`が正しく設定されているか確認
- ブラウザのコンソールでエラーを確認

### データベース接続エラー

- `DATABASE_URL`が正しいか確認
- CockroachDBクラスターが起動しているか確認
- SSL接続が必要な場合は`?sslmode=require`を追加

### 設定が保存されない

- 認証状態を確認（ユーザーがログインしているか）
- データベーススキーマが正しく作成されているか確認
- ログでエラーを確認

## 次のステップ

- [ ] E2Eテストの実装
- [ ] エラーハンドリングの改善
- [ ] UIの改善
- [ ] パフォーマンス最適化（必要に応じて）

