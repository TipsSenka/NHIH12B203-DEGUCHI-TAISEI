# Cloudflare サブドメイン変更手順

この手順書は、Workers URL のどこを変更できるかを整理し、実際の切り替え方法をまとめたもの。

## 1. まずURL構造を確認

Workers URL は次の構造になる。

https://Worker名.アカウントサブドメイン.workers.dev

例:
https://senka-api.takahashi-masa.workers.dev

上の例では次の2要素がある。

1. Worker名: senka-api
2. アカウントサブドメイン: takahashi-masa

## 2. 変更できる部分と難しい部分

1. Worker名は変更可能
2. アカウントサブドメインは通常、初期設定後の自由変更が難しい

実務上は、まず Worker名変更で対応し、必要なら独自ドメイン運用へ切り替えるのが安全。

## 3. Worker名を変更する手順

対象ファイル:
1. worker/wrangler.toml
2. pages/index.html

手順:
1. worker/wrangler.toml の name を新しいWorker名へ変更
2. worker ディレクトリで再デプロイ
3. 新しい workers.dev URL を確認
4. pages/index.html の WorkerベースURL初期値を新URLへ更新
5. 画面から api と api/course を確認

確認コマンド:

PowerShell
Set-Location .\worker
npm.cmd run deploy

確認ポイント:
1. 旧URLではなく新URLでレスポンスが返る
2. api/course が200でJSONを返す

## 4. アカウントサブドメインを変えたい場合

アカウントサブドメイン変更は制約があるため、次の順で確認する。

1. Cloudflareダッシュボードで workers.dev サブドメイン設定の変更可否を確認
2. 変更不可の場合は Cloudflare Support に問い合わせ
3. 変更に時間がかかる場合は独自ドメインをWorkerに割り当てて運用継続

## 5. 独自ドメインで回避する手順

1. Workerのドメイン設定画面で ドメインを追加 を実行
2. 対象ゾーンを選択し、任意のホスト名を割り当て
3. TLS有効化を確認
4. Pages側の接続先URLを独自ドメインへ変更

確認ポイント:
1. users向け公開URLを workers.dev から独自ドメインへ移行できる
2. CORS設定の許可元も新ドメインに合わせて更新されている

## 6. 変更後チェックリスト

1. Cloudflareの最新デプロイが成功
2. 画面のWorkerベースURLが最新
3. api, api/course, api/hello が想定ステータス
4. 404が出る場合は URLの打ち間違いとデプロイ先アカウントを再確認