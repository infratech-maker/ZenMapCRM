# Railwayデプロイ クイックスタートガイド

このガイドは、RailwayでZenMap CRMをデプロイするための最短手順です。

## 前提条件

- ✅ GitHubリポジトリにコードがプッシュ済み
- ✅ Railwayアカウントを作成済み
- ✅ Railwayでプロジェクトを作成済み

---

## ステップ1: Railwayでサービスを作成

### 1-1. PostgreSQLサービスを作成

1. Railwayダッシュボードでプロジェクトを開く
2. 「+ New」→「Database」→「Add PostgreSQL」を選択
3. サービス名を「Postgres」に設定（任意）
4. 作成完了後、「Connection URL」をコピー（後で使用）

### 1-2. Redisサービスを作成

1. 「+ New」→「Database」→「Add Redis」を選択
2. サービス名を「Redis」に設定（任意）
3. 作成完了後、「Connection URL」をコピー（後で使用）

### 1-3. Web App Serviceを作成

**重要**: 既にZenMapCRMサービスが作成されている場合は、それを「Web App」として使用できます。
新規作成する場合：

1. Railwayダッシュボードの左側「Architecture」パネルで「+ New」ボタンをクリック
2. 「GitHub Repo」を選択
3. リポジトリ一覧から `infratech-maker/ZenMapCRM` を選択
4. サービスが作成されたら、右側の「Settings」タブを開く
5. 「Source」セクションで「Add Root Directory」をクリック
6. ルートディレクトリに `crm-platform` を入力
7. サービス名を「Web App」に変更（任意、左側のサービスカードで右クリック→「Rename」）

### 1-4. Worker Serviceを作成

**重要**: Web App Serviceとは別のサービスとして作成する必要があります。

1. 左側「Architecture」パネルで「+ New」ボタンをクリック
2. 「GitHub Repo」を選択
3. **同じリポジトリ** `infratech-maker/ZenMapCRM` を選択（Web Appと同じリポジトリ）
4. サービスが作成されたら、右側の「Settings」タブを開く
5. 「Source」セクションで「Add Root Directory」をクリック
6. ルートディレクトリに `crm-platform` を入力
7. サービス名を「Worker」に変更（任意）

**結果**: 左側の「Architecture」パネルに以下の3つのサービスが表示されます：
- Postgres (Database)
- Redis (Database)
- Web App (GitHub Repo) ← Webサーバー用
- Worker (GitHub Repo) ← Workerプロセス用

---

## ステップ2: 環境変数の設定

### 2-1. NEXTAUTH_SECRETの生成

ローカルのターミナルで実行：

```bash
openssl rand -base64 32
```

**実行例：**
```bash
$ openssl rand -base64 32
ImVBHgOSXFL07z3aHt5vgJ3FbaNp00cFIfJzGQuVxjg=
```

生成された文字列（例: `ImVBHgOSXFL07z3aHt5vgJ3FbaNp00cFIfJzGQuVxjg=`）をコピーして、後でRailwayの環境変数に設定します。

**注意**: 
- この文字列は秘密鍵なので、安全に保管してください
- 同じ文字列をWeb App ServiceとWorker Serviceの両方に設定します

### 2-2. Web App Serviceの環境変数設定

Railwayダッシュボードで「Web App」サービスを選択し、「Variables」タブで以下を設定：

| 変数名 | 値 | 取得方法 |
|--------|-----|----------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Postgresサービスから自動取得（変数参照） |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Redisサービスから自動取得（変数参照） |
| `NEXTAUTH_SECRET` | `生成した文字列` | ステップ2-1で生成 |
| `NEXTAUTH_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | Railwayが自動設定（変数参照） |

**重要**: `DATABASE_URL` と `REDIS_URL` は、変数参照（`${{ServiceName.VARIABLE}}`）を使用してください。

### 2-3. Worker Serviceの環境変数設定

「Worker」サービスでも同じ環境変数を設定：

| 変数名 | 値 |
|--------|-----|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `NEXTAUTH_SECRET` | `Web Appと同じ値` |
| `NEXTAUTH_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |

