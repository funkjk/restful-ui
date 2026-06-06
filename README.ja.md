# RESTful UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**English:** [README.md](README.md)

**RESTful な API を、OpenAPI から読み取り、一覧 → 個別リソース → 更新まで UI 上で辿れるエクスプローラーです。**

OpenAPI 仕様をもとにエンドポイントを展開し、パラメータを指定してブラウザから実行できます。同一の実行コア（`RestfulOperation`）は MCP（AI クライアント向け）でも利用できます。

## 何が便利か

- **OpenAPI からそのまま実行** — 仕様を解析し、エンドポイント・メソッド・パラメータを UI に展開して Try it out できる
- **RESTful な辿り方** — リソース一覧の取得後、行や ID から同じ API 群の GET / PUT / DELETE などへ進める
- **再試行しやすい** — GET 結果やパラメータ履歴をブラウザ側に保持し、同じリソースへ何度もアクセスしやすい（既定では試行内容を RESTful UI サーバーに送らない。詳細は [プライバシーとデータの行き先](#プライバシーとデータの行き先)）

## RESTful API の探索と実行の流れ

### 1. OpenAPI から呼び出し可能な操作を取り出す

OpenAPI v2/v3 を読み込み、path と HTTP メソッドごとの operation を一覧化します。パスパラメータ・クエリ・ボディをフォームから指定し、UI 上で API を呼び出せます。

### 2. 一覧から次の操作へ

一覧 GET のレスポンスをテーブル表示します。列の値（ID や path セグメントなど）から、**パス階層に沿った関連 operation**（GET 詳細、PUT、DELETE など）へドリルダウンできます。一覧で選んだ値が、次のリクエストのパラメータにそのまま載ります。

### 3. 下位エンドポイントへ進む

親リソースの配下にある子 path の operation へも同様に遷移できます。パスツリーで API 全体の階層を俯瞰しながら、目的のメソッドを選べます。

### 4. 更新（PUT など）のしやすさ

更新前に GET したレスポンスを土台に、変更したいフィールドだけを編集して PUT などを送れます。「実データを見てから書き換える」 RESTful な作業フローに近い操作ができます。

### 5. ブラウザ上の保持

GET したレスポンスやパラメータ履歴などを **ブラウザ（localStorage / Service Worker）** に保持します。同じリソースへの再アクセスや、似たリクエストの繰り返しがしやすくなります。

```
OpenAPI → 一覧 GET → テーブルで 1 件選択 → GET 詳細 / PUT / DELETE
                ↘ 下位 path の operation へ
```

## ライブデモ

| エディション | URL | 含まれる機能 |
|-------------|-----|-------------|
| **Explorer**（静的） | [GitHub Pages](https://funkjk.github.io/restful-ui/) | 上記の探索・実行、パスツリー、同梱サンプル spec |
| **Full**（ホスト型） | [Vercel](https://restful-ui.vercel.app/) | ＋ CORS 用プロキシ（任意）、設定の保存、MCP over HTTP |

ローカルの `pnpm run dev` は **Full 版相当**（API ルート・プロキシ・設定保存・MCP）です。

**§2 の探索・実行は Explorer でも利用できます。** 設定のサーバー保存・プロキシ・MCP は Full 版（またはローカル dev）のみです。

## 他の OpenAPI UI との違い

**Swagger UI や Scalar の置き換えではありません。**

一般的な OpenAPI UI が「仕様の閲覧と単発の Try it out」に重点を置くのに対し、RESTful UI は **REST 的な path 設計の API を、一覧から個別リソース、下位リソースへ辿りながら実行する** ことに重点を置いています。実行ロジックは MCP 連携でも再利用できます。

## エディション比較

| | Explorer（GitHub Pages） | Full（Vercel / ローカル dev） |
|--|--------------------------|-------------------------------|
| 探索・Try it out（§2） | 可 | 可 |
| ビルド | `BUILD_STATIC=true`、静的のみ | サーバーアダプタ（既定: Vercel） |
| Try it out の通信 | ブラウザ → 対象 API **直接** | 同上（プロキシ OFF 時） |
| CORS 用プロキシ | なし（サーバーなし） | 任意・**既定 OFF**（Settings） |
| OpenAPI 設定の保存 | なし | ConfigStore + Clerk |
| MCP over HTTP | なし | `/api/mcp` など |

## プロキシ（CORS 対策）

ブラウザの Try it out は **クロスオリジン** の `fetch` になります。対象 API が CORS を許可していないと、レスポンスが UI に表示されないことがあります。

**プロキシ ON**（Full のみ、Settings の「Use Restful-UI Proxy」）では、ブラウザは同一オリジンの `/api/proxy` のみを呼び、RESTful UI サーバーが対象 API に転送します。返却時に CORS ヘッダを付与するため、CORS 未対応の API でも試行しやすくなります。

**既定は OFF** です。CORS が通る API や、試行内容をホストに載せたくない場合はそのまま直接呼び出しで十分です。Explorer（静的ホスト）ではプロキシは使えません。

## プライバシーとデータの行き先

**プロキシ OFF（既定）** — Try it out はブラウザから **対象 API へ直接** `fetch` します。URL・ヘッダ・ボディ・API キーは **RESTful UI のサーバーには送られません**。

**プロキシ ON**（Full のみ） — リクエストはホストの `/api/proxy` を経由し、**運用者のサーバーに内容が届きます**（本番ではログ無効化を推奨）。

**あわせて**

- 対象 API にはブラウザから送信されます（相手側のログ・CORS は RESTful UI の管轄外）
- **保存した OpenAPI 設定**（ConfigStore）と **Clerk ログイン**は Full 版のサーバー側機能（Try it out とは別経路）
- §2.5 のキャッシュはブラウザ内のみで、試行レスポンスをサーバーに送る設計ではありません

詳細: [docs/ja/privacy-and-requests.md](docs/ja/privacy-and-requests.md)

## クイックスタート

```bash
pnpm install
cp .env.example .env
pnpm run dev    # http://localhost:4210
```

Clerk・`STORE_TYPE` などは [docs/ja/development.md](docs/ja/development.md) を参照してください。

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/ja/](docs/ja/README.md) | 日本語ドキュメント一覧 |
| [docs/ja/privacy-and-requests.md](docs/ja/privacy-and-requests.md) | CORS・プロキシ・通信経路・保存データ |
| [docs/ja/development.md](docs/ja/development.md) | ローカル開発、環境変数、スクリプト、テスト |
| [docs/ja/deploy-gh-pages.md](docs/ja/deploy-gh-pages.md) | GitHub Pages（Explorer）デプロイ |
| [docs/ja/self-host.md](docs/ja/self-host.md) | Full 版の自己ホスト |
| [README.md](README.md) | English README |

## 技術スタック

- SvelteKit + TypeScript
- Svelte Material UI (SMUI)
- OpenAPI/Swagger（`@apidevtools/swagger-parser`）
- Vitest + Playwright
- Model Context Protocol

## ライセンス

[MIT](LICENSE)
