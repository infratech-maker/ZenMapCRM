# クイックスタートガイド

## 動作確認のためのセットアップ

### 1. 依存関係のインストール

```bash
cd crm-platform
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成：

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_platform
TEST_TENANT_ID=00000000-0000-0000-0000-000000000000
```

### 3. Docker環境の起動

```bash
# プロジェクトルートで実行
cd ..
docker-compose up -d
```

### 4. データベースマイグレーション

```bash
cd crm-platform

# スキーマをDBにプッシュ
npm run db:push

# テスト用テナントを作成
npm run db:seed:tenant

# RLSポリシーを適用
psql -U postgres -d crm_platform -f src/lib/db/migrations/003_rls_policies.sql

# インデックスを追加
psql -U postgres -d crm_platform -f src/lib/db/migrations/005_scraper_rls_indexes.sql
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

### 6. 動作確認

1. ブラウザで `http://localhost:3000/dashboard/scraper` にアクセス
2. URL入力フォームに `https://example.com` を入力
3. "Start Scraping" ボタンをクリック
4. ジョブ一覧に "Pending" ステータスで追加されることを確認

### 7. データベース確認

```bash
psql -U postgres -d crm_platform
```

```sql
-- スクレイピングジョブを確認
SELECT 
  id,
  tenant_id,
  url,
  status,
  created_at
FROM scraping_jobs
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY created_at DESC;
```

## トラブルシューティング

### エラー: "Tenant ID not found"

`.env.local` に `TEST_TENANT_ID` が設定されているか確認し、サーバーを再起動してください。

### エラー: "relation scraping_jobs does not exist"

データベースマイグレーションを実行してください：
```bash
npm run db:push
```

### ページが表示されない

サーバーが正常に起動しているか確認し、コンソールのエラーメッセージを確認してください。

