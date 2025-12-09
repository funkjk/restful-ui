# Tasks: 認証機能とConfig情報のDBへの永続化

**Input**: Design documents from `/specs/001-auth-config-persistence/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: プロジェクトの初期化と基本構造の作成

- [x] T001 [P] 環境変数の設定: `.env`ファイルに`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`を追加（.env.exampleを作成）
- [x] T002 [P] パッケージのインストール: `pnpm add svelte-clerk pg`と`pnpm add -D @types/pg`を実行
- [x] T003 [P] ディレクトリ構造の作成: `src/lib/auth/`, `src/lib/db/`ディレクトリを作成

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーの実装前に完了すべき基盤インフラ

**⚠️ CRITICAL**: このフェーズが完了するまで、いかなるユーザーストーリーの作業も開始できません

- [x] T004 CockroachDBスキーマの作成: `configurations`テーブルを作成（`data-model.md`のスキーマ定義に従う）- schema.sqlを作成
- [x] T005 [P] データベース接続の実装: `src/lib/db/cockroach.ts`で接続プールを作成
- [x] T006 [P] Clerkミドルウェアの設定: `src/hooks.server.ts`でClerkの認証ミドルウェアを設定
- [x] T007 [P] Clerkヘルパーの実装: `src/lib/auth/clerk.ts`でClerk関連のヘルパー関数を作成
- [x] T008 [P] 認証ミドルウェアの実装: `src/lib/auth/middleware.ts`で`requireAuth`関数を実装
- [x] T009 CockroachDBConfigStoreの実装: `src/lib/restful/config-server/CockroachDBConfigStore.ts`でConfigStoreインターフェースを実装

**Checkpoint**: 基盤準備完了 - ユーザーストーリーの実装を並行して開始可能

---

## Phase 3: User Story 1 - 認証済みユーザーが設定を保存 (Priority: P1) 🎯 MVP

**Goal**: 認証済みユーザーがAPI設定をデータベースに保存し、後からアクセスできるようにする

**Independent Test**: 認証済みユーザーでサインインし、設定を作成・保存し、ブラウザを閉じて再度開き、設定がアクセス可能であることを確認

### Tests for User Story 1

> **NOTE: 実装前にこれらのテストを書き、失敗することを確認**

- [ ] T010 [P] [US1] E2Eテスト: 認証済みユーザーが設定を保存できることを確認するテストを`tests/integration/auth-config.spec.ts`に追加
- [ ] T011 [P] [US1] 単体テスト: CockroachDBConfigStoreの`writeConfig`メソッドのテストを`tests/unit/CockroachDBConfigStore.spec.ts`に追加

### Implementation for User Story 1

- [x] T012 [US1] ConfigStoreの切り替え: `src/lib/restful/config-server/ConfigStore.ts`で環境変数に基づいてCockroachDBConfigStoreまたはInMemoryConfigStoreを選択
- [x] T013 [US1] APIエンドポイントの認証チェック追加: `src/routes/api/configs/+server.ts`のPOSTメソッドに認証チェックを追加
- [x] T014 [US1] 設定保存の実装: CockroachDBConfigStoreの`writeConfig`メソッドを実装（user_idを含める）
- [x] T015 [US1] エラーハンドリング: データベース接続エラー時の適切なエラーメッセージを実装
- [ ] T016 [US1] ログの追加: 設定保存操作をWinstonログに記録

**Checkpoint**: この時点で、User Story 1は完全に機能し、独立してテスト可能であるべき

---

## Phase 4: User Story 2 - 未認証ユーザーは設定を永続化できない (Priority: P1)

**Goal**: 未認証ユーザーが設定を保存・更新・削除しようとした場合、認証エラーを返す

**Independent Test**: 未認証状態で設定の保存・更新・削除を試み、401エラーが返されることを確認

### Tests for User Story 2

- [ ] T017 [P] [US2] E2Eテスト: 未認証ユーザーが設定を保存しようとした場合の401エラーテストを`tests/integration/auth-config.spec.ts`に追加
- [ ] T018 [P] [US2] E2Eテスト: 未認証ユーザーが設定を更新しようとした場合の401エラーテストを追加
- [ ] T019 [P] [US2] E2Eテスト: 未認証ユーザーが設定を削除しようとした場合の401エラーテストを追加

### Implementation for User Story 2

- [x] T020 [US2] POSTエンドポイントの認証チェック: `src/routes/api/configs/+server.ts`のPOSTメソッドで`requireAuth`を使用
- [x] T021 [US2] PUTエンドポイントの認証チェック: `src/routes/api/configs/[id]/+server.ts`のPUTメソッドで`requireAuth`を使用
- [x] T022 [US2] DELETEエンドポイントの認証チェック: `src/routes/api/configs/[id]/+server.ts`のDELETEメソッドで`requireAuth`を使用
- [x] T023 [US2] GETエンドポイントの実装: `src/routes/api/configs/+server.ts`のGETメソッドで未認証ユーザーには空のリストを返す

**Checkpoint**: この時点で、User Stories 1 AND 2は両方とも独立して動作するべき

---

## Phase 5: User Story 3 - ユーザー認証フロー (Priority: P2)

**Goal**: ユーザーがサインイン・サインアウトでき、セッションが維持される

**Independent Test**: サインイン、サインアウト、セッション維持をテスト（設定機能なしでも動作する）

### Tests for User Story 3

- [ ] T024 [P] [US3] E2Eテスト: サインインフローのテストを`tests/integration/auth-flow.spec.ts`に追加
- [ ] T025 [P] [US3] E2Eテスト: サインアウトフローのテストを追加
- [ ] T026 [P] [US3] E2Eテスト: セッション維持のテストを追加

### Implementation for User Story 3

- [x] T027 [US3] サインインページの作成: `src/routes/sign-in/+page.svelte`でClerkの`SignIn`コンポーネントを使用
- [x] T028 [US3] サインアップページの作成: `src/routes/sign-up/+page.svelte`でClerkの`SignUp`コンポーネントを使用
- [x] T029 [US3] ユーザーボタンの追加: ヘッダーまたはナビゲーションにClerkの`UserButton`コンポーネントを追加
- [x] T030 [US3] 認証状態の表示: 認証状態に応じてUIを表示/非表示

**Checkpoint**: この時点で、User Stories 1, 2, AND 3はすべて独立して機能するべき

---

## Phase 6: User Story 4 - ユーザーは自分の設定のみを表示 (Priority: P2)

**Goal**: 認証済みユーザーが自分が作成した設定のみを表示・アクセスできる

**Independent Test**: 2人の認証済みユーザーで設定を作成し、各ユーザーが自分の設定のみを表示することを確認

### Tests for User Story 4

- [ ] T031 [P] [US4] E2Eテスト: ユーザーが自分の設定のみを表示するテストを`tests/integration/auth-config.spec.ts`に追加
- [ ] T032 [P] [US4] E2Eテスト: ユーザーが他のユーザーの設定にアクセスできないことを確認するテストを追加

### Implementation for User Story 4

- [x] T033 [US4] 設定一覧取得の実装: `src/routes/api/configs/+server.ts`のGETメソッドで`user_id`でフィルタリング
- [x] T034 [US4] 設定取得の実装: `src/routes/api/configs/[id]/+server.ts`のGETメソッドで`user_id`を検証
- [x] T035 [US4] 設定更新の実装: CockroachDBConfigStoreの`writeConfig`メソッドで`user_id`を検証
- [x] T036 [US4] 設定削除の実装: CockroachDBConfigStoreの`deleteConfig`メソッドで`user_id`を検証

**Checkpoint**: この時点で、すべてのユーザーストーリーが独立して機能するべき

---

## Phase 7: エッジケースと追加機能

**Purpose**: 仕様書で定義されたエッジケースと追加要件の実装

- [ ] T037 認証トークン期限切れ時の処理: 編集中の変更を一時保存し、再認証後に保存を完了できる機能を実装（FR-017）- ベストエフォート（クライアント側の実装が必要）
- [x] T038 同時更新の競合解決: Last Write Wins方式を実装（FR-018）- 既に実装済み（単純なUPDATE）
- [x] T039 データベース接続失敗時の処理: エラーメッセージを表示し、手動再試行を促す（FR-019）- エラーハンドリング実装済み
- [x] T040 ユーザー削除Webhookの実装: `src/routes/api/webhooks/clerk/+server.ts`で`user.deleted`イベントを処理し、設定を削除（FR-020）
- [x] T041 設定データのバリデーション: 既存の`validateConfig`関数を使用してデータを検証（FR-015）- 既に実装済み

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 複数のユーザーストーリーに影響する改善

- [x] T042 [P] ドキュメントの更新: `quickstart.md`の手順を検証し、必要に応じて更新
- [x] T043 コードのクリーンアップ: 未使用のインポートやコメントの整理
- [ ] T044 [P] 追加の単体テスト: 認証ミドルウェアの単体テストを`tests/unit/auth-middleware.spec.ts`に追加
- [x] T045 セキュリティの強化: SQLインジェクション対策の確認（パラメータ化クエリの使用）- すべてのクエリでパラメータ化クエリを使用
- [x] T046 ログの改善: すべての認証関連操作を適切にログに記録

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし - すぐに開始可能
- **Foundational (Phase 2)**: Setup完了に依存 - すべてのユーザーストーリーをブロック
- **User Stories (Phase 3-6)**: すべてFoundationalフェーズの完了に依存
  - ユーザーストーリーは並行して進めることができる（人員がいる場合）
  - または優先順位順に順次実行（P1 → P2）
- **Edge Cases (Phase 7)**: 主要なユーザーストーリーの完了に依存
- **Polish (Phase 8)**: すべての希望するユーザーストーリーの完了に依存

### User Story Dependencies

- **User Story 1 (P1)**: Foundational完了後に開始可能 - 他のストーリーに依存しない
- **User Story 2 (P1)**: Foundational完了後に開始可能 - US1と統合するが独立してテスト可能
- **User Story 3 (P2)**: Foundational完了後に開始可能 - 他のストーリーに依存しない
- **User Story 4 (P2)**: Foundational完了後に開始可能 - US1と統合するが独立してテスト可能

### Within Each User Story

- テスト（含まれる場合）は実装前に書き、失敗することを確認
- モデル → サービス → エンドポイントの順
- コア実装 → 統合の順
- ストーリー完了後に次の優先度に進む

### Parallel Opportunities

- Setupタスクの[P]マークは並行実行可能
- Foundationalタスクの[P]マークは並行実行可能（Phase 2内）
- Foundational完了後、すべてのユーザーストーリーを並行開始可能（チーム容量があれば）
- ユーザーストーリー内の[P]マークテストは並行実行可能
- ユーザーストーリー内の[P]マークモデルは並行実行可能
- 異なるユーザーストーリーは異なるチームメンバーが並行作業可能

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup完了
2. Phase 2: Foundational完了（CRITICAL - すべてのストーリーをブロック）
3. Phase 3: User Story 1完了
4. **STOP and VALIDATE**: User Story 1を独立してテスト
5. 準備ができればデプロイ/デモ

### Incremental Delivery

1. Setup + Foundational完了 → 基盤準備完了
2. User Story 1追加 → 独立してテスト → デプロイ/デモ（MVP!）
3. User Story 2追加 → 独立してテスト → デプロイ/デモ
4. User Story 3追加 → 独立してテスト → デプロイ/デモ
5. User Story 4追加 → 独立してテスト → デプロイ/デモ
6. 各ストーリーは前のストーリーを壊すことなく価値を追加

### Parallel Team Strategy

複数の開発者がいる場合:

1. チームでSetup + Foundationalを完了
2. Foundational完了後:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. ストーリーは独立して完了し、統合

---

## Notes

- [P]タスク = 異なるファイル、依存関係なし
- [Story]ラベルはタスクを特定のユーザーストーリーにマッピング（トレーサビリティのため）
- 各ユーザーストーリーは独立して完了・テスト可能であるべき
- 実装前にテストが失敗することを確認
- 各タスクまたは論理的なグループの後にコミット
- 任意のチェックポイントで停止してストーリーを独立して検証
- 避けるべき: 曖昧なタスク、同じファイルの競合、独立性を壊すストーリー間の依存関係

