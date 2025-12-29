#!/bin/bash

# 開発サーバー起動スクリプト

set -e

echo "🚀 統合CRMプラットフォーム - 開発サーバー起動スクリプト"
echo ""

# カレントディレクトリを確認
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Node.jsの確認
if ! command -v node &> /dev/null; then
    echo "❌ Node.jsがインストールされていません"
    echo ""
    echo "インストール方法:"
    echo "  macOS: brew install node"
    echo "  または: https://nodejs.org/ からダウンロード"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# 環境変数ファイルの確認
if [ ! -f .env.local ]; then
    echo "📝 .env.local ファイルを作成中..."
    cat > .env.local << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_platform
TEST_TENANT_ID=00000000-0000-0000-0000-000000000000
EOF
    echo "✅ .env.local を作成しました"
else
    echo "✅ .env.local が存在します"
fi
echo ""

# 依存関係の確認
if [ ! -d node_modules ]; then
    echo "📦 依存関係をインストール中..."
    npm install
    echo "✅ 依存関係のインストールが完了しました"
else
    echo "✅ node_modules が存在します"
fi
echo ""

# Docker環境の確認
echo "🐳 Docker環境を確認中..."
cd ..
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        echo "✅ Docker が起動しています"
        docker-compose up -d 2>/dev/null || echo "⚠️  Docker Composeの起動に失敗しました（既に起動している可能性があります）"
    else
        echo "⚠️  Docker が起動していません。Docker Desktopを起動してください"
    fi
else
    echo "⚠️  Docker がインストールされていません"
fi
echo ""

# 開発サーバーの起動
cd "$SCRIPT_DIR"
echo "🚀 開発サーバーを起動します..."
echo "   http://localhost:3000 でアクセスできます"
echo ""
echo "停止するには Ctrl+C を押してください"
echo ""

npm run dev

