# Cloudflare側作業チェックリスト

このファイルは、Cloudflare上で実施する作業のみをまとめたチェックリストです。

## 1. アカウントと認証

1. Cloudflareアカウントにログイン
2. CLIを使う場合は `wrangler login` を実行
3. 対象アカウント・対象ゾーンが正しいことを確認

## 2. Workersの作成とデプロイ

1. Worker名を確定（例: `senka-api`）
2. `wrangler.toml` の `name` と `main` を確認
3. `wrangler deploy` を実行
4. 発行された `*.workers.dev` のURLを記録

確認項目:
1. `GET /api/course` が200で応答
2. 未定義パスが404で応答

## 3. Workersの設定（セキュリティ・運用）

1. 必要に応じてCORS許可オリジンを `*` からPagesドメインに限定
2. 機密値はコードに直書きせず、CloudflareのSecretsを使用
3. ログやレスポンスに個人情報を出さないことを確認

必要時の作業:
1. Secret追加: `wrangler secret put <KEY>`
2. 環境別（dev/prod）で値を分離

## 4. Pagesプロジェクト連携

1. Cloudflare PagesでGitHubリポジトリを接続
2. ビルド不要の静的サイトなら、出力ディレクトリを `pages` に設定
3. 本番デプロイ後に `*.pages.dev` のURLを確認

確認項目:
1. 画面からWorker APIにアクセスできる
2. CORSエラーが出ない

## 5. カスタムドメイン（必要な場合）

1. WorkersまたはPagesにカスタムドメインを追加
2. DNS設定がCloudflare上で有効化されていることを確認
3. HTTPS証明書発行完了を確認

## 6. 最終動作確認

1. Pages本番URLから `course / hello / fortune / events` が取得できる
2. 異常系（name未入力、未定義パス）が想定ステータスで返る
3. スマホ表示でレイアウト崩れがない

## 7. リリース後の運用

1. 失敗率・レイテンシをCloudflareダッシュボードで監視
2. 不要なデバッグログを削減
3. 変更時は GitHub更新 → Pages再デプロイ → Worker再デプロイ の順で反映確認

## 8. デプロイするブランチの切り替え手順

### Pages（本番ブランチを切り替える場合）

1. Cloudflareダッシュボードで Pages プロジェクトを開く
2. Settings → Builds & deployments を開く
3. Production branch を現在のブランチから切り替え先ブランチへ変更
4. Save後に再デプロイを実行（必要なら Retry deployment）

確認項目:
1. 最新デプロイが切り替え先ブランチのコミットになっている
2. 本番URL（`*.pages.dev` または独自ドメイン）で表示が更新される

### Pages（プレビューだけ別ブランチで確認する場合）

1. 切り替え先ブランチへ push
2. Deployments で該当ブランチの Preview を確認
3. 問題なければ Production branch を切り替える、または main へマージする

### Workers（CLI運用時）

1. デプロイ対象ブランチへチェックアウト
2. 対象ブランチの最新を pull
3. `wrangler deploy` を実行

確認項目:
1. `*.workers.dev` の応答が切り替え先ブランチのコードになっている
2. APIエンドポイントのステータス（200/400/404）が想定通り

### Workers（GitHub連携で自動デプロイしている場合）

1. Workerの連携設定で対象リポジトリとブランチ条件を確認
2. 本番反映ブランチ条件を切り替え先に変更
3. 対象ブランチへ push して自動デプロイを実行

確認項目:
1. デプロイ履歴で対象ブランチ名とコミットIDが一致
2. ロールバック手順（直前コミット再デプロイ）を事前に確認

## 9. `workers.dev` で404が出るときの切り分け

1. `wrangler.toml` の `name` がアクセスURLの先頭名と一致しているか確認
2. `wrangler deploy` 実行時に表示された公開URLを控え、手入力URLと一致するか確認
3. `wrangler whoami` でログイン中アカウントを確認（別アカウントへ誤デプロイしていないか）
4. `/` と `/api` にアクセスし、Worker自体が応答するか確認
5. Pagesから呼んでいる場合は、ベースURLが旧Worker URLのままになっていないか確認

確認コマンド例:

```powershell
Set-Location .\worker
wrangler whoami
wrangler deploy
```

期待結果:
1. `https://<worker-name>.<subdomain>.workers.dev` が deploy 出力に表示される
2. `https://<worker-name>.<subdomain>.workers.dev/api/course` がJSONを返す
3. 404のままなら、別アカウント/別サブドメインへのデプロイを疑う

補足（今回の症状に近いケース）:
1. トップページは表示されるのに `/api/course` だけ404になる場合、API実装を含むWorkerが反映されていない可能性が高い
2. 静的ページ用のデプロイ内容だけが有効で、`worker/src/index.js` のルーティングが本番に載っていない可能性がある
3. `worker` ディレクトリで再度 `wrangler deploy` を実行し、表示された公開URLに対して `/api` と `/api/course` を確認する

## 10. Git連携デプロイで「最新ビルド失敗」が出るとき

症状:
1. Cloudflareダッシュボード上部に「最新のビルドに失敗しました」が表示される
2. 既存のWorker URLは開けるが、期待したAPI更新が反映されない

確認手順:
1. デプロイ履歴を開き、失敗したデプロイのログを確認
2. Build configuration の値を確認
3. ルートディレクトリが `/worker` になっているか確認
4. デプロイコマンドが `npx wrangler deploy` になっているか確認
5. production branch が反映したいブランチ（例: main）か確認

修正後の再実行:
1. 設定を保存
2. Retry deployment または 新しいデプロイ を実行
3. 成功後に `/api` と `/api/course` を再確認

補足:
1. Git連携で失敗が続く場合は、ローカルの `worker` ディレクトリから `wrangler deploy` を先に成功させると切り分けしやすい
2. ローカルで成功するのにGit連携で失敗する場合、Cloudflare側Build configurationの不一致を優先確認する
3. ログに "Can't set compatibility date in the future" が出る場合は、`worker/wrangler.toml` の `compatibility_date` を当日以前（UTC基準）へ変更して再デプロイする