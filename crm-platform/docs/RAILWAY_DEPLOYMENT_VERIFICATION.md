# Railwayデプロイ確認ガイド

このドキュメントは、Railwayでのデプロイが正常に完了したかを確認する方法を説明します。

## デプロイ確認のタイミング

スタートコマンドを設定すると、Railwayが自動的にリデプロイを開始します。デプロイには数分かかる場合があります。

## 確認手順

### ステップ1: Deploymentsタブで確認

#### Web App Service

1. Railwayダッシュボードで「Web App」サービスを選択
2. 「Deployments」タブを開く
3. 最新のデプロイが「Active」になっているか確認
4. ステータスが「Active」であれば成功

#### Worker Service

1. Railwayダッシュボードで「Worker」サービスを選択
2. 「Deployments」タブを開く
3. 最新のデプロイが「Active」になっているか確認
4. ステータスが「Active」であれば成功

### ステップ2: Logsタブで確認

#### Web App Serviceのログ

正常に起動している場合、以下のようなログが表示されます：

```
✓ Starting...
✓ Ready in Xms
```

エラーが表示されている場合は、エラーメッセージを確認してください。

#### Worker Serviceのログ

正常に起動している場合、以下のログが表示されます：

```
🚀 BullMQ Worker starting...
📊 Queue: scraping-queue
⚙️  Concurrency: 1 (CRITICAL: Set to 1 to prevent OOM)
✅ Database connection established
✅ Redis connection established
✅ Worker started and listening for jobs...
```

**確認ポイント**:
- `✅ Database connection established` - データベース接続成功
- `✅ Redis connection established` - Redis接続成功
- `✅ Worker started and listening for jobs...` - Worker起動成功

### ステップ3: Web Appの動作確認

1. **公開URLの確認**
   - Web App Serviceの「Settings」タブを開く
   - 「Domains」セクションで公開URLを確認
   - 例: `https://your-app-name.up.railway.app`

2. **ブラウザでアクセス**
   - 公開URLにアクセス
   - ログイン画面が表示されることを確認

3. **機能のテスト**
   - ログイン（テスト用アカウントが必要）
   - スクレイピングジョブの作成
   - データの表示

## よくある問題

### デプロイが「Active」にならない

**確認事項**:
1. 「Logs」タブでエラーログを確認
2. ビルドが成功しているか確認
3. 環境変数が正しく設定されているか確認

**よくあるエラー**:
- ビルドエラー: `npm run build`が失敗している
- 環境変数エラー: 必要な環境変数が設定されていない
- 接続エラー: データベースやRedisに接続できない

### Workerが起動しない

**確認事項**:
1. 「Logs」タブでエラーログを確認
2. スタートコマンドが`npm run start:worker`に設定されているか確認
3. 環境変数が正しく設定されているか確認

**よくあるエラー**:
- `REDIS_URL environment variable is not set`
  - 解決: Worker Serviceの環境変数に`REDIS_URL = ${{Redis.REDIS_URL}}`を設定
- `Database connection failed`
  - 解決: Worker Serviceの環境変数に`DATABASE_URL = ${{Postgres.DATABASE_URL}}`を設定

### Web Appが起動しない

**確認事項**:
1. 「Logs」タブでエラーログを確認
2. ビルドが成功しているか確認
3. 環境変数が正しく設定されているか確認

**よくあるエラー**:
- `Cannot find module 'bullmq'`
  - 解決: `package.json`に`bullmq`と`ioredis`が追加されているか確認
- `NEXTAUTH_SECRET is not set`
  - 解決: 環境変数に`NEXTAUTH_SECRET`を設定

## デプロイ成功の確認

以下のすべてが確認できれば、デプロイは成功しています：

- [ ] Web App Serviceが「Active」
- [ ] Worker Serviceが「Active」
- [ ] Web Appのログに「Ready」が表示される
- [ ] Workerのログに「Worker started and listening for jobs...」が表示される
- [ ] Web Appの公開URLにアクセスできる
- [ ] ログイン画面が表示される

## 次のステップ

デプロイが成功したら：

1. **テスト用テナントの作成**（必要に応じて）
2. **スクレイピングジョブのテスト実行**
3. **ログの監視とエラー対応**

---

## 参考

- [Railway - Deployments](https://docs.railway.app/deploy/deployments)
- [Railway - Logs](https://docs.railway.app/deploy/logs)
