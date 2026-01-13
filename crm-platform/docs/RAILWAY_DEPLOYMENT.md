# Railwayデプロイ完全手順

このドキュメントは、ZenMap CRMプラットフォームをRailwayにデプロイするための完全な手順を説明します。

## 前提条件

- Railwayアカウントを作成済み
- GitHubリポジトリにコードをプッシュ済み
- RailwayでPostgreSQLとRedisサービスを作成済み

---

## 1. パッケージインストール & Push (ローカル)

依存関係を更新し、Gitに反映させます。

```bash
cd crm-platform
npm install
git add .
git commit -m "ready for deployment"
git push origin main
```

### 注意事項

- `bullmq`と`ioredis`が`package.json`に追加されていることを確認
- すべての変更がコミットされていることを確認

---

## 2. Railway環境変数の設定 (ブラウザ)

WebとWorker、両方のサービスに設定が必要です。`REDIS_URL`だけでは足りません。

### 必須環境変数

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `DATABASE_URL` | PostgreSQL接続URL | RailwayのPostgresサービスから「Connection URL」をコピー |
| `REDIS_URL` | Redis接続URL | RailwayのRedisサービスから「Connection URL」をコピー（`rediss://`で始まる場合も対応） |
| `NEXTAUTH_SECRET` | NextAuth.jsの秘密鍵 | 任意の文字列（生成コマンド: `openssl rand -base64 32`） |
| `NEXTAUTH_URL` | NextAuth.jsのベースURL | `https://${RAILWAY_PUBLIC_DOMAIN}`（またはカスタムドメイン） |

### 環境変数の設定手順

1. Railwayダッシュボードでプロジェクトを開く
2. **Web App Service**を選択
3. 「Variables」タブを開く
4. 上記の環境変数を追加
5. **Worker Service**でも同じ環境変数を追加

### NEXTAUTH_SECRETの生成

```bash
openssl rand -base64 32
```

生成された文字列を`NEXTAUTH_SECRET`に設定してください。

---

## 3. 【最重要】DBスキーマの反映 (ローカルのターミナル)

Railway上のPostgreSQLは空っぽの状態です。ローカルからコマンドを叩いて、テーブルを作成します。

### 手順

1. RailwayのPostgresサービスから「Connection URL」をコピー
2. Cursorのターミナルで以下を実行：

```bash
# Mac/Linux
cd crm-platform
DATABASE_URL="コピーしたURL" npm run db:push

# Windows (PowerShell)
cd crm-platform
$env:DATABASE_URL="コピーしたURL"; npm run db:push
```

### 注意事項

- 「すべて適用しますか？」と聞かれたら `y` (Yes) を選択してください
- この手順は**必須**です。スキーマを反映しないとアプリケーションが動作しません
- スキーマの変更がある場合は、デプロイ前に再度実行してください

### 確認方法

スキーマが正しく反映されたか確認するには：

```bash
# RailwayのPostgresサービスで「Query」タブを開く
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

以下のテーブルが作成されていることを確認：
- `tenants`
- `organizations`
- `products`
- `customers`
- `scraping_jobs`
- `leads`
- `master_leads`
- その他必要なテーブル

---

## 4. スタートコマンドの設定 (Railwayブラウザ)

これが最後です。設定済みであればそのままでOKです。

### Web App Service

1. Railwayダッシュボードで**Web App Service**を選択
2. 「Settings」タブを開く
3. 「Start Command」に以下を設定：
   ```
   npm start
   ```

### Worker Service

1. Railwayダッシュボードで**Worker Service**を選択
2. 「Settings」タブを開く
3. 「Start Command」に以下を設定：
   ```
   npm run start:worker
   ```

### 確認

両方のサービスが起動していることを確認：
- Web App Service: 「Deployments」タブで「Active」になっている
- Worker Service: 「Deployments」タブで「Active」になっている

---

## 5. デプロイ確認

### Web App Service

1. Railwayダッシュボードで**Web App Service**を選択
2. 「Settings」タブの「Domains」セクションで公開URLを確認
3. ブラウザでアクセスして動作確認

### Worker Service

1. Railwayダッシュボードで**Worker Service**を選択
2. 「Logs」タブで以下のログが表示されていることを確認：
   ```
   ✅ Database connection established
   ✅ Redis connection established
   ✅ Worker started and listening for jobs...
   ```

---

## トラブルシューティング

### エラー: "REDIS_URL environment variable is not set"

- Worker Serviceの環境変数に`REDIS_URL`が設定されているか確認
- 環境変数の設定後、サービスを再デプロイしてください

### エラー: "Database connection failed"

- `DATABASE_URL`が正しく設定されているか確認
- RailwayのPostgresサービスが起動しているか確認

### エラー: "Cannot find module 'bullmq'"

- `npm install`が実行されているか確認
- `package.json`に`bullmq`と`ioredis`が追加されているか確認

### スキーマが反映されない

- `DATABASE_URL`が正しいか確認
- `npm run db:push`の実行時にエラーが出ていないか確認
- RailwayのPostgresサービスで直接テーブルを確認

### Workerが起動しない

- Worker Serviceの「Logs」タブでエラーログを確認
- 環境変数が正しく設定されているか確認
- `npm run start:worker`が正しく設定されているか確認

---

## 次のステップ

デプロイが完了したら：

1. テスト用テナントの作成（必要に応じて）
2. スクレイピングジョブのテスト実行
3. ログの監視とエラー対応

---

## 参考リンク

- [Railway公式ドキュメント](https://docs.railway.app/)
- [Drizzle ORMドキュメント](https://orm.drizzle.team/)
- [BullMQドキュメント](https://docs.bullmq.io/)
