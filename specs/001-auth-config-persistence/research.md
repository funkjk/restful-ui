# Research: 認証機能とConfig情報のDBへの永続化

**Date**: 2025-01-27  
**Feature**: 001-auth-config-persistence

## Clerk統合

### Decision: @clerk/sveltekit を使用してSvelteKitアプリケーションにClerkを統合

**Rationale**:
- ClerkはSvelteKit専用のパッケージ（@clerk/sveltekit）を提供
- サーバーサイドとクライアントサイドの両方で認証状態を管理可能
- SvelteKitのhooks.server.tsで認証ミドルウェアを実装可能
- 無料プランで10,000 MAUまで利用可能（個人開発に十分）

**Alternatives considered**:
- 自前の認証実装: セキュリティリスクと開発コストが高いため却下
- NextAuth.js: SvelteKitには対応していないため却下
- Auth.js (SvelteKit版): より複雑で、Clerkの方が統合が簡単

**Implementation approach**:
1. `@clerk/sveltekit`パッケージをインストール
2. `hooks.server.ts`でClerkの認証ミドルウェアを設定
3. 環境変数に`CLERK_PUBLISHABLE_KEY`と`CLERK_SECRET_KEY`を設定
4. クライアント側で`@clerk/sveltekit`のコンポーネントを使用（SignIn, SignUp, UserButton）
5. サーバー側で`getAuth()`を使用して認証状態を確認

**Key files**:
- `src/hooks.server.ts`: Clerkミドルウェア設定
- `src/lib/auth/clerk.ts`: Clerkヘルパー関数
- `src/lib/auth/middleware.ts`: 認証チェックミドルウェア

## CockroachDB統合

### Decision: pg (node-postgres) を使用してCockroachDBに接続

**Rationale**:
- CockroachDBはPostgreSQL互換プロトコルを使用
- `pg`パッケージは標準的で、CockroachDB Serverlessと互換性がある
- シンプルで軽量、追加のORM不要（YAGNI原則に合致）
- 無料のServerlessプランで50M Request Units/月まで利用可能

**Alternatives considered**:
- Prisma: 過剰な抽象化、個人開発には複雑すぎる
- Drizzle ORM: より軽量だが、pgで十分対応可能
- ファイルシステム: 複数デバイス間での同期が困難

**Implementation approach**:
1. `pg`パッケージをインストール
2. 接続プールを作成（`src/lib/db/cockroach.ts`）
3. CockroachDBConfigStoreを実装（既存のConfigStoreインターフェースを実装）
4. 環境変数に接続文字列を設定（`DATABASE_URL`）

**Database schema**:
```sql
CREATE TABLE configurations (
  configuration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id STRING NOT NULL,  -- Clerk user ID
  config JSONB NOT NULL,    -- ServerConfig data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  INDEX idx_user_id (user_id)
);
```

**Key files**:
- `src/lib/db/cockroach.ts`: データベース接続管理
- `src/lib/restful/config-server/CockroachDBConfigStore.ts`: データベース実装

## 認証ミドルウェア

### Decision: SvelteKitのhooks.server.tsとAPIルートで認証チェックを実装

**Rationale**:
- SvelteKitの標準的な認証パターンに従う
- 各APIエンドポイントで認証状態を確認するシンプルなアプローチ
- 過度な抽象化を避ける（YAGNI原則）

**Implementation approach**:
1. `src/lib/auth/middleware.ts`に認証チェック関数を作成
2. 各APIエンドポイント（POST, PUT, DELETE）で認証チェックを実行
3. 未認証の場合は401エラーを返す
4. GETエンドポイント（一覧取得）は未認証でも空のリストを返す

**Key pattern**:
```typescript
import { getAuth } from '@clerk/sveltekit/server';

export async function requireAuth(event: RequestEvent) {
  const { userId } = await getAuth(event);
  if (!userId) {
    throw error(401, 'Unauthorized');
  }
  return userId;
}
```

## ユーザー削除時のデータ処理

### Decision: ClerkのWebhookを使用してユーザー削除イベントを処理

**Rationale**:
- Clerkはユーザー削除時にWebhookを送信
- リアルタイムでデータを削除できる
- 手動での削除処理が不要

**Implementation approach**:
1. ClerkダッシュボードでWebhookエンドポイントを設定
2. `src/routes/api/webhooks/clerk/+server.ts`でWebhookを受信
3. `user.deleted`イベントを受信したら、該当ユーザーの設定を削除
4. Webhook署名を検証してセキュリティを確保

**Key files**:
- `src/routes/api/webhooks/clerk/+server.ts`: Webhookハンドラー

## データ移行戦略

### Decision: 既存のInMemoryConfigStoreからCockroachDBへの移行は段階的に実施

**Rationale**:
- 既存のデータはメモリ内のみ（サーバー再起動で消失）
- 新規実装ではCockroachDBを直接使用
- 既存ユーザーへの影響なし（新規データのみ永続化）

**Implementation approach**:
1. CockroachDBConfigStoreを実装
2. ConfigStore.tsで環境変数または設定で切り替え可能にする
3. デフォルトはCockroachDBを使用
4. 開発環境ではInMemoryConfigStoreも使用可能（テスト用）

## エラーハンドリング

### Decision: シンプルなエラーレスポンスとユーザーフィードバック

**Rationale**:
- 過度に複雑なエラーハンドリングは不要
- ユーザーに分かりやすいエラーメッセージを提供
- ログに詳細なエラー情報を記録

**Implementation approach**:
1. データベース接続エラー: 500エラーと「データベース接続に失敗しました」メッセージ
2. 認証エラー: 401エラーと「認証が必要です」メッセージ
3. バリデーションエラー: 400エラーと具体的なエラーメッセージ
4. すべてのエラーをWinstonログに記録（既存のログシステムを使用）

## セッション管理

### Decision: Clerkのセッション管理に依存

**Rationale**:
- Clerkがセッション管理を自動的に処理
- 追加の実装が不要
- セキュリティベストプラクティスに準拠

**Implementation approach**:
- Clerkのデフォルト設定を使用
- セッション有効期限はClerkの設定に従う（通常24時間）
- 必要に応じてClerkダッシュボードで調整可能

## まとめ

すべての技術的決定がConstitution原則に準拠:
- ✅ コスト効率: すべて無料プランで利用可能
- ✅ シンプルさ: 最小限の依存関係、過度な抽象化なし
- ✅ 個人開発: エンタープライズ機能なし
- ✅ 実用的なテスト: 主要なシナリオのみテスト

