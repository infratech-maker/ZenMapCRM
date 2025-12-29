# Docker Desktop インストールガイド

## システム情報

macOS環境でのDocker Desktopインストール手順です。

## インストール方法

### 方法1: 公式サイトからダウンロード（推奨）

1. **Docker Desktopのダウンロードページにアクセス**:
   - https://www.docker.com/products/docker-desktop

2. **適切なバージョンを選択**:
   - **Apple Silicon Mac (M1/M2/M3)**: "Download for Mac – Apple Silicon"
   - **Intel Mac**: "Download for Mac – Intel Chip"

3. **ダウンロードしたファイルを実行**:
   - `.dmg` ファイルをダブルクリック
   - Docker.appをApplicationsフォルダにドラッグ&ドロップ

4. **Docker Desktopを起動**:
   - ApplicationsフォルダからDocker.appを起動
   - 初回起動時は管理者権限が必要です

### 方法2: Homebrewを使用（コマンドライン）

```bash
# Homebrewでインストール
brew install --cask docker

# Docker Desktopを起動
open -a Docker
```

## インストール後の確認

### 1. Docker Desktopが起動しているか確認

```bash
# Docker Desktopが起動しているか確認
docker ps

# 正常に動作している場合、以下のような出力が表示されます:
# CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

### 2. Docker Composeの確認

```bash
# Docker Composeが利用可能か確認
docker-compose --version

# または（新しいバージョン）
docker compose version
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

Docker Desktopが使用するポート（例: 2375, 2376）が他のアプリケーションと競合している場合:

1. Docker Desktopの設定を開く
2. Resources > Advanced でポート設定を確認
3. 必要に応じて変更

## 参考リンク

- [Docker Desktop公式サイト](https://www.docker.com/products/docker-desktop)
- [Docker Desktopドキュメント](https://docs.docker.com/desktop/)
- [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)

