# 次のステップ

## ✅ 完了したこと

1. ✅ Node.js v25.2.1 のインストール
2. ✅ npm 11.6.2 のインストール
3. ✅ 依存関係のインストール（476パッケージ）
4. ✅ `.env.local` ファイルの作成

## ⚠️ 対応が必要なこと

### 1. Docker環境の起動（データベース用）

データベースを使用するには、Docker環境を起動する必要があります。

**Docker Desktopがインストールされていない場合:**

1. https://www.docker.com/products/docker-desktop からインストール
2. Docker Desktopを起動
3. 以下のコマンドを実行:

```bash
cd /Users/a/CallSenderApp
docker-compose up -d
```

**Docker Desktopがインストールされている場合:**

```bash
# Docker Desktopを起動
open -a Docker

# 起動を待つ（数秒）
sleep 10

# Docker Composeでサービスを起動
cd /Users/a/CallSenderApp
docker-compose up -d
```

### 2. データベースセットアップ

Docker環境が起動したら、以下を実行:

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"

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

### 3. 開発サーバーの起動

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"
npm run dev
```

## 現在の状態

- ✅ Node.js/npm がインストール済み
- ✅ 依存関係がインストール済み
- ⚠️ Docker環境が未起動（データベース接続エラー）
- ⚠️ データベースセットアップが未完了

## 開発サーバーの起動方法

### 方法1: 直接起動

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"
npm run dev
```

### 方法2: 自動化スクリプトを使用

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"
./start-dev.sh
```

## ブラウザでアクセス

開発サーバーが起動したら、以下のURLにアクセス:

- **ホーム**: http://localhost:3000
- **ダッシュボード**: http://localhost:3000/dashboard
- **Scraper**: http://localhost:3000/dashboard/scraper

## 注意事項

- データベースが起動していない場合、一部の機能（スクレイピングジョブの作成など）は動作しません
- まずはDocker環境を起動してから、データベースセットアップを実行してください

## トラブルシューティング

### ポート3000が使用中

```bash
# 使用中のプロセスを確認
lsof -ti:3000

# プロセスを終了
kill -9 $(lsof -ti:3000)
```

### Node.jsのパスが通っていない

`.zshrc` または `.bash_profile` に以下を追加:

```bash
export PATH="/opt/homebrew/bin:$PATH"
```

その後、ターミナルを再起動するか:

```bash
source ~/.zshrc
```

