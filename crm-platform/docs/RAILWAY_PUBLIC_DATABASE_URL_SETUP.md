# Railway PUBLIC_DATABASE_URL の作成手順

`PUBLIC_DATABASE_URL`が存在しない場合の対処方法です。

## 📋 確認事項

### 1. PostgresサービスのVariablesタブを確認

1. Railwayダッシュボードで「**Postgres**」サービスを選択
2. 「**Variables**」タブを開く
3. `PUBLIC_DATABASE_URL`が存在するか確認

**存在しない場合**: 以下の手順で作成または確認してください。

---

## 📋 方法1: Public Networkingを有効にする（推奨）

`PUBLIC_DATABASE_URL`は、PostgresサービスのPublic Networkingが有効になっている場合に自動的に作成されます。

### ステップ1: PostgresサービスのSettingsを確認

1. Railwayダッシュボードで「**Postgres**」サービスを選択
2. 「**Settings**」タブを開く
3. 「**Networking**」セクションを確認

### ステップ2: Public Networkingを有効にする

1. 「**Networking**」セクションで「**Public Networking**」を探す
2. 「**Generate Domain**」または「**Enable Public Networking**」ボタンをクリック
3. これにより、外部接続可能なURLが生成され、`PUBLIC_DATABASE_URL`が自動的に作成されます

### ステップ3: PUBLIC_DATABASE_URLの確認

1. 「**Variables**」タブに戻る
2. `PUBLIC_DATABASE_URL`が表示されていることを確認
3. 値は `postgresql://postgres:password@hostname.proxy.rlwy.net:port/railway` の形式

---

## 📋 方法2: DATABASE_URLから手動で作成

`DATABASE_URL`が外部接続可能なURL（`.proxy.rlwy.net`を含む）の場合、それを`PUBLIC_DATABASE_URL`として使用できます。

### ステップ1: DATABASE_URLの値を確認

1. Railwayダッシュボードで「**Postgres**」サービスを選択
2. 「**Variables**」タブを開く
3. `DATABASE_URL`の値を確認（編集ボタンをクリックして表示）

### ステップ2: PUBLIC_DATABASE_URLを作成

1. 「**+ New Variable**」ボタンをクリック
2. **Name**: `PUBLIC_DATABASE_URL`
3. **Value**: `DATABASE_URL`の値をコピーして貼り付け
   - 形式: `postgresql://postgres:password@hostname.proxy.rlwy.net:port/railway`
   - 注意: `.railway.internal`で終わるURLは外部接続不可のため使用できません
4. 「**Add**」をクリック

### ステップ3: 外部接続の確認

`DATABASE_URL`が`.railway.internal`で終わる場合（例: `postgres.railway.internal:5432`）は、外部接続できません。この場合は、方法1でPublic Networkingを有効にする必要があります。

---

## 📋 方法3: DatabaseタブからConnection URLを取得

RailwayのDatabaseタブから直接Connection URLを取得できます。

### ステップ1: Databaseタブを開く

1. Railwayダッシュボードで「**Postgres**」サービスを選択
2. 「**Database**」タブを開く
3. 「**Connection**」セクションを確認

### ステップ2: Connection URLをコピー

1. 「**Connection URL**」が表示されていることを確認
2. コピーボタンをクリックしてURLをコピー
3. このURLが外部接続可能な形式（`.proxy.rlwy.net`を含む）であれば、`PUBLIC_DATABASE_URL`として使用できます

### ステップ3: PUBLIC_DATABASE_URLを作成

1. 「**Variables**」タブに戻る
2. 「**+ New Variable**」ボタンをクリック
3. **Name**: `PUBLIC_DATABASE_URL`
4. **Value**: コピーしたConnection URLを貼り付け
5. 「**Add**」をクリック

---

## 🔍 確認方法

### 1. 外部接続のテスト

ローカル環境から接続をテスト：

```bash
# PUBLIC_DATABASE_URLの値を環境変数に設定
export DATABASE_URL="postgresql://postgres:password@hostname.proxy.rlwy.net:port/railway"

# Prismaで接続テスト
npx prisma db pull
```

接続が成功すれば、`PUBLIC_DATABASE_URL`は正しく設定されています。

### 2. URLの形式確認

`PUBLIC_DATABASE_URL`は以下の形式である必要があります：

```
postgresql://postgres:password@hostname.proxy.rlwy.net:port/railway
```

**重要なポイント:**
- `proxy.rlwy.net`を含む → 外部接続可能 ✅
- `.railway.internal`で終わる → 外部接続不可 ❌

---

## ⚠️ 注意事項

### セキュリティ

- `PUBLIC_DATABASE_URL`は外部からアクセス可能なURLです
- パスワードが含まれているため、機密情報として扱ってください
- GitHubなどにコミットしないでください

### 接続制限

- Railwayの無料プランでは、外部接続に制限がある場合があります
- 接続がタイムアウトする場合は、Railwayのサポートに問い合わせてください

### 代替方法

`PUBLIC_DATABASE_URL`が作成できない場合：
- RailwayのQueryタブから直接SQLを実行する方法もあります
- または、Railway CLIを使用してローカルから接続することも可能です

---

## 📝 まとめ

`PUBLIC_DATABASE_URL`が存在しない場合：

1. **方法1（推奨）**: PostgresサービスのPublic Networkingを有効にする
   - Settings → Networking → Generate Domain
   - `PUBLIC_DATABASE_URL`が自動的に作成されます

2. **方法2**: `DATABASE_URL`が外部接続可能な形式であれば、それをコピーして`PUBLIC_DATABASE_URL`として作成

3. **方法3**: DatabaseタブからConnection URLを取得して、`PUBLIC_DATABASE_URL`として作成

どの方法でも、最終的に`PUBLIC_DATABASE_URL`が`.proxy.rlwy.net`を含む形式になっていれば、外部から接続可能です。

問題があれば、エラーメッセージを共有してください。
