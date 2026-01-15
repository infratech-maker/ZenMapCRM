# Railway Logsタブが表示されない場合の対処法

このドキュメントは、RailwayでLogsタブが表示されない場合の対処法を説明します。

## Logsタブが表示されない理由

Railwayでは、**デプロイが存在しない場合、Logsタブが表示されません**。

### 確認方法

1. **Deploymentsタブを確認**
   - 「There is no active deployment for this service」と表示されている場合、デプロイが存在しません
   - この場合、Logsタブは表示されません

2. **デプロイを開始**
   - 「Deploy the repo **infratech-maker/ZenMapCRM**」ボタンをクリック
   - デプロイが開始されると、Logsタブが表示されます

## ログの確認方法

### 方法1: Logsタブで確認（デプロイが存在する場合）

1. デプロイを開始する
2. Logsタブが表示される
3. Logsタブでエラーメッセージを確認

### 方法2: Deploymentsタブで確認

1. **Deploymentsタブを開く**
2. **最新のデプロイをクリック**
3. **デプロイの詳細画面でログを確認**
   - ビルドログ
   - デプロイログ
   - エラーメッセージ

### 方法3: デプロイが失敗した場合

1. **Deploymentsタブで失敗したデプロイをクリック**
2. **ビルドログを確認**
   - エラーが発生している行を特定
   - エラーメッセージをコピー

## デプロイを開始する手順

### Web App Service

1. **Web App Serviceを選択**
2. **Deploymentsタブを開く**
3. **「Deploy the repo infratech-maker/ZenMapCRM」ボタンをクリック**
4. **デプロイが開始される**
5. **Logsタブが表示される**

### Worker Service

1. **Worker Serviceを選択**
2. **Deploymentsタブを開く**
3. **「Deploy the repo infratech-maker/ZenMapCRM」ボタンをクリック**
4. **デプロイが開始される**
5. **Logsタブが表示される**

## デプロイが失敗する場合

デプロイが失敗する場合、以下の手順でエラーを確認します：

### ステップ1: Deploymentsタブで確認

1. **Deploymentsタブを開く**
2. **失敗したデプロイをクリック**
3. **ビルドログを確認**
4. **エラーメッセージをコピー**

### ステップ2: エラーメッセージの分析

よくあるエラー：

- **"Build failed"**: ビルドエラー
  - 解決: LogsタブまたはDeploymentsタブでビルドログを確認
- **"Cannot find module"**: 依存関係の問題
  - 解決: `package.json`を確認
- **"Type error"**: TypeScriptエラー
  - 解決: ローカルで `npx tsc --noEmit` を実行

### ステップ3: エラーを修正

1. エラーメッセージに従って修正
2. GitHubにプッシュ
3. Railwayが自動的に再デプロイ

## ログの見方

### ビルドログ

- **ビルドプロセスの出力**
- **エラーが発生した行を確認**
- **エラーメッセージをコピー**

### デプロイログ

- **デプロイプロセスの出力**
- **起動時のログ**
- **エラーが発生した場合のメッセージ**

### アプリケーションログ

- **アプリケーション実行時のログ**
- **Worker Serviceの場合**: `✅ Database connection established` など

## トラブルシューティング

### Logsタブが表示されない

**原因**: デプロイが存在しない

**解決方法**:
1. Deploymentsタブでデプロイを開始
2. デプロイが開始されると、Logsタブが表示されます

### デプロイが失敗する

**原因**: ビルドエラー、環境変数の問題など

**解決方法**:
1. Deploymentsタブで失敗したデプロイをクリック
2. ビルドログでエラーメッセージを確認
3. エラーを修正してGitHubにプッシュ

### ログが表示されない

**原因**: デプロイがまだ開始されていない

**解決方法**:
1. Deploymentsタブでデプロイの状態を確認
2. デプロイが「Building」または「Deploying」の場合は、完了を待つ

---

## 参考

- [Railway - Logs](https://docs.railway.app/develop/logs)
- [Railway - Deployments](https://docs.railway.app/deploy/deployments)
