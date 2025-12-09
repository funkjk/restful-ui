# Implementation Plan: 認証機能とConfig情報のDBへの永続化

**Branch**: `001-auth-config-persistence` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-config-persistence/spec.md`

## Summary

認証済みユーザーがAPI設定をデータベースに永続化できるようにし、未認証ユーザーは永続化できないようにする機能を実装します。Clerkを使用した認証統合とCockroachDBを使用したデータ永続化を実装します。

**技術的アプローチ**:
- Clerk (@clerk/sveltekit) を使用した認証統合
- CockroachDB (pgパッケージ) を使用したデータ永続化
- 既存のConfigStoreインターフェースを維持し、CockroachDB実装を追加
- SvelteKitの標準的な認証パターンに従った実装

## Technical Context

**Language/Version**: TypeScript 5.8.3, Node.js (SvelteKit 2.49.1)  
**Primary Dependencies**: 
- SvelteKit (既存)
- Clerk (認証サービス) - 新規追加
- CockroachDB (データベース) - 新規追加
- @clerk/sveltekit (Clerk SvelteKit統合) - 新規追加
- pg (PostgreSQL/CockroachDBクライアント) - 新規追加
**Storage**: CockroachDB (PostgreSQL互換)  
**Testing**: Vitest (既存), Playwright (既存)  
**Target Platform**: Web (SvelteKit SSR/SSG)  
**Project Type**: Web application (SvelteKit single project)  
**Performance Goals**: ベストエフォート（目標: 設定取得2秒以内、保存99%成功率）  
**Constraints**: 
- 既存のInMemoryConfigStoreからCockroachDBへの移行
- 既存APIエンドポイントとの互換性維持
- 未認証ユーザーは読み取り専用モードで使用可能
**Scale/Scope**: 個人開発プロジェクト、小規模ユーザーベース想定

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Cost-Effectiveness**: 
- ✅ Clerk: 無料プランあり（10,000 MAUまで無料）
- ✅ CockroachDB: 無料のServerlessプランあり（50M Request Units/月まで無料）
- ✅ すべての依存関係はオープンソースまたは無料プランで利用可能

**II. Simplicity First**: 
- ✅ 既存のConfigStoreインターフェースを維持し、実装のみ変更（InMemory → CockroachDB）
- ✅ ClerkのSvelteKit統合を使用（カスタム認証実装を避ける）
- ✅ シンプルなLast Write Wins競合解決（楽観的ロックなし）

**III. Personal Development Context**: 
- ✅ 個人開発プロジェクトに適したシンプルな実装
- ✅ 過度なエンタープライズ機能なし（例: 複雑な権限管理、監査ログ）

**IV. Pragmatic Testing**: 
- ✅ E2Eテスト: 認証フロー、設定保存/取得の主要シナリオ
- ✅ 単体テスト: データベース操作、認証ミドルウェア
- ✅ 手動テスト: UIの細かい調整

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-config-persistence/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── restful/
│   │   └── config-server/
│   │       ├── ConfigStore.ts          # インターフェース（既存）
│   │       ├── InMemoryConfigStore.ts  # 既存実装
│   │       ├── CockroachDBConfigStore.ts # 新規: CockroachDB実装
│   │       └── ServerSupport.ts        # 既存
│   ├── auth/
│   │   ├── clerk.ts                    # 新規: Clerk統合ヘルパー
│   │   └── middleware.ts               # 新規: 認証ミドルウェア
│   └── db/
│       └── cockroach.ts                # 新規: データベース接続管理
├── routes/
│   └── api/
│       └── configs/
│           ├── +server.ts              # 既存: 認証チェック追加
│           └── [id]/
│               └── +server.ts          # 既存: 認証チェック追加
└── hooks.server.ts                     # 新規: Clerk SvelteKit hooks

tests/
├── integration/
│   └── auth-config.spec.ts             # 新規: 認証付き設定操作のE2Eテスト
└── unit/
    └── CockroachDBConfigStore.spec.ts   # 新規: データベース操作の単体テスト
```

**Structure Decision**: 既存のSvelteKitプロジェクト構造を維持。新規ファイルは既存のディレクトリ構造に従って配置。認証関連は`src/lib/auth/`、データベース関連は`src/lib/db/`に分離。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| CockroachDB (外部データベース) | データ永続化の要件 | ファイルシステムストレージでは複数デバイス間での同期が困難 |
| Clerk (外部認証サービス) | 認証機能の実装を簡素化 | 自前実装はセキュリティリスクと開発コストが高い |
