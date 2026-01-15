# ローカルからDBスキーマをプッシュする手順

このドキュメントは、ローカルのターミナルからRailwayのPostgresデータベースにスキーマをプッシュする手順を説明します。

## なぜローカルから実行するのか？

- RailwayのPostgresデータベースは外部から接続可能な公開エンドポイントを持っています
- ローカルの開発環境から直接データベースに接続してスキーマを作成できます
- Railwayのサービス内で実行する必要はありません

## 前提条件

- RailwayでPostgresサービスが作成済み
- `DATABASE_PUBLIC_URL` を取得済み
- ローカルに `drizzle-kit` がインストール済み（`npm install` でインストールされます）

## 実行手順

### ステップ1: ターミナルを開く

1. Cursorでターミナルを開く
   - ショートカット: `Cmd + ` (Mac) または `Ctrl + ` (Windows)
   - または: `View` → `Terminal`

### ステップ2: プロジェクトディレクトリに移動

```bash
cd crm-platform
```

### ステップ3: DBスキーマをプッシュ

以下のコマンドを実行します（1行で実行してください）：

```bash
DATABASE_URL="postgresql://postgres:QZrnStFMBwoESAMCureccsNeuxvCIyQO@hopper.proxy.rlwy.net:44735/railway" npm run db:push
```

**重要**: 
- URLはダブルクォートで囲んでください
- パスワード部分は実際の値に置き換えてください
- エンドポイント（`hopper.proxy.rlwy.net:44735`）は実際の値に置き換えてください

### ステップ4: 確認プロンプトに回答

コマンドを実行すると、以下のようなプロンプトが表示されます：

```
❯ No, abort
  Yes, I want to execute all statements
```

**選択方法**:
1. ターミナル内をクリックしてフォーカスを当てる
2. キーボードで `y` を入力
3. Enterキーを押す

または、矢印キー（↓）で「Yes」を選択してEnter

### ステップ5: 実行結果の確認

成功すると、以下のようなメッセージが表示されます：

```
✓ Pushing schema to database...
✓ Schema pushed successfully
```

エラーが表示された場合は、エラーメッセージを確認してください。

## よくある質問

### Q: コマンドが長すぎて入力しにくい

A: 以下のように環境変数を事前に設定できます：

```bash
export DATABASE_URL="postgresql://postgres:QZrnStFMBwoESAMCureccsNeuxvCIyQO@hopper.proxy.rlwy.net:44735/railway"
npm run db:push
```

### Q: 接続エラーが発生する

A: 以下を確認してください：
- RailwayのPostgresサービスが起動しているか
- `DATABASE_PUBLIC_URL` が正しいか（`.proxy.rlwy.net` を含む公開エンドポイント）
- ファイアウォールやネットワーク設定を確認

### Q: スキーマが既に存在する場合

A: `drizzle-kit push` は既存のスキーマと差分を検出し、必要な変更のみを適用します。既存のテーブルは削除されません。

### Q: 実行に時間がかかる

A: 初回実行時は多くのテーブルを作成するため、数分かかる場合があります。正常です。

## 実行後の確認

スキーマのプッシュが完了したら、RailwayのPostgresサービスで確認：

1. RailwayダッシュボードでPostgresサービスを選択
2. 「Database」タブを開く
3. 「Query」タブで以下を実行：

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

## 次のステップ

スキーマのプッシュが完了したら：

1. RailwayのWeb AppとWorkerサービスの環境変数を設定
2. スタートコマンドを設定
3. デプロイを確認

---

## 参考

- [Drizzle ORM - Push Schema](https://orm.drizzle.team/docs/kit-docs/overview#push)
- [Railway - Database Connection](https://docs.railway.app/databases/postgresql)
