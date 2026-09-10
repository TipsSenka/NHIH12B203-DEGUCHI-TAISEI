# Cloudflareデプロイ後 変更点チェックリスト

このドキュメントは、ローカル開発状態から本番公開状態へ切り替える際に変更する項目をまとめたもの。

## 1. Pages画面のAPI接続先を本番URLへ変更

対象:
- pages/index.html

変更内容:
- WorkerベースURLの初期値 `http://127.0.0.1:8787` を、本番の `https://<worker-name>.<subdomain>.workers.dev` へ変更。

確認ポイント:
- 画面を開いた直後に、そのままボタン押下で本番APIにアクセスできる。

## 2. CORS設定を本番向けに制限

対象:
- worker/src/index.js

変更内容:
- 現在は `access-control-allow-origin: *` のため、必要に応じてPagesの公開URLに限定する。

例:
- `https://<your-project>.pages.dev`
- `https://<custom-domain>`

確認ポイント:
- ブラウザ開発者ツールでCORSエラーが出ない。
- 想定外オリジンからのアクセスを拒否できる。

## 3. Worker名・設定値の最終確認

対象:
- worker/wrangler.toml

変更内容:
- `name` が本番運用名になっているか確認。
- `compatibility_date` を運用ポリシーに合わせて更新。

確認ポイント:
- デプロイ先のWorkerが意図した名前で作成される。

## 4. 秘密情報を返していないか再確認

対象:
- worker/src/index.js

変更内容:
- APIレスポンスに機密情報（APIキー、内部識別子、個人情報）が含まれないことを確認。
- エラー時に内部スタック情報を返さないことを確認。

確認ポイント:
- 500系レスポンスが一般向けメッセージのみになっている。

## 5. 本番確認用の動作テスト

対象:
- pages/index.html
- worker/src/index.js

確認手順:
1. /api/course が 200 で JSON を返す。
2. /api/hello?name=山田 が 200 で JSON を返す。
3. /api/hello?name= が 400 を返す。
4. 未定義パスが 404 を返す。
5. 画面上でJSON表示が崩れない。

## 6. ドキュメント更新

対象:
- README.md

変更内容:
- 実際の本番URLを反映。
- 受講者・運用者向けに確認手順を最新化。

---

## すぐ使える置換テンプレート

### pages/index.html

変更前:
- http://127.0.0.1:8787

変更後:
- https://<worker-name>.<subdomain>.workers.dev

### worker/src/index.js

変更前:
- access-control-allow-origin: *

変更後例:
- access-control-allow-origin: https://<your-project>.pages.dev