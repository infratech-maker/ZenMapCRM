# セットアップ手順（ステップバイステップ）

## 現在の状況

- ❌ Node.js/npm がインストールされていない
- ❌ .env.local ファイルが存在しない
- ❌ Docker が起動していない

## セットアップ手順

### Step 1: Node.jsのインストール

**macOSの場合:**

```bash
# Homebrewを使用（推奨）
brew install node

# インストール確認
node --version  # v18以上が推奨
npm --version
```

**Homebrewがインストールされていない場合:**

1. https://nodejs.org/ から直接インストール
2. LTS版（推奨）をダウンロード
3. インストーラーを実行

### Step 2: 環境変数ファイルの作成

以下のコマンドを実行:

```bash
cd /Users/a/CallSenderApp/crm-platform
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_platform
TEST_TENANT_ID=00000000-0000-0000-0000-000000000000
EOF
```

### Step 3: Docker環境の起動

```bash
cd /Users/a/CallSenderApp
docker-compose up -d
```

### Step 4: 依存関係のインストール

```bash
cd /Users/a/CallSenderApp/crm-platform
npm install
```

### Step 5: データベースセットアップ

```bash
# スキーマをDBにプッシュ
npm run db:push

# テスト用テナントを作成
npm run db:seed:tenant

# RLSポリシーを適用
psql -U postgres -d crm_platform -f src/lib/db/migrations/003_rls_policies.sql

# インデックスを追加
psql -U postgres -d crm_platform -f src/lib/db/migrations/002_multitenant_indexes.sql
psql -U postgres -d crm_platform -f src/lib/db/migrations/005_scraper_rls_indexes.sql
```

### Step 6: 開発サーバーの起動

```bash
npm run dev
```

### Step 7: ブラウザでアクセス

- ホーム: http://localhost:3000
- ダッシュボード: http://localhost:3000/dashboard
- Scraper: http://localhost:3000/dashboard/scraper

## トラブルシューティング

### Node.jsのインストールができない場合

1. Homebrewのインストール:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. パスの設定:
   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
   source ~/.zshrc
   ```

### Dockerが起動しない場合

1. Docker Desktopがインストールされているか確認
2. Docker Desktopを起動
3. `docker ps` で動作確認

### ポート3000が使用中の場合

```bash
# 使用中のプロセスを確認
lsof -ti:3000

# プロセスを終了
kill -9 $(lsof -ti:3000)

# または、別のポートで起動
PORT=3001 npm run dev
```

