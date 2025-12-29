# 動作確認ガイド

## 前提条件

以下の手順を完了していることを確認してください：

1. ✅ データベースマイグレーション実行済み
2. ✅ テスト用テナント作成済み
3. ✅ 環境変数設定済み（`.env.local`）

## 動作確認手順

### 1. サーバー起動

```bash
cd crm-platform
npm run dev
```

サーバーが正常に起動すると、以下のメッセージが表示されます：
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
```

### 2. ブラウザでアクセス

以下のURLにアクセス：
```
http://localhost:3000/dashboard/scraper
```

### 3. スクレイピングジョブの作成

1. **URL入力フォーム**に適当なURLを入力（例: `https://example.com`）
2. **"Start Scraping"** ボタンをクリック
3. 成功メッセージが表示されることを確認

### 4. ジョブ一覧の確認

**期待される動作**:
- 下の「スクレイピングジョブ一覧」テーブルに新しい行が追加される
- Status が **"Pending"** と表示される（黄色のバッジ）
- ID、URL、Created At が正しく表示される

### 5. データベースの確認

PostgreSQLに接続して、データが正しく保存されているか確認：

```bash
psql -U postgres -d crm_platform
```

以下のSQLを実行：

```sql
-- テナントIDを確認
SELECT id, name, slug FROM tenants WHERE slug = 'test-co';

-- スクレイピングジョブを確認
SELECT 
  id,
  tenant_id,
  url,
  status,
  created_at
FROM scraping_jobs
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
ORDER BY created_at DESC
LIMIT 10;
```

**期待される結果**:
- `tenant_id` が `00000000-0000-0000-0000-000000000000` であること
- `url` が入力したURLと一致すること
- `status` が `pending` であること
- `created_at` が現在時刻付近であること

## トラブルシューティング

### エラー: "Tenant ID not found"

**原因**: 環境変数 `TEST_TENANT_ID` が設定されていない

**解決策**:
1. `.env.local` ファイルを確認
2. `TEST_TENANT_ID=00000000-0000-0000-0000-000000000000` が設定されているか確認
3. サーバーを再起動

### エラー: "Tenant context not set"

**原因**: `withTenant` 内でテナントIDが取得できていない

**解決策**:
1. テスト用テナントが作成されているか確認：
   ```bash
   npm run db:seed:tenant
   ```
2. 環境変数を再確認

### エラー: "relation scraping_jobs does not exist"

**原因**: データベースマイグレーションが実行されていない

**解決策**:
```bash
npm run db:push
```

### ジョブが表示されない

**原因**: RLSポリシーが適用されていない、またはテナントIDが一致していない

**解決策**:
1. RLSポリシーが適用されているか確認：
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
     AND tablename = 'scraping_jobs';
   ```
2. RLSポリシーを適用：
   ```bash
   psql -U postgres -d crm_platform -f src/lib/db/migrations/003_rls_policies.sql
   ```

## 確認チェックリスト

- [ ] サーバーが正常に起動している
- [ ] `/dashboard/scraper` ページにアクセスできる
- [ ] URL入力フォームが表示される
- [ ] URLを入力して送信できる
- [ ] 成功メッセージが表示される
- [ ] ジョブ一覧に新しい行が追加される
- [ ] Status が "Pending" と表示される
- [ ] データベースにレコードが保存されている
- [ ] `tenant_id` が正しく設定されている

## 次のステップ

動作確認が完了したら：

1. **BullMQ統合**: スクレイピングジョブをBullMQに追加
2. **スクレイピング実装**: Playwrightを使用した実際のスクレイピング処理
3. **リード保存**: スクレイピング結果を `leads` テーブルに保存

