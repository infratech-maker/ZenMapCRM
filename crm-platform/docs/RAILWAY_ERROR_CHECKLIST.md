# Railwayデプロイエラー チェックリスト

このドキュメントは、Railwayでのデプロイエラーを解決するためのチェックリストです。

## 確認項目

### ✅ 1. ルートディレクトリの設定
- [ ] Web App Service: Settings → Source → Root Directory = `crm-platform`
- [ ] Worker Service: Settings → Source → Root Directory = `crm-platform`

### ✅ 2. 環境変数の設定
- [ ] Web App Service: Variablesタブで以下が設定されている
  - [ ] `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
  - [ ] `REDIS_URL` = `${{Redis.REDIS_URL}}`
  - [ ] `NEXTAUTH_SECRET` = (生成された値)
  - [ ] `NEXTAUTH_URL` = `https://${{RAILWAY_PUBLIC_DOMAIN}}`
- [ ] Worker Service: Variablesタブで以下が設定されている
  - [ ] `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
  - [ ] `REDIS_URL` = `${{Redis.REDIS_URL}}`
  - [ ] `NEXTAUTH_SECRET` = (Web Appと同じ値)
  - [ ] `NEXTAUTH_URL` = `https://${{RAILWAY_PUBLIC_DOMAIN}}`

### ✅ 3. スタートコマンドの設定
- [ ] Web App Service: Settings → Deploy → Start Command = `npm start` (railway.jsonで設定済み)
- [ ] Worker Service: Settings → Deploy → Start Command = `npm run start:worker`

### ✅ 4. エラーログの確認
- [ ] Web App Service: Logsタブでエラーメッセージを確認
- [ ] Worker Service: Logsタブでエラーメッセージを確認
- [ ] Deploymentsタブで最新のデプロイをクリックしてビルドログを確認

## よくあるエラーと解決方法

### エラー: "Cannot find module 'xxx'"

**原因**: 依存関係がインストールされていない、または`package.json`に追加されていない

**解決方法**:
1. `package.json`に必要な依存関係が追加されているか確認
2. GitHubにプッシュされているか確認
3. Railwayが最新のコードを取得しているか確認

### エラー: "Type error: ..."

**原因**: TypeScriptの型エラー

**解決方法**:
1. ローカルで `npx tsc --noEmit` を実行してエラーを確認
2. エラーを修正
3. GitHubにプッシュ
4. Railwayが自動的に再デプロイ

### エラー: "REDIS_URL environment variable is not set"

**原因**: 環境変数が設定されていない

**解決方法**:
1. Variablesタブで`REDIS_URL`が設定されているか確認
2. 変数参照（`${{Redis.REDIS_URL}}`）を使用しているか確認
3. Redisサービスが起動しているか確認

### エラー: "Database connection failed"

**原因**: データベースに接続できない

**解決方法**:
1. Variablesタブで`DATABASE_URL`が設定されているか確認
2. 変数参照（`${{Postgres.DATABASE_URL}}`）を使用しているか確認
3. Postgresサービスが起動しているか確認

### エラー: "Build failed" または "npm run build failed"

**原因**: ビルドプロセスでエラーが発生

**解決方法**:
1. ローカルで `npm run build` が成功するか確認
2. エラーメッセージを確認
3. エラーを修正してGitHubにプッシュ

### エラー: "There was an error deploying from source"

**原因**: ソースからのデプロイに失敗

**解決方法**:
1. ルートディレクトリが設定されているか確認
2. ブランチが正しく設定されているか確認（`main`）
3. GitHubリポジトリが正しく接続されているか確認
4. Logsタブで詳細なエラーメッセージを確認

## デプロイエラーの診断手順

### ステップ1: エラーログの確認

1. エラーが発生しているサービスを選択
2. 「Logs」タブを開く
3. エラーメッセージをコピー
4. エラーメッセージの内容を分析

### ステップ2: ビルドログの確認

1. 「Deployments」タブを開く
2. 最新のデプロイをクリック
3. ビルドログを確認
4. エラーが発生している行を特定

### ステップ3: ローカルでの再現

1. ローカルで同じコマンドを実行
2. エラーが再現するか確認
3. エラーを修正
4. GitHubにプッシュ

### ステップ4: 再デプロイ

1. 修正が完了したら、Railwayが自動的に再デプロイを開始
2. または、「Deployments」タブで「Redeploy」をクリック

## デバッグのヒント

### ログの見方

- **ビルドログ**: Dockerfileの`RUN npm run build`の出力
- **デプロイログ**: サービス起動時のログ
- **アプリケーションログ**: アプリケーション実行時のログ

### よくある問題

1. **環境変数が設定されていない**: Variablesタブで確認
2. **依存関係が不足**: `package.json`を確認
3. **ビルドエラー**: ローカルで再現して修正
4. **接続エラー**: サービス（Postgres、Redis）が起動しているか確認

## 次のステップ

エラーが解決したら：

1. **Deploymentsタブで確認**
   - 最新のデプロイが「Active」になっているか確認

2. **Logsタブで確認**
   - エラーが解消されているか確認
   - 正常に起動しているか確認

3. **動作確認**
   - Web Appの公開URLにアクセス
   - Workerのログで正常起動を確認

---

## 参考

- [Railway - Troubleshooting](https://docs.railway.app/troubleshooting)
- [Railway - Deployments](https://docs.railway.app/deploy/deployments)
- [Railway - Environment Variables](https://docs.railway.app/develop/variables)
