# Docker Desktop インストール手順（Apple Silicon Mac）

## システム情報

- **アーキテクチャ**: Apple Silicon (M2)
- **推奨バージョン**: Docker Desktop for Mac – Apple Silicon

## インストール手順

### Step 1: Docker Desktopをダウンロード

1. ブラウザで以下のURLを開く:
   ```
   https://www.docker.com/products/docker-desktop
   ```

2. **"Download for Mac – Apple Silicon"** をクリック
   - または、直接ダウンロードリンク: https://desktop.docker.com/mac/main/arm64/Docker.dmg

### Step 2: インストール

1. ダウンロードした `Docker.dmg` ファイルを開く
2. Docker.appをApplicationsフォルダにドラッグ&ドロップ
3. ApplicationsフォルダからDocker.appを起動

### Step 3: 初回起動

1. Docker Desktopを起動すると、セットアップウィザードが表示されます
2. 必要に応じて管理者権限を入力
3. 初回起動には数分かかる場合があります

### Step 4: インストール確認

ターミナルで以下を実行:

```bash
# Dockerがインストールされているか確認
docker --version

# Docker Composeが利用可能か確認
docker-compose --version

# Dockerが起動しているか確認
docker ps
```

## プロジェクトのDocker環境を起動

Docker Desktopが起動したら、以下のコマンドでプロジェクトのDocker環境を起動:

```bash
cd /Users/a/CallSenderApp
docker-compose up -d
```

## トラブルシューティング

### Docker Desktopが起動しない

1. **システム要件を確認**:
   - macOS 10.15以上
   - 4GB以上のRAM
   - 仮想化が有効になっている

2. **権限の確認**:
   - システム環境設定 > セキュリティとプライバシー
   - Docker Desktopに必要な権限が付与されているか確認

3. **再起動**:
   - Docker Desktopを完全に終了
   - システムを再起動
   - Docker Desktopを再起動

### ポートの競合

Docker Desktopが使用するポートが他のアプリケーションと競合している場合:

1. Docker Desktopの設定を開く
2. Resources > Advanced でポート設定を確認
3. 必要に応じて変更

## 次のステップ

Docker Desktopがインストール・起動したら:

1. **Docker環境の起動**:
   ```bash
   cd /Users/a/CallSenderApp
   docker-compose up -d
   ```

2. **データベースセットアップ**:
   ```bash
   cd /Users/a/CallSenderApp/crm-platform
   export PATH="/opt/homebrew/bin:$PATH"
   npm run db:push
   npm run db:seed:tenant
   ```

3. **開発サーバーの起動**（既に起動中）:
   ```bash
   # 既に起動している場合は、ブラウザでアクセス
   # http://localhost:3000/dashboard/scraper
   ```

## 参考リンク

- [Docker Desktop公式サイト](https://www.docker.com/products/docker-desktop)
- [Docker Desktop for Mac ドキュメント](https://docs.docker.com/desktop/install/mac-install/)

