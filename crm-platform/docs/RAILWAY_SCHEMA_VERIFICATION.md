# Railway DBスキーマの確認方法

このドキュメントは、RailwayのPostgresサービスでスキーマが正しく作成されたかを確認する方法を説明します。

## スキーマのプッシュが成功したかの確認

### 方法1: テーブル一覧で確認（最も簡単）

1. Railwayダッシュボードで「Postgres」サービスを選択
2. 「Database」タブを開く
3. 「Data」サブタブを開く
4. 「Tables」セクションにテーブル一覧が表示されます

**確認すべきテーブル**:
- ✅ `tenants`
- ✅ `organizations`
- ✅ `products`
- ✅ `customers`
- ✅ `scraping_jobs`
- ✅ `leads`
- ✅ `master_leads`
- ✅ `deals`
- ✅ `kpi_records`
- ✅ `pl_records`
- ✅ `simulations`
- ✅ `organization_closure`
- ✅ `product_field_definitions`
- ✅ `customer_field_values`

これらのテーブルが表示されていれば、スキーマのプッシュは成功しています。

### 方法2: テーブルをクリックしてデータ構造を確認

1. 「Tables」セクションで任意のテーブルをクリック
2. テーブルの構造（カラム、型、制約）が表示されます
3. データが存在する場合は、データも表示されます

### 方法3: SQLクエリで確認（Queryタブがある場合）

**注意**: RailwayのPostgresサービスによっては、Queryタブが表示されない場合があります。その場合は、方法1または方法2を使用してください。

Queryタブがある場合：

1. 「Database」タブを開く
2. 「Data」サブタブ内に「Query」ボタンまたはタブを探す
3. 以下のSQLを実行：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## スキーマが正しく作成されていない場合

### 確認事項

1. **エラーメッセージを確認**
   - ターミナルにエラーメッセージが表示されていないか確認
   - 接続エラーの場合は、`DATABASE_PUBLIC_URL`が正しいか確認

2. **テーブルが一部しか作成されていない**
   - 再度 `npm run db:push` を実行
   - プロンプトが表示されたら `y` + Enter

3. **テーブルが全く表示されない**
   - RailwayのPostgresサービスが起動しているか確認
   - 接続URLが正しいか確認
   - 再度スキーマのプッシュを実行

## 次のステップ

スキーマの確認が完了したら：

1. **環境変数の設定**（Railwayダッシュボード）
   - Web AppとWorkerサービスの両方に設定
   - `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

2. **スタートコマンドの設定**
   - Web App Service: `npm start`
   - Worker Service: `npm run start:worker`

3. **デプロイの確認**
   - Web AppとWorkerサービスが正常に起動しているか確認
   - ログを確認してエラーがないか確認

---

## 参考

- [Railway - Database Management](https://docs.railway.app/databases/postgresql)
- [Drizzle ORM - Push Schema](https://orm.drizzle.team/docs/kit-docs/overview#push)
