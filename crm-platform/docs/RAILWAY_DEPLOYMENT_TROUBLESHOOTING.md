# Railwayデプロイエラーのトラブルシューティング

このドキュメントは、Railwayでのデプロイエラーを解決する方法を説明します。

## よくあるデプロイエラー

### エラー: "There was an error deploying from source"

このエラーは、ソースからのデプロイに失敗したことを示しています。

#### 原因1: ルートディレクトリが設定されていない

**症状**:
- デプロイが失敗する
- 「There is no active deployment for this service」と表示される

**解決方法**:
1. Web App Serviceの「Settings」タブを開く
2. 「Source」セクションで「Add Root Directory」をクリック
3. `crm-platform` を入力して保存
4. Worker Serviceでも同じ設定を行う

#### 原因2: ビルドエラー

**症状**:
- デプロイが開始されるが、ビルド中に失敗する
- Logsタブにビルドエラーが表示される

**確認方法**:
1. 「Deployments」タブで最新のデプロイをクリック
2. ビルドログを確認
3. エラーメッセージを確認

**よくあるビルドエラー**:
- `Cannot find module 'xxx'`: 依存関係が不足
- `TypeScript error`: 型エラー
- `Build failed`: ビルドスクリプトのエラー

**解決方法**:
- エラーメッセージに従って修正
- `package.json`に必要な依存関係が追加されているか確認
- ローカルで `npm run build` が成功するか確認

#### 原因3: Dockerfileの問題

**症状**:
- Dockerfileを使用している場合、ビルドが失敗する

**確認方法**:
1. `Dockerfile`が存在するか確認
2. `railway.json`でDockerfileのパスが正しいか確認

**解決方法**:
- `Dockerfile`の内容を確認
- ビルドコマンドが正しいか確認

#### 原因4: 環境変数の問題

**症状**:
- ビルドは成功するが、起動時にエラーが発生する

**確認方法**:
1. 「Variables」タブで環境変数が設定されているか確認
2. 変数参照（`${{...}}`）が正しいか確認

**解決方法**:
- 必要な環境変数がすべて設定されているか確認
- 変数参照のサービス名が正確に一致しているか確認

## エラーログの確認方法

### ステップ1: Logsタブで確認

1. エラーが発生しているサービスを選択
2. 「Logs」タブを開く
3. エラーメッセージを確認

### ステップ2: Deploymentsタブで確認

1. 「Deployments」タブを開く
2. 最新のデプロイをクリック
3. ビルドログとデプロイログを確認

### ステップ3: エラーメッセージの分析

エラーメッセージから原因を特定：
- `Cannot find module`: 依存関係の問題
- `Type error`: TypeScriptの型エラー
- `Connection refused`: データベースやRedisへの接続エラー
- `Environment variable not set`: 環境変数の問題

## デプロイエラーの解決手順

### 手順1: ルートディレクトリの確認

1. Web App Serviceの「Settings」タブを開く
2. 「Source」セクションを確認
3. 「Root Directory」が `crm-platform` に設定されているか確認
4. 設定されていない場合は、「Add Root Directory」をクリックして設定
5. Worker Serviceでも同じ設定を行う

### 手順2: ローカルでビルドテスト

ローカルでビルドが成功するか確認：

```bash
cd crm-platform
npm install
npm run build
```

ビルドが失敗する場合は、エラーを修正してから再度デプロイ。

### 手順3: 環境変数の再確認

1. 「Variables」タブで環境変数が設定されているか確認
2. 変数参照（`${{...}}`）が正しいか確認
3. サービス名が正確に一致しているか確認

### 手順4: 再デプロイ

1. 修正が完了したら、Railwayが自動的に再デプロイを開始します
2. または、「Deployments」タブで「Redeploy」をクリック

## よくあるエラーメッセージと解決方法

### "Cannot find module 'bullmq'"

**原因**: 依存関係がインストールされていない

**解決方法**:
1. `package.json`に`bullmq`と`ioredis`が追加されているか確認
2. GitHubにプッシュされているか確認
3. Railwayが最新のコードを取得しているか確認

### "Type error: ..."

**原因**: TypeScriptの型エラー

**解決方法**:
1. ローカルで `npx tsc --noEmit` を実行してエラーを確認
2. エラーを修正
3. GitHubにプッシュ
4. Railwayが自動的に再デプロイ

### "REDIS_URL environment variable is not set"

**原因**: 環境変数が設定されていない

**解決方法**:
1. 「Variables」タブで`REDIS_URL`が設定されているか確認
2. 変数参照（`${{Redis.REDIS_URL}}`）を使用しているか確認

### "Database connection failed"

**原因**: データベースに接続できない

**解決方法**:
1. 「Variables」タブで`DATABASE_URL`が設定されているか確認
2. 変数参照（`${{Postgres.DATABASE_URL}}`）を使用しているか確認
3. Postgresサービスが起動しているか確認

## デプロイの再試行

### 方法1: 自動再デプロイ

環境変数や設定を変更すると、Railwayが自動的に再デプロイを開始します。

### 方法2: 手動再デプロイ

1. 「Deployments」タブを開く
2. 「Redeploy」ボタンをクリック
3. または、「Deploy the repo」ボタンをクリック

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
