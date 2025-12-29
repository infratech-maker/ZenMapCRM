# データインポートガイド

既存のTabelogデータをデータベースにインポートする方法です。

## 📊 見つかったデータファイル

### Tabelog JSONデータ
以下のファイルが見つかりました：

| ファイル名 | サイズ | 推定件数 |
|-----------|--------|---------|
| tabelog_東京.json | ~618KB | 約1,200店舗 |
| tabelog_大阪.json | ~621KB | 約1,200店舗 |
| tabelog_神戸.json | ~621KB | 約6,000店舗 |
| tabelog_埼玉.json | ~432KB | 約1,600店舗 |
| tabelog_神奈川.json | ~63KB | 約400店舗 |
| tabelog_千葉.json | ~30KB | 約160店舗 |
| tabelog_愛媛.json | ~232KB | 約800店舗 |
| tabelog_高知.json | 約160KB | 約400店舗 |

**合計**: 約12,000件以上の店舗データ

## 🚀 インポート方法

### 方法1: 個別ファイルをインポート

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"

# 東京データをインポート
npm run db:import:tabelog ~/Desktop/名称未設定フォルダ/out/tabelog_東京.json

# 大阪データをインポート
npm run db:import:tabelog ~/Desktop/名称未設定フォルダ/out/tabelog_大阪.json
```

### 方法2: 一括インポート（推奨）

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"

# すべてのTabelogデータを一括インポート
./scripts/import-all-tabelog.sh
```

### 方法3: 手動でループ処理

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"

for file in ~/Desktop/名称未設定フォルダ/out/tabelog_*.json; do
  echo "インポート中: $(basename "$file")"
  npm run db:import:tabelog "$file"
  echo ""
done
```

## 📋 データ構造

### Tabelog JSON形式

```json
{
  "metadata": {
    "total_stores": 1200,
    "generated_at": "2025-12-17T10:55:26",
    "version": "1.0"
  },
  "stores": [
    {
      "name": "店舗名",
      "tabelog_url": "https://tabelog.com/...",
      "store_id": "13315132",
      "address": "住所",
      "category": "カテゴリ",
      "city": "東京",
      "prefecture": "東京都",
      ...
    }
  ]
}
```

### インポート後のデータ構造（leadsテーブル）

- **source**: tabelog_url または url
- **data**: 店舗データ全体（JSONB）
- **status**: "new"（デフォルト）
- **notes**: "Tabelogデータ: [都市名]"

## ⚠️ 注意事項

1. **テナントID**: 自動的に環境変数 `TEST_TENANT_ID` から取得されます
2. **処理時間**: 12,000件のデータで約5-10分かかる場合があります
3. **進捗表示**: 100件ごとに進捗が表示されます
4. **エラーハンドリング**: エラーが発生した行はスキップされ、処理が続行されます

## 📊 インポート後の確認

### データベースで確認

```bash
cd /Users/a/CallSenderApp
docker exec -i crm-postgres psql -U postgres -d crm_platform -c "SELECT COUNT(*) FROM leads;"
```

### ブラウザで確認

1. http://localhost:3000/dashboard/leads にアクセス
2. インポートされたリードが表示されることを確認

## 🔧 トラブルシューティング

### エラー: "ファイルが見つかりません"

ファイルパスを確認してください。パスに日本語が含まれる場合は、引用符で囲んでください。

### エラー: "relation leads does not exist"

データベーススキーマが作成されていない可能性があります：

```bash
npm run db:push
```

### インポートが途中で止まる

大量のデータをインポートする場合、時間がかかります。進捗表示を確認してください。

## 📝 次のステップ

インポートが完了したら：

1. **リード一覧の確認**: http://localhost:3000/dashboard/leads
2. **データの検証**: データベースで件数を確認
3. **必要に応じて顧客データへの変換**: リードを顧客データに変換する処理を実装

