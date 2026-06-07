# API の探索と OpenAPI 拡張

RESTful UI で OpenAPI を読み込み、一覧から詳細へ辿りながら API を試す手順と、`x-restfului-link` 拡張の書き方を説明します。

## Part A — 基本的な使い方

### 1. OpenAPI の読み込み

トップページで OpenAPI の URL を入力し **set** を押します。仕様が解析されると API TOP が表示され、左ドロワーにパスツリーが現れます。

![OpenAPI 読み込み後の API TOP](../assets/ja-01-openapi-top.png)

- OpenAPI v2 / v3 に対応（`@apidevtools/swagger-parser` で `$ref` を解決）
- 同梱サンプルは `static/oas/` にあり、ローカルでは `/oas/...` で参照できます

**Try it**

- デモ: <a href="https://funkjk.github.io/restful-ui/" target="_blank" rel="noopener noreferrer">GitHub Pages（静的ビルドモード / Explorer デモ）</a>
- Spec: `https://petstore.swagger.io/v2/swagger.json`

---

### 2. パス階層でのドリルダウン

一覧 GET のレスポンスが配列のとき、テーブル表示されます。列の値（ID など）の横にある **list** ボタンから、下位 path の operation へ進めます。

RESTful UI は現在の path より **深い path**（例: `/configs` → `/configs/{configurationId}`）を OpenAPI 定義から自動検出します（`getUnderOperations`）。

![コレクション GET のテーブル](../assets/ja-02-collection-table.png)

**手順（同梱サンプル `restful-api-sample-config.yaml` の例）**

1. ローカルで `/oas/restful-api-sample-config.yaml` を読み込む
2. Settings で **Base path** を `http://localhost:4210/api` に設定して **Save**（`pnpm run dev` 時）
3. `GET /configs` を開いて **Execute**
4. テーブルの `configurationId` 列で **list** をクリック
5. ダイアログ内の `GET /configs/{configurationId}` などを選ぶ — 選択した ID が次のリクエストのパラメータに載ります

![PathLink ダイアログ](../assets/ja-03-path-link-dialog.png)

**Try it**

- ローカル: `/oas/restful-api-sample-config.yaml` → Settings → Base path を `http://localhost:4210/api` → `GET /configs`

---

### 3. パスツリー

左ドロワーで API 全体の path 階層を俯瞰し、メソッドリンクから operation へジャンプできます。

![パスツリー](../assets/ja-04-path-tree.png)

---

### 4. PUT ワークフロー

更新系メソッドでは、直前の GET 結果や body 履歴を土台に編集できます。

1. 対象リソースを `GET` する
2. 成功した GET はブラウザ側にキャッシュされる（同じ URL・初期パラメータのとき再表示）
3. `PUT` / `POST` では **Parameter histories** から過去の body を呼び出せる
4. 変更したいフィールドだけ編集して **Execute**

キャッシュの実装は `CachedRestfulPlugin` と Service Worker 経由の IndexedDB です。詳細は [development.md](development.md) の「ブラウザストレージ」を参照してください。

---

### 5. テーブル表示

- レスポンス body の **トップレベルが配列** のときテーブル化
- ネストした配列は **Select table key** で対象キーを選択
- 列フィルタ・表示列の選択は operation ごとに sessionStorage に保存

PathLink 列（list ボタン）は次の条件で有効になります。

- 下位 path に `{param}` がある列（path パラメータ名と列名が一致）
- `x-restfului-link` が schema に定義されている列（Part B 参照）

---

### 6. Settings（リクエスト設定）

ドロワーの **Setting** から共通設定を変更できます。

![Settings 画面](../assets/ja-05-settings.png)

| 項目 | 説明 |
|------|------|
| Base path | OpenAPI の base URL を実行時 URL に差し替え |
| Headers | 全リクエストに付与するヘッダ |
| Additional query | 全 URL に追加するクエリ文字列 |
| Use CORS proxy | CORS 回避用プロキシ（**既定 OFF**） |
| Proxy base URL | cors-anywhere 互換のプロキシベース URL。初期値は `PUBLIC_CORS_PROXY_URL`、未設定時は同一オリジンの `/api/proxy` |

トップ画面の OAS URL 入力でも同様にプロキシ ON/OFF と Proxy base URL を指定できます。プロキシ ON/OFF と通信経路の詳細は [network-and-security.md](network-and-security.md) を参照してください。

---

## Part B — OpenAPI 拡張 `x-restfului-link`

RESTful UI 固有の拡張は **`x-restfului-link`** です。path 階層だけでは辿れない関連 operation（別 path・クエリ付き GET など）へのリンクを、レスポンス schema 上で明示できます。

### 記述場所

- 200 レスポンス schema の **property**
- **array 型** の場合は `items` に記述

### 形式

```yaml
# 単一リンク
id:
  type: string
  x-restfului-link: /custom/configs/{id}

# 複数リンク（配列）
"owl:sameAs":
  type: string
  x-restfului-link:
    - "/odpt:StationTimetable?odpt:calendar={owl:sameAs}"
```

リンク先の HTTP メソッドは **GET 固定** です。path と query は OpenAPI の path キーに合わせて記述します。

### プレースホルダ

