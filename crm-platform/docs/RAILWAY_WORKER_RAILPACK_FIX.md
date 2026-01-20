# Worker ServiceのRailpack設定後のトラブルシューティング

このドキュメントは、Worker ServiceのBuilderをRailpackに変更した後もエラーが解消されない場合の対処法を説明します。

## 確認事項

### 1. Builder設定の確認

1. **Worker ServiceのSettingsタブを開く**
2. **Buildセクションを開く**
3. **Builderを確認**
   - `Railpack`または`Railpack Default`になっていることを確認
   - `DOCKERFILE`になっている場合は、`Railpack`に変更して保存

### 2. デプロイの再実行

Builderを変更した後、Railwayが自動的に再デプロイを開始しますが、手動で再デプロイすることもできます：

1. **Deploymentsタブを開く**
2. **「Redeploy」ボタンをクリック**
3. **または、「Deploy the repo」ボタンをクリック**

### 3. 最新のデプロイログを確認

1. **Deploymentsタブで最新のデプロイをクリック**
2. **ビルドログを確認**
3. **エラーメッセージをコピー**

## よくある問題と解決方法

### 問題1: まだDockerfileを使用している

**症状**: ビルドログに「Using Detected Dockerfile」と表示される

**原因**: Builder設定が反映されていない、またはキャッシュの問題

**解決方法**:
1. Settings → Build → Builder を再度確認
2. `Railpack`に設定されていることを確認
3. 保存
4. Deploymentsタブで「Redeploy」をクリック

### 問題2: Railpackを使用しているが、ビルドエラーが発生

**症状**: ビルドログに「Building with Railpack」と表示されるが、エラーが発生

**原因**: 依存関係の問題、またはTypeScriptエラー

**解決方法**:
1. ビルドログでエラーメッセージを確認
2. エラーメッセージに従って修正
3. GitHubにプッシュ
4. Railwayが自動的に再デプロイ

### 問題3: Start Commandが実行されない

**症状**: ビルドは成功するが、Workerが起動しない

**原因**: Start Commandが設定されていない

**解決方法**:
1. Settings → Deploy → Start Command を確認
2. `npm run start:worker` が設定されていることを確認
3. 設定されていない場合は、設定して保存

### 問題4: 依存関係のエラー

**症状**: 「Cannot find module」エラーが発生

**原因**: `package.json`に必要な依存関係が追加されていない

**解決方法**:
1. `package.json`を確認
2. 必要な依存関係（`bullmq`, `ioredis`, `tsx`など）が追加されているか確認
3. GitHubにプッシュされているか確認

## Worker Serviceの正しい設定

### Buildセクション

- **Builder**: `Railpack`または`Railpack Default`
- **Custom Build Command**: 設定しない（空欄）
- **Metal Build Environment**: オフ（デフォルト）

### Deployセクション

- **Start Command**: `npm run start:worker`
- **Restart Policy**: `ON_FAILURE`（デフォルト）

### Variablesセクション

- `DATABASE_URL = ${{Postgres.DATABASE_URL}}`
- `REDIS_URL = ${{Redis.REDIS_URL}}`
- `NEXTAUTH_SECRET = (生成された値)`
- `NEXTAUTH_URL = https://${{RAILWAY_PUBLIC_DOMAIN}}`

## デバッグのヒント

### ログの見方

1. **ビルドログ**: Railpackが依存関係をインストールし、環境を準備する過程
2. **デプロイログ**: Start Commandが実行される過程
3. **アプリケーションログ**: Workerが起動し、ジョブを処理する過程

### エラーメッセージの分析

- **"Cannot find module"**: 依存関係の問題
- **"Type error"**: TypeScriptの型エラー
- **"REDIS_URL environment variable is not set"**: 環境変数の問題
- **"Database connection failed"**: データベース接続の問題

## 次のステップ

エラーが解決したら：

1. **Deploymentsタブで確認**
   - 最新のデプロイが「Active」になっているか確認

2. **Logsタブで確認**
   - エラーが解消されているか確認
   - 以下のログが表示されることを確認：
     - `✅ Database connection established`
     - `✅ Redis connection established`
     - `✅ Worker started and listening for jobs...`

---

## 参考

- [Railway - Build Configuration](https://docs.railway.app/deploy/builds)
- [Railway - Railpack](https://docs.railway.app/deploy/builds#railpack)
