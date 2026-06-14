# RESTful UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**English:** [README.md](README.md)

**RESTful な API を、OpenAPI から読み取り、一覧 → 個別リソース → 更新まで UI 上で辿れるエクスプローラーです。**

OpenAPI 仕様をもとにエンドポイントを展開し、パラメータを指定してブラウザから実行できます。同一の実行コア（`RestfulOperation`）は MCP（AI クライアント向け）でも利用できます。

![RESTful UI のデモ — OpenAPI を読み込み、エンドポイントを試行し、レスポンスを表示](docs/assets/restfului-example.gif)

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

| ビルドモード | URL | 含まれる機能 |
|-------------|-----|-------------|
| **静的**（Explorer デモ） | [GitHub Pages](https://funkjk.github.io/restful-ui/) | 上記の探索・実行、パスツリー、同梱サンプル spec。外部プロキシ URL（`PUBLIC_CORS_PROXY_URL`）で CORS プロキシも可 |
| **サーバー**（Full デモ） | [Vercel](https://restful-ui.vercel.app/) | ＋ 同一オリジン `/api/proxy`、設定の保存、MCP over HTTP |

ローカルの `pnpm run dev` は **サーバービルドモード**（API ルート・プロキシ・設定保存・MCP）です。

**§2 の探索・実行は静的ビルドモードでも利用できます。** 設定のサーバー保存と MCP はサーバービルドモード（またはローカル dev）のみです。CORS プロキシは、**Proxy base URL** を cors-anywhere 互換の外部サーバーに向ければ静的ビルドでも利用できます（GitHub Pages デモは Vercel Full デモの `/api/proxy` を使用）。

## 他の OpenAPI UI との違い

**Swagger UI や Scalar の置き換えではありません。**

一般的な OpenAPI UI が「仕様の閲覧と単発の Try it out」に重点を置くのに対し、RESTful UI は **REST 的な path 設計の API を、一覧から個別リソース、下位リソースへ辿りながら実行する** ことに重点を置いています。実行ロジックは MCP 連携でも再利用できます。

## ビルドモード比較

| | 静的（`BUILD_MODE=static`） | サーバー（`BUILD_MODE=server`、既定） |
|--|------------------------------|--------------------------------------|
| 探索・Try it out（§2） | 可 | 可 |
| ビルド | `BUILD_MODE=static`、静的アダプタ | サーバーアダプタ（既定: Vercel） |
| Try it out の通信 | ブラウザ → 対象 API **直接** | 同上（プロキシ OFF 時） |
| CORS 用プロキシ | **外部**プロキシ URL で任意（`PUBLIC_CORS_PROXY_URL`）。同一オリジン `/api/proxy` はなし | 同一オリジン `/api/proxy` または外部 URL。任意・**既定 OFF**（Settings） |
| OpenAPI 設定の保存 | なし | ConfigStore |
| MCP over HTTP | なし | `/api/mcp` など |

## プロキシ（CORS 対策）

ブラウザの Try it out は **クロスオリジン** の `fetch` になります。対象 API が CORS を許可していないと、レスポンスが UI に表示されないことがあります。

**プロキシ ON**（Settings → **Use CORS proxy**）では、ブラウザは **cors-anywhere 互換** のプロキシベース URL を呼びます。対象 URL は 1 つのエンコード済みパスとして付与されます: `{proxyBase}/{encodeURIComponent(targetUrl)}`。

| ビルドモード | プロキシベースの初期値 |
|-------------|----------------------|
| サーバー（`pnpm run dev` 含む） | 同一オリジン `/api/proxy` |
| 静的 | ビルド時の `PUBLIC_CORS_PROXY_URL`（GitHub Pages デモ → Vercel Full デモ） |

**Proxy base URL** は Settings と OpenAPI URL 入力画面で上書きできます。リモートプロキシは手元 PC の `localhost` には到達できません — 公開 URL を使うか、ローカルで RESTful UI を動かして同一オリジン `/api/proxy` を使ってください。

**既定は OFF** です。CORS が通る API や、試行内容をプロキシ運用者のサーバーに載せたくない場合は直接呼び出しのままで十分です。

## プライバシーとデータの行き先

**プロキシ OFF（既定）** — Try it out はブラウザから **対象 API へ直接** `fetch` します。URL・ヘッダ・ボディ・API キーは **RESTful UI のサーバーには送られません**。

**プロキシ ON** — リクエストは設定されたプロキシサーバー（同一オリジン `/api/proxy` または外部 URL）を経由し、**そのサーバーに内容が届きます**（本番ではログ無効化を推奨）。

**あわせて**

- 対象 API にはブラウザから送信されます（相手側のログ・CORS は RESTful UI の管轄外）
- **保存した OpenAPI 設定**（ConfigStore）はサーバービルドモードのサーバー側機能（Try it out とは別経路）
- §2.5 のキャッシュはブラウザ内のみで、試行レスポンスをサーバーに送る設計ではありません

詳細: [docs/ja/network-and-security.md](docs/ja/network-and-security.md)

## クイックスタート

```bash
pnpm install
cp .env.example .env
pnpm run dev    # http://localhost:4210
```

`STORE_TYPE` などは [docs/ja/deployment.md](docs/ja/deployment.md) を参照してください。

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/ja/](docs/ja/README.md) | 日本語ドキュメント一覧 |
| [docs/ja/exploring-apis.md](docs/ja/exploring-apis.md) | API の探索・OpenAPI 拡張 |
| [docs/ja/deployment.md](docs/ja/deployment.md) | ビルドモードとデプロイ |
| [docs/ja/development.md](docs/ja/development.md) | 内部構成・プラグイン |
| [docs/ja/network-and-security.md](docs/ja/network-and-security.md) | 通信経路・セキュリティ |
| [docs/ja/mcp.md](docs/ja/mcp.md) | MCP 連携 |
| [README.md](README.md) | English README |

## 技術スタック

- SvelteKit + TypeScript
- Svelte Material UI (SMUI)
- OpenAPI/Swagger（`@apidevtools/swagger-parser`）
- Vitest + Playwright
- Model Context Protocol

## ライセンス

[MIT](LICENSE)
