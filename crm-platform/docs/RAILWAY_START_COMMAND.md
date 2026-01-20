# Railwayスタートコマンドの設定方法

このドキュメントは、RailwayでWeb AppとWorkerサービスのスタートコマンドを設定する方法を説明します。

## 現在の設定

`railway.json`ファイルに以下の設定があります：

```json
{
  "deploy": {
    "startCommand": "npm start"
  }
}
```

この設定により、Web App Serviceは自動的に`npm start`で起動します。

## スタートコマンドの設定手順

### Web App Service

1. Railwayダッシュボードで「Web App」サービスを選択
2. 「Settings」タブを開く
3. 「Start Command」セクションを探す
4. 以下のいずれかの方法で設定：
   - **方法1**: `railway.json`の設定を使用（推奨）
     - `railway.json`に`startCommand`が設定されている場合、自動的に使用されます
     - 追加の設定は不要です
   - **方法2**: Settingsタブで直接設定
     - 「Start Command」フィールドに `npm start` を入力
     - 保存

### Worker Service

**重要**: Worker Serviceには`railway.json`の設定が適用されないため、手動で設定する必要があります。

1. Railwayダッシュボードで「Worker」サービスを選択
2. 「Settings」タブを開く
3. 「Start Command」セクションを探す
4. 「Start Command」フィールドに以下を入力：
   ```
   npm run start:worker
   ```
5. 保存

## スタートコマンドの確認

### Web App Service

- `railway.json`に`startCommand: "npm start"`が設定されている
- Settingsタブで確認または上書き可能

### Worker Service

- Settingsタブで`npm run start:worker`を設定する必要がある

## デプロイの確認

スタートコマンドを設定すると、Railwayが自動的にリデプロイを開始します。

### 確認方法

1. **Deploymentsタブ**
   - 各サービスの「Deployments」タブでデプロイの進行状況を確認
   - 「Active」になれば成功

2. **Logsタブ**
   - 「Logs」タブでログを確認
   - エラーがないか確認

### Web App Serviceのログ確認

正常に起動している場合、以下のようなログが表示されます：

```
✓ Starting...
✓ Ready in Xms
```

### Worker Serviceのログ確認

正常に起動している場合、以下のようなログが表示されます：

```
✅ Database connection established
✅ Redis connection established
✅ Worker started and listening for jobs...
```

## トラブルシューティング

### エラー: "Cannot find module"

- ビルドが完了しているか確認（「Deployments」タブで確認）
- 依存関係がインストールされているか確認（ログで確認）

### エラー: "REDIS_URL environment variable is not set"

- Worker Serviceの環境変数に`REDIS_URL`が設定されているか確認
- 変数参照（`${{Redis.REDIS_URL}}`）が正しく設定されているか確認

### エラー: "Database connection failed"

- Web AppとWorkerサービスの環境変数に`DATABASE_URL`が設定されているか確認
- 変数参照（`${{Postgres.DATABASE_URL}}`）が正しく設定されているか確認

### Workerが起動しない

- 「Logs」タブでエラーログを確認
- スタートコマンドが`npm run start:worker`に設定されているか確認
- 環境変数が正しく設定されているか確認

## 次のステップ

スタートコマンドの設定が完了したら：

1. **デプロイの確認**
   - 「Deployments」タブでデプロイが成功しているか確認
   - 「Logs」タブでエラーがないか確認

2. **動作確認**
   - Web Appの公開URLにアクセス
   - Workerのログで正常起動を確認

3. **テスト実行**
   - スクレイピングジョブのテスト実行
   - ログの監視

---

## 参考

- [Railway - Start Command](https://docs.railway.app/deploy/configuring-your-app#start-command)
- [Railway - railway.json](https://docs.railway.app/reference/railway-json)