| プレースホルダ | 置換される値 |
|---------------|-------------|
| `{value}` / `{$value}` | セルの値 |
| `{列名}` | 列名と一致するときセルの値 |
| `{その他}` | 行オブジェクトの同名フィールド（例: `{owl:sameAs}`） |

### 例 1 — 自プロジェクトのサンプル

[`static/oas/restful-api-sample-config.yaml`](../../static/oas/restful-api-sample-config.yaml):

```yaml
id:
  type: string
  x-restfului-link: /custom/configs/{id}
```

**Try it**

- ローカル: `/oas/restful-api-sample-config.yaml` を読み込み、`GET /custom/configs/` を実行

### 例 2 — ODPT API（path 階層外へのリンク）

[`static/oas/odpt-api-openapi.yaml`](../../static/oas/odpt-api-openapi.yaml):

```yaml
"owl:sameAs":
  type: string
  x-restfului-link:
    - "/odpt:StationTimetable?odpt:calendar={owl:sameAs}"
```

カレンダー ID から時刻表 API へ、**別 path + クエリ** でジャンプする例です。

**Try it**

- ローカル: `/oas/odpt-api-openapi.yaml` を読み込み、該当 GET のレスポンステーブルで `owl:sameAs` 列の list を確認

### 拡張なしのフォールバック

`x-restfului-link` がなくても、**下位 path の path パラメータ名と同じ列** は自動的に PathLink 列になります（Part A §2）。`GET /configs` の `configurationId` 列がこれに該当します。

### 階層ベース vs 拡張明示

| 方式 | いつ使うか |
|------|-----------|
| パス階層（自動） | `/pets` → `/pets/{id}` のような REST 的な親子 path |
| `x-restfului-link` | 別リソースへの参照、クエリで絞る GET、Graph 的な関連 |
| ユーザ定義リンク | OpenAPI を変更せず Settings で定義（Part C 参照） |

---

## Part C — ユーザ定義リンク

Swagger / OpenAPI 本体を変更せず、**Settings > Links** または operation 画面の **Quick Add Link** で、レスポンステーブルの列から別 operation へのリンクを登録できます。定義は sessionStorage（Explorer）または Config サーバー（`/cid/{id}/`）に永続化されます。

### いつ使うか

- 現在 path の prefix では辿れない関連（例: `/pet/findByStatus` → `/pet/{petId}`）
- レスポンス列名と path パラメータ名が一致しない（例: 列 `id` → `{petId}`）

### Settings > Links

| 項目 | 説明 |
|------|------|
| Source path / method | リンク元 operation |
| Column | テーブル列名 |
| Target path prefix | 遷移先 prefix（プレースホルダ付き、例: `/pet/{petId}`）。この prefix 配下の全 OpenAPI path が対象 |
| Target param | 列の値が埋める placeholder 名（例: `petId`）。未解決の param のうち先頭のみ選択可能 |

**Save** でストレージに反映します。

### Quick Add Link

配列レスポンスを Execute した直後、**Quick Add Link** から列・target path prefix・target param を選び **Add link** できます。現在 operation の bound パラメータに応じて、リンク可能な placeholder だけが候補になります。

### テーブルからの利用

登録済み列に **list** ボタンが表示されます。ダイアログ内 **User Links** では **target path prefix をグループ見出し**（例: `/pet/{petId}`）とし、その下にマッチする各 OpenAPI path（例: `/pet/{petId}`, `/pet/{petId}/uploadImage`）をリンク表示します。HTTP メソッドは UI に表示せず、内部では GET を優先して遷移します。

### 複数 placeholder の例

`targetPath prefix` が `/pet/{petId}/resource/{resourceId}` の場合:

- source が `/pet/findByStatus`（`petId` 未解決）→ 候補は `petId` のみ
- source が `/pet/{petId}` で `petId=123` 済み → 候補は `resourceId` のみ

### 例 — Petstore

`GET /pet/findByStatus` の `id` 列から `/pet/{petId}` prefix へ:

```json
{
  "sourcePath": "/pet/findByStatus",
  "sourceMethod": "get",
  "column": "id",
  "targetPath": "/pet/{petId}",
  "targetParam": "petId"
}
```

期待 URL（配下 path `/pet/{petId}` をクリックした場合）:

```
#?*page=operation&path=/pet/{petId}&method=get&petId=123
```

**Try it**

1. Spec: `https://petstore.swagger.io/v2/swagger.json`
2. `GET /pet/findByStatus` を Execute（`status=available`）
3. Quick Add Link で column `id` → prefix `/pet/{petId}` → param `petId` を追加
4. テーブルの `id` 列で list → User Links の `/pet/{petId}` グループ内リンクをクリック

### Config JSON（サーバー永続化）

Config サーバー利用時、`linkMappings` は `requestSettings` と同様に `ServerConfig` に含めます。Persist 画面の JSON ダウンロードにも出力されます。

---

## 関連ドキュメント

- [deployment.md](deployment.md) — ビルドモードとデプロイ
- [development.md](development.md) — 内部構成・プラグイン
- [network-and-security.md](network-and-security.md) — 通信経路・セキュリティ
- [mcp.md](mcp.md) — MCP 連携
- [README.ja.md](../../README.ja.md) — プロジェクト概要
