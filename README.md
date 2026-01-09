# Sales List-toolApp

統合CRMプラットフォームとAvaloniaデスクトップアプリケーションの統合プロジェクト。

## プロジェクト構成

- **Sales List-toolApp**: Avalonia UI フレームワークを使用した .NET 8.0 デスクトップアプリケーション
- **crm-platform**: Next.js 15 ベースの統合CRMプラットフォーム（Webアプリケーション）

## 技術スタック

### Sales List-toolApp (.NET)
- **Framework**: .NET 8.0
- **UI Framework**: Avalonia 11.3.0
- **Platform**: Windows, macOS, Linux

### crm-platform (Next.js)
詳細は [crm-platform/README.md](./crm-platform/README.md) を参照してください。

## セットアップ

### 前提条件
- .NET 8.0 SDK
- Node.js 20.x
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### クイックスタート

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd apclo-partner-crm
   ```

2. **Docker環境の起動**
   ```bash
   docker-compose up -d
   ```

3. **crm-platformのセットアップ**
   ```bash
   cd crm-platform
   ./start-dev.sh
   ```
   詳細は [crm-platform/README.md](./crm-platform/README.md) を参照してください。

4. **Sales List-toolAppのビルド**
   ```bash
   dotnet restore
   dotnet build
   dotnet run
   ```

## さくらクラウド環境

### 本番環境情報

- **サーバーIP**: 153.121.65.42
- **アプリケーションURL**: http://153.121.65.42:5000/list-tool
- **データベース**: PostgreSQL 16 (localhost:5432)
- **データベース名**: restaurants_db
- **Redis**: localhost:6379

### デプロイ方法

詳細は各プロジェクトのドキュメントを参照してください。

- **crm-platform**: [crm-platform/README.md](./crm-platform/README.md)

## 開発

### コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コーディング規約

- C#: .NET コーディング規約に準拠
- TypeScript/JavaScript: ESLint と Prettier を使用
- コミットメッセージ: 明確で説明的なメッセージを使用

## ライセンス

MIT



