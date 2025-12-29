#!/bin/bash

# Tabelogデータを一括インポートするスクリプト

DATA_DIR="$HOME/Desktop/名称未設定フォルダ/out"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"
export PATH="/opt/homebrew/bin:$PATH"

echo "🚀 Tabelogデータ一括インポート"
echo ""

# データディレクトリの確認
if [ ! -d "$DATA_DIR" ]; then
    echo "❌ データディレクトリが見つかりません: $DATA_DIR"
    exit 1
fi

# JSONファイルのリストを取得
JSON_FILES=$(find "$DATA_DIR" -name "tabelog_*.json" -type f | sort)

if [ -z "$JSON_FILES" ]; then
    echo "❌ Tabelog JSONファイルが見つかりません"
    exit 1
fi

echo "📂 見つかったファイル:"
echo "$JSON_FILES" | while read -r file; do
    echo "  - $(basename "$file")"
done
echo ""

# 確認
read -p "これらのファイルをインポートしますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "キャンセルしました"
    exit 0
fi

echo ""
echo "インポート開始..."
echo ""

# 各ファイルをインポート
TOTAL_SUCCESS=0
TOTAL_ERROR=0

echo "$JSON_FILES" | while read -r file; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📄 $(basename "$file")"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    tsx scripts/import-tabelog-data.ts "$file"
    
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ すべてのインポートが完了しました"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

