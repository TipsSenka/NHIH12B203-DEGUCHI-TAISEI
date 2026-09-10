# 学科紹介API（Cloudflare Pages × Workers）

静的ページ（Pages）から、Cloudflare Workers で動くAPIを呼び出して JSON を表示する教材用プロジェクトです。
フレームワークは使わず、バニラJavaScript（Request / Response / fetch / URL）だけで書いています。

```
├─ pages/
│  └─ index.html        画面（フロントエンド）。Pages の出力ディレクトリ
├─ worker/
│  ├─ src/index.js      API（バックエンド）
│  ├─ wrangler.toml     Worker 名・compatibility_date・ローカル開発の設定
│  └─ package.json      npm run dev / npm run deploy
└─ doc/                 手順書・チェックリスト・講義資料
```

## API 一覧

| メソッド・パス | 内容 | 主なステータス |
| --- | --- | --- |
| `GET /` , `GET /api` | 稼働確認とエンドポイント一覧 | 200 |
| `GET /api/course` | 学科紹介（架空データ） | 200 |
| `GET /api/hello` | 時間帯（日本時間）に合わせた挨拶 | 200 |
| `GET /api/hello?name=山田` | 名前付き挨拶 | 200 |
| `GET /api/hello?name=` | name が空欄・20文字超・制御文字を含む | 400 |
| `GET /api/fortune` | おみくじ（ランダム） | 200 |
| `GET /api/events` | イベント一覧（配列） | 200 |
| 上記以外のパス | 見つからない | 404 |
| GET / HEAD / OPTIONS 以外 | 使えないメソッド | 405 |

エラー時は `{"error": "…"}` の形で、一般向けのメッセージだけを返します（内部のスタック情報は返しません）。

## ローカルで動かす

必要なもの：Node.js（LTS）、VS Code

```powershell
Set-Location .\worker
npm.cmd install
npm.cmd run dev
```

`http://127.0.0.1:8787/api/course` をブラウザで開き、JSON が表示されれば Worker は動いています。

続けて `pages/index.html` をブラウザで開きます（ダブルクリック、または VS Code の Live Server など）。
「WorkerのURL」は本番URLになっているので、`http://127.0.0.1:8787` に書き換えてからボタンを押して動作を確認します。

## 公開する

作業の詳細は `doc/Cloudflare側作業チェックリスト.md` を参照してください。

### Workers

CLI で公開する場合：

```powershell
Set-Location .\worker
npx wrangler login
npx wrangler whoami
npm.cmd run deploy
```

表示されたURLが `https://backend.tatataise091403.workers.dev` であることを確認します。
（違うURLが表示された場合は、`wrangler.toml` の `name` やログイン中のアカウントを確認してください）

GitHub 連携で公開する場合は、Cloudflare 側の Build configuration を次のようにします。

- ルートディレクトリ：`/worker`
- デプロイコマンド：`npx wrangler deploy`
- Production branch：反映したいブランチ（例：`main`）

### Pages

- GitHub リポジトリを接続
- フレームワーク：なし、ビルドコマンド：空欄
- 出力ディレクトリ：`pages`

## 公開後に変更するところ

`doc/Cloudflareデプロイ後_変更点チェックリスト.md` に対応しています。

1. `pages/index.html` の WorkerのURL 初期値
   `http://127.0.0.1:8787` → `https://backend.tatataise091403.workers.dev`（変更済み）
2. `worker/src/index.js` の CORS 許可オリジン
   `const ALLOWED_ORIGINS = ["*"];` → `const ALLOWED_ORIGINS = ["https://<your-project>.pages.dev"];`
   限定すると、許可していないオリジンからの呼び出しには 403 を返します。
3. `worker/wrangler.toml` の `name`（`backend` に変更済み）と `compatibility_date`（未来の日付はデプロイ失敗の原因になります）
4. このREADMEに実際の本番URLを記入

本番URL（公開後に記入）：

- Pages：`https://<your-project>.pages.dev`
- Workers：`https://backend.tatataise091403.workers.dev`

## 動作確認

```bash
BASE=https://backend.tatataise091403.workers.dev   # ローカルなら http://127.0.0.1:8787
curl -i "$BASE/api/course"                           # 200
curl -i "$BASE/api/hello?name=%E5%B1%B1%E7%94%B0"    # 200（name=山田）
curl -i "$BASE/api/hello?name="                      # 400
curl -i "$BASE/api/unknown"                          # 404
```

画面では、上部の図（画面から要求 → APIが受け取る → Workersが処理 → 画面へ表示）で、どこまで進んだか・どこで止まったかを確認できます。
うまく動かないときは、結果欄のヒント（画面・入力・通信・処理のどこを確認するか）を手がかりにしてください。
