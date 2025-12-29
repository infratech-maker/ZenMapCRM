# トラブルシューティングガイド

## 開発サーバーが起動しない場合

### 1. Node.jsのインストール確認

Node.jsがインストールされているか確認:

```bash
node --version
npm --version
```

**Node.jsがインストールされていない場合:**

macOSの場合:
```bash
# Homebrewを使用
brew install node

# または、公式サイトからインストール
# https://nodejs.org/
```

### 2. 依存関係のインストール

```bash
cd crm-platform
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_platform
TEST_TENANT_ID=00000000-0000-0000-0000-000000000000
```

### 4. データベースの準備

```bash
# Docker環境の起動（プロジェクトルートで）
cd ..
docker-compose up -d

# データベースセットアップ
cd crm-platform
npm run db:push
npm run db:seed:tenant
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

正常に起動すると、以下のメッセージが表示されます:

```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
```

### 6. ブラウザでアクセス

- ホーム: http://localhost:3000
- ダッシュボード: http://localhost:3000/dashboard
- Scraper: http://localhost:3000/dashboard/scraper

## よくあるエラー

### エラー: "Port 3000 is already in use"

別のプロセスがポート3000を使用している場合:

```bash
# ポート3000を使用しているプロセスを確認
lsof -ti:3000

# プロセスを終了
kill -9 $(lsof -ti:3000)

# または、別のポートで起動
PORT=3001 npm run dev
```

### エラー: "Cannot find module"

依存関係がインストールされていない場合:

```bash
npm install
```

### エラー: "Database connection failed"

PostgreSQLが起動していない場合:

```bash
# Docker環境の確認
docker-compose ps

# Docker環境の起動
docker-compose up -d
```

### エラー: "Tenant ID not found"

環境変数が設定されていない場合:

1. `.env.local` ファイルを確認
2. `TEST_TENANT_ID` が設定されているか確認
3. サーバーを再起動

### エラー: "relation does not exist"

データベースマイグレーションが実行されていない場合:

```bash
npm run db:push
```

## 開発サーバーの起動確認

開発サーバーが正常に起動しているか確認:

1. **ターミナルで確認**:
   ```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
   ```

2. **ブラウザで確認**:
   - http://localhost:3000 にアクセス
   - ホームページが表示されることを確認

3. **コンソールで確認**:
   - ブラウザの開発者ツール（F12）を開く
   - エラーがないか確認

## 次のステップ

問題が解決しない場合は、以下を確認してください:

1. Node.jsのバージョン（推奨: v18以上）
2. データベース接続設定
3. 環境変数の設定
4. ポートの競合

詳細は [QUICK_START.md](./QUICK_START.md) を参照してください。

