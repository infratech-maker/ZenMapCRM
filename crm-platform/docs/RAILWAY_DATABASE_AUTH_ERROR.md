# Railway PostgreSQL パスワード認証エラーの対処方法

## 🔴 エラーメッセージ

```
FATAL: password authentication failed for user "postgres"
DETAIL: Connection matched file "/var/lib/postgresql/data/pgdata/pg_hba.conf" line 128: "host all all all scram-sha-256"
```

## 📋 原因

RailwayのPostgreSQLデータベースへの接続時に、パスワード認証が失敗しています。主な原因は以下の通りです：

1. **DATABASE_URLのパスワードが間違っている**
2. **環境変数が正しく設定されていない**
3. **Postgresサービスのパスワードが変更された**
4. **接続URLの形式が正しくない**

## 🔧 対処方法

### ステップ1: Railway環境変数の確認

1. Railwayダッシュボードで「**Postgres**」サービスを選択
2. 「**Variables**」タブを開く
3. **`DATABASE_URL`** の値を確認

**確認ポイント:**
- パスワードが正しく含まれているか
- URLの形式が正しいか（`postgresql://postgres:password@host:port/database`）
- 特殊文字がエンコードされているか

### ステップ2: DATABASE_URLの再生成

#### 方法1: RailwayのDatabaseタブから取得

1. 「**Postgres**」サービスの「**Database**」タブを開く
2. 「**Connection**」セクションの「**Connection URL**」をコピー
3. このURLを`DATABASE_URL`として使用

#### 方法2: 環境変数から再構築

1. 「**Variables**」タブで以下の値を確認：
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

2. 以下の形式で`DATABASE_URL`を構築：
   ```
   postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}
   ```

### ステップ3: Web Appサービスの環境変数を更新

1. Railwayダッシュボードで「**Web App**」サービスを選択
2. 「**Variables**」タブを開く
3. **`DATABASE_URL`** を検索
4. 正しい接続URLに更新
5. 「**Save**」をクリック

**注意**: Railwayが自動的に再デプロイを開始します。

### ステップ4: 接続URLの形式確認

正しい形式：
```
postgresql://postgres:password@hostname.proxy.rlwy.net:port/railway
```

**重要なポイント:**
- パスワードに特殊文字（`@`, `:`, `/`, `#`など）が含まれる場合は、URLエンコードが必要
- 例: `@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`

### ステップ5: パスワードのリセット（必要に応じて）

もしパスワードが不明な場合：

1. RailwayのPostgresサービスで「**Settings**」タブを開く
2. 「**Reset Password**」ボタンをクリック
3. 新しいパスワードを生成
4. 新しいパスワードで`DATABASE_URL`を更新

## 🔍 トラブルシューティング

### エラーが続く場合

#### 1. 接続URLの検証

ローカル環境で接続をテスト：

```bash
# DATABASE_URLを環境変数に設定
export DATABASE_URL="postgresql://postgres:password@hostname.proxy.rlwy.net:port/railway"

# Prismaで接続テスト
npx prisma db pull
```

#### 2. Railwayのログを確認

1. 「**Web App**」サービスの「**Logs**」タブを開く
2. エラーメッセージを確認
3. 接続試行のタイミングとエラー内容を記録

#### 3. Postgresサービスの状態確認

1. 「**Postgres**」サービスの「**Metrics**」タブを確認
2. サービスが正常に動作しているか確認
3. 接続数やリソース使用状況を確認

### よくある問題

#### 問題1: パスワードに特殊文字が含まれている

**解決方法**: URLエンコードを使用

```bash
# 例: パスワードが "p@ssw:rd" の場合
# エンコード後: "p%40ssw%3Ard"
postgresql://postgres:p%40ssw%3Ard@hostname.proxy.rlwy.net:port/railway
```

#### 問題2: 環境変数が更新されていない

**解決方法**: 
1. 環境変数を保存後、再デプロイが完了するまで待つ（通常2-3分）
2. 再デプロイが完了したら、再度接続を試みる

#### 問題3: 複数のDATABASE_URLが存在する

**解決方法**: 
- Railway-added Variablesの`DATABASE_URL`とUser-defined Variablesの`DATABASE_URL`が競合している可能性
- User-defined Variablesの`DATABASE_URL`を削除し、Railway-added Variablesのものを使用

## ✅ 確認チェックリスト

- [ ] RailwayのPostgresサービスが正常に動作している
- [ ] `DATABASE_URL`が正しい形式である
- [ ] パスワードが正しく設定されている
- [ ] 特殊文字がURLエンコードされている
- [ ] Web Appサービスの環境変数が更新されている
- [ ] 再デプロイが完了している
- [ ] ローカル環境で接続テストが成功している

## 📝 まとめ

パスワード認証エラーが発生した場合：

1. **Railwayの環境変数を確認**: `DATABASE_URL`が正しく設定されているか
2. **接続URLの形式を確認**: 正しい形式であるか、特殊文字がエンコードされているか
3. **再デプロイを確認**: 環境変数更新後、再デプロイが完了しているか
4. **接続テスト**: ローカル環境で接続をテスト

問題が続く場合は、Railwayのサポートに問い合わせるか、Postgresサービスのパスワードをリセットしてください。

---

**最終更新**: 2025-01-20