---

## ステップ3: スタートコマンドの設定

### 3-1. Web App Service

1. 「Web App」サービスを選択
2. 「Settings」タブを開く
3. 「Start Command」に以下を設定：
   ```
   npm start
   ```

### 3-2. Worker Service

1. 「Worker」サービスを選択
2. 「Settings」タブを開く
3. 「Start Command」に以下を設定：
   ```
   npm run start:worker
   ```

---

## ステップ4: DBスキーマの反映（重要）

環境変数を設定すると自動でリデプロイが走りますが、**DBが空なのでエラーになります**。これは正常です。

### 4-1. Postgres Connection URLの取得

1. Railwayダッシュボードで「Postgres」サービスを選択
2. タブから **「Variables」タブ**を開く（「Settings」タブではない）
3. 以下の変数を確認：
   - **`DATABASE_URL`**: 内部接続用（`.railway.internal`で終わる）
   - **`PUBLIC_DATABASE_URL`**: 外部接続用（`.proxy.rlwy.net`を含む）← **こちらを使用**
4. **`PUBLIC_DATABASE_URL`** の値をコピー
   - 形式: `postgresql://postgres:password@hostname.proxy.rlwy.net:port/railway`
   - 例: `postgresql://postgres:password@hopper.proxy.rlwy.net:44735/railway`

**重要**: 
- ローカルから接続する場合は、**`PUBLIC_DATABASE_URL`** を使用してください
- `DATABASE_URL`（`.railway.internal`で終わる）は、Railway内部のサービス間通信用です
- `PUBLIC_DATABASE_URL`が見つからない場合は、Settings → Networkingで公開エンドポイントを確認

**別の方法（Databaseタブ）:**
- 「Database」タブを開く
- 「Connection」セクションに「Connection URL」が表示されます
- コピーボタンをクリックしてコピー

### 4-2. ローカルからスキーマをプッシュ

ローカルのターミナルで実行：

```bash
cd crm-platform

# Mac/Linux
DATABASE_URL="コピーしたConnection URL" npm run db:push

# Windows (PowerShell)
$env:DATABASE_URL="コピーしたConnection URL"; npm run db:push
```

**重要**: 
- URLはダブルクォートで囲んでください
- 「すべて適用しますか？」と聞かれたら `y` (Yes) を選択

### 4-3. スキーマの確認

RailwayのPostgresサービスで「Query」タブを開き、以下を実行：

```sql
SELECT table_name 
FROM information_schema.tables 
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

## ステップ5: デプロイ確認

### 5-1. Web App Service

1. 「Web App」サービスを選択
2. 「Settings」タブの「Domains」セクションで公開URLを確認
3. ブラウザでアクセスして動作確認

### 5-2. Worker Service

1. 「Worker」サービスを選択
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
- 変数参照（`${{Redis.REDIS_URL}}`）を使用しているか確認
- 環境変数の設定後、サービスを再デプロイ

### エラー: "Database connection failed"

- `DATABASE_URL`が正しく設定されているか確認
- 変数参照（`${{Postgres.DATABASE_URL}}`）を使用しているか確認
- RailwayのPostgresサービスが起動しているか確認

### エラー: "Cannot find module 'bullmq'"

- Railwayのビルドログを確認
- `package.json`に`bullmq`と`ioredis`が追加されているか確認
- リポジトリが最新の状態でプッシュされているか確認

### スキーマが反映されない

- `DATABASE_URL`が正しいか確認（Connection URLを直接使用）
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
- [Railway環境変数の変数参照](https://docs.railway.app/develop/variables#referencing-variables)
- [Drizzle ORMドキュメント](https://orm.drizzle.team/)
- [BullMQドキュメント](https://docs.bullmq.io/)
                            