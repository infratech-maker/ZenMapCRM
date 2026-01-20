# Railwayデプロイ完了チェックリスト

このドキュメントは、Railwayデプロイの各ステップの完了状況を確認するためのチェックリストです。

## ✅ 完了チェックリスト

### ステップ1: サービス作成
- [x] PostgreSQLサービス作成
- [x] Redisサービス作成
- [x] Web App Service作成
- [x] Worker Service作成

### ステップ2: ルートディレクトリ設定
- [x] Web App Service: `crm-platform` に設定
- [x] Worker Service: `crm-platform` に設定

### ステップ3: DBスキーマのプッシュ
- [x] Postgres Connection URL取得
- [x] ローカルから `npm run db:push` 実行
- [x] テーブル作成確認（RailwayのDatabaseタブで確認）

### ステップ4: 環境変数の設定
- [x] Web App Serviceの環境変数設定
  - [x] `DATABASE_URL = ${{Postgres.DATABASE_URL}}`
  - [x] `REDIS_URL = ${{Redis.REDIS_URL}}`
  - [x] `NEXTAUTH_SECRET = xxvBhKgjRjffncqPzNRzn5Rg4q9lmgTIODyGI/my1f8=`
  - [x] `NEXTAUTH_URL = https://${{RAILWAY_PUBLIC_DOMAIN}}`
- [x] Worker Serviceの環境変数設定
  - [x] `DATABASE_URL = ${{Postgres.DATABASE_URL}}`
  - [x] `REDIS_URL = ${{Redis.REDIS_URL}}`
  - [x] `NEXTAUTH_SECRET = xxvBhKgjRjffncqPzNRzn5Rg4q9lmgTIODyGI/my1f8=`
  - [x] `NEXTAUTH_URL = https://${{RAILWAY_PUBLIC_DOMAIN}}`

### ステップ5: スタートコマンドの設定
- [x] Web App Service: `npm start`（railway.jsonに設定済み）
- [ ] Worker Service: `npm run start:worker` ← **ここを設定**

### ステップ6: デプロイ確認
- [ ] Web App Serviceのデプロイ確認
  - [ ] Deploymentsタブで「Active」を確認
  - [ ] Logsタブでエラーがないか確認
- [ ] Worker Serviceのデプロイ確認
  - [ ] Deploymentsタブで「Active」を確認
  - [ ] Logsタブで以下が表示されることを確認:
    - [ ] `✅ Database connection established`
    - [ ] `✅ Redis connection established`
    - [ ] `✅ Worker started and listening for jobs...`

### ステップ7: 動作確認
- [ ] Web Appの公開URLにアクセス
- [ ] ログイン画面が表示されることを確認
- [ ] スクレイピングジョブのテスト実行

---

## 現在の状態

### ✅ 正常に動作しているサービス

- **Postgres**: Online
- **Redis**: Online（正常起動確認済み）
  - Redis version=8.2.1
  - Running mode=standalone, port=6379
  - Ready to accept connections tcp

### ⏳ 設定が必要な項目

- **Worker Service**: スタートコマンドの設定
  - Settings → Start Command → `npm run start:worker`

---

## 次のステップ

### 1. Worker Serviceのスタートコマンド設定

1. Railwayダッシュボードで「Worker」サービスを選択
2. 「Settings」タブを開く
3. 「Start Command」セクションを探す
4. `npm run start:worker` を入力
5. 保存

### 2. デプロイの確認

スタートコマンドを設定すると、Railwayが自動的にリデプロイを開始します。

**確認方法**:
- 「Deployments」タブでデプロイの進行状況を確認
- 「Logs」タブでログを確認

### 3. Worker Serviceのログ確認

正常に起動している場合、以下のログが表示されます：

```
✅ Database connection established
✅ Redis connection established
✅ Worker started and listening for jobs...
```

### 4. Web App Serviceの確認

- 「Deployments」タブで「Active」になっているか確認
- 「Settings」→「Domains」で公開URLを確認
- ブラウザでアクセスして動作確認

---

## トラブルシューティング

### Workerが起動しない

1. 「Logs」タブでエラーログを確認
2. 環境変数が正しく設定されているか確認
3. スタートコマンドが`npm run start:worker`に設定されているか確認

### Web Appが起動しない

1. 「Logs」タブでエラーログを確認
2. ビルドが成功しているか確認（「Deployments」タブ）
3. 環境変数が正しく設定されているか確認

### 接続エラー

1. 環境変数の変数参照（`${{...}}`）が正しいか確認
2. PostgresとRedisサービスが起動しているか確認
3. サービス名が正確に一致しているか確認

---

## 参考

- [Railway - Start Command](https://docs.railway.app/deploy/configuring-your-app#start-command)
- [Railway - Environment Variables](https://docs.railway.app/develop/variables)
