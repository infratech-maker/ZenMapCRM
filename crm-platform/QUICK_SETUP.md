# クイックセットアップガイド

## 現在の状況

✅ `.env.local` ファイルを作成しました

## 次のステップ

### 1. Node.jsのインストール（必須）

**macOSの場合:**

```bash
# Homebrewを使用（推奨）
brew install node

# インストール確認
node --version  # v18以上が推奨
npm --version
```

**Homebrewがインストールされていない場合:**

1. https://nodejs.org/ にアクセス
2. LTS版（推奨）をダウンロード
3. インストーラーを実行

### 2. 依存関係のインストール

Node.jsをインストールした後、以下を実行:

```bash
cd /Users/a/CallSenderApp/crm-platform
npm install
```

### 3. Docker環境の起動（データベース用）

```bash
cd /Users/a/CallSenderApp
docker-compose up -d
```

**Docker Desktopがインストールされていない場合:**

1. https://www.docker.com/products/docker-desktop からインストール
2. Docker Desktopを起動
3. 上記のコマンドを実行

### 4. データベースセットアップ

```bash
cd /Users/a/CallSenderApp/crm-platform

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

### 5. 開発サーバーの起動

```bash
cd /Users/a/CallSenderApp/crm-platform
npm run dev
```

または、自動化スクリプトを使用:

```bash
cd /Users/a/CallSenderApp/crm-platform
./start-dev.sh
```

### 6. ブラウザでアクセス

開発サーバーが起動したら、以下のURLにアクセス:

- **ホーム**: http://localhost:3000
- **ダッシュボード**: http://localhost:3000/dashboard
- **Scraper**: http://localhost:3000/dashboard/scraper
- **Leads**: http://localhost:3000/dashboard/leads

## トラブルシューティング

### Node.jsのインストールができない

1. **Homebrewのインストール**:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **パスの設定**:
   ```bash
   echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Node.jsのインストール**:
   ```bash
   brew install node
   ```

### Dockerが起動しない

1. Docker Desktopがインストールされているか確認
2. Docker Desktopを起動
3. `docker ps` で動作確認

### ポート3000が使用中

```bash
# 使用中のプロセスを確認
lsof -ti:3000

# プロセスを終了
kill -9 $(lsof -ti:3000)

# または、別のポートで起動
PORT=3001 npm run dev
```

## 完了チェックリスト

- [ ] Node.jsがインストールされている（`node --version` で確認）
- [ ] npmがインストールされている（`npm --version` で確認）
- [ ] `.env.local` ファイルが存在する
- [ ] `npm install` が完了している
- [ ] Docker環境が起動している
- [ ] データベースセットアップが完了している
- [ ] 開発サーバーが起動している（`npm run dev`）
- [ ] ブラウザで http://localhost:3000 にアクセスできる

## サポート

問題が解決しない場合は、以下を確認してください:

1. Node.jsのバージョン（推奨: v18以上）
2. データベース接続設定（`.env.local`）
3. Docker環境の状態
4. ポートの競合

詳細は [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を参照してください。

