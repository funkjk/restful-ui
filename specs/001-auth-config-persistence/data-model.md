# Data Model: 認証機能とConfig情報のDBへの永続化

**Date**: 2025-01-27  
**Feature**: 001-auth-config-persistence

## Entities

### Configuration

設定情報を表すエンティティ。認証済みユーザーが作成したAPI設定を永続化します。

**Attributes**:
- `configuration_id` (UUID, Primary Key): 設定の一意の識別子
- `user_id` (STRING, NOT NULL, Indexed): Clerkから提供されるユーザーID
- `config` (JSONB, NOT NULL): ServerConfig形式の設定データ
- `created_at` (TIMESTAMPTZ, NOT NULL, Default: now()): 作成日時
- `updated_at` (TIMESTAMPTZ, NOT NULL, Default: now()): 最終更新日時

**Relationships**:
- 1 User → N Configurations (1対多)
- Configurationは必ず1つのUserに属する

**Validation Rules**:
- `user_id`は必須（NULL不可）
- `config`は必須で、以下のフィールドを含む必要がある:
  - `openApiUrl` (string, required)
  - `serverName` (string, required)
  - `serverVersion` (string, required)
  - `timeout` (number, required)
  - `maxRetries` (number, required)
  - `requestSettings` (object, required)
  - `useProxy` (boolean, optional)

**State Transitions**:
- Created: 新規作成時
- Updated: 更新時（updated_atが自動更新）
- Deleted: 削除時（物理削除）

**Database Schema**:
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

### User (External)

Clerkが管理するユーザーエンティティ。アプリケーション内では直接管理しません。

**Attributes** (Clerkから提供):
- `id` (string): ClerkのユーザーID
- `emailAddresses` (array): メールアドレス一覧
- `firstName` (string, optional): 名
- `lastName` (string, optional): 姓
- `createdAt` (timestamp): アカウント作成日時
- `lastSignInAt` (timestamp, optional): 最終サインイン日時

**Relationships**:
- 1 User → N Configurations (1対多)

**Note**: ユーザー情報はClerkが管理するため、データベースには保存しません。設定テーブルには`user_id`のみを保存します。

## Data Access Patterns

### Read Operations

1. **List configurations by user**:
   ```sql
   SELECT * FROM configurations 
   WHERE user_id = $1 
   ORDER BY updated_at DESC;
   ```

2. **Get configuration by ID (with user check)**:
   ```sql
   SELECT * FROM configurations 
   WHERE configuration_id = $1 AND user_id = $2;
   ```

### Write Operations

1. **Create configuration**:
   ```sql
   INSERT INTO configurations (user_id, config)
   VALUES ($1, $2)
   RETURNING *;
   ```

2. **Update configuration**:
   ```sql
   UPDATE configurations 
   SET config = $1, updated_at = now()
   WHERE configuration_id = $2 AND user_id = $3
   RETURNING *;
   ```

3. **Delete configuration**:
   ```sql
   DELETE FROM configurations 
   WHERE configuration_id = $1 AND user_id = $2;
   ```

4. **Delete all configurations by user** (アカウント削除時):
   ```sql
   DELETE FROM configurations 
   WHERE user_id = $1;
   ```

## Data Integrity

### Constraints

- **Primary Key**: `configuration_id`は一意
- **Foreign Key**: `user_id`はClerkのユーザーIDを参照（アプリケーションレベルで検証）
- **NOT NULL**: `user_id`, `config`, `created_at`, `updated_at`は必須
- **Index**: `user_id`にインデックスを設定してクエリ性能を向上

### Validation

- 設定データのバリデーションは既存の`validateConfig`関数を使用
- データベースレベルではJSONBの構造検証は行わない（アプリケーションレベルで検証）

## Migration Strategy

### From InMemoryConfigStore

既存のInMemoryConfigStoreからCockroachDBへの移行:

1. **新規実装**: CockroachDBConfigStoreを実装
2. **切り替え**: 環境変数または設定でストアを切り替え可能にする
3. **既存データ**: メモリ内のデータは移行しない（サーバー再起動で消失するため）
4. **後方互換性**: ConfigStoreインターフェースを維持して既存コードとの互換性を保つ

## Performance Considerations

### Indexes

- `user_id`にインデックスを設定（ユーザーごとの設定一覧取得を高速化）
- `updated_at`でソートするため、必要に応じて複合インデックスを検討

### Query Optimization

- ユーザーごとの設定一覧取得は`user_id`インデックスを使用
- 設定取得時は`configuration_id`と`user_id`の両方でフィルタリング（セキュリティと性能の両立）

## Security Considerations

### Data Isolation

- すべてのクエリで`user_id`を条件に含める（データ分離を保証）
- 設定取得時は必ず`user_id`を検証（他のユーザーの設定にアクセスできないようにする）

### Data Deletion

- ユーザーアカウント削除時は即座にすべての設定を削除（FR-020）
- 物理削除を実施（論理削除は不要）

