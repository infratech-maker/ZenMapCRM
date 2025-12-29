# データインポートガイド

既存のリストデータをデータベースにインポートする方法です。

## サポートされている形式

- **CSV形式** (.csv)
- **JSON形式** (.json)

## インポート先テーブル

### 1. リードデータ (`leads` テーブル)

スクレイピングで取得したリード情報をインポートします。

```bash
tsx scripts/import-leads.ts <ファイルパス> [--format csv|json]
```

**CSV形式の例:**

```csv
source,data,status,notes
https://example.com/page1,"{""name"":""会社A"",""phone"":""09012345678""}",new,
https://example.com/page2,"{""name"":""会社B"",""email"":""test@example.com""}",new,
```

**JSON形式の例:**

```json
[
  {
    "source": "https://example.com/page1",
    "data": {
      "name": "会社A",
      "phone": "09012345678"
    },
    "status": "new",
    "notes": null
  },
  {
    "source": "https://example.com/page2",
    "data": {
      "name": "会社B",
      "email": "test@example.com"
    },
    "status": "new"
  }
]
```

### 2. 顧客データ (`customers` テーブル)

顧客マスタデータをインポートします。

```bash
tsx scripts/import-customers.ts <ファイルパス> [--format csv|json]
```

**CSV形式の例:**

```csv
phone_number,email,name,status,source,notes
09012345678,test1@example.com,山田太郎,lead,import,備考1
09087654321,test2@example.com,佐藤花子,contacted,import,備考2
```

**JSON形式の例:**

```json
[
  {
    "phone_number": "09012345678",
    "email": "test1@example.com",
    "name": "山田太郎",
    "status": "lead",
    "source": "import",
    "notes": "備考1"
  },
  {
    "phone_number": "09087654321",
    "email": "test2@example.com",
    "name": "佐藤花子",
    "status": "contacted",
    "source": "import",
    "notes": "備考2"
  }
]
```

## 使用例

### リードデータのインポート

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"

# CSV形式
tsx scripts/import-leads.ts data/leads.csv --format csv

# JSON形式
tsx scripts/import-leads.ts data/leads.json --format json
```

### 顧客データのインポート

```bash
# CSV形式
tsx scripts/import-customers.ts data/customers.csv --format csv

# JSON形式
tsx scripts/import-customers.ts data/customers.json --format json
```

## データ形式の詳細

### リードデータ (`leads`)

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| source | text | ✅ | 取得元URL |
| data | jsonb | ✅ | リードデータ（JSON形式） |
| status | text | | ステータス（デフォルト: "new"） |
| notes | text | | 備考 |

### 顧客データ (`customers`)

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| phone_number | text | ⚠️ | 電話番号（emailとどちらか必須） |
| email | text | ⚠️ | メールアドレス（phone_numberとどちらか必須） |
| name | text | | 名前 |
| status | text | | ステータス（デフォルト: "lead"） |
| source | text | | 取得元（デフォルト: "import"） |
| notes | text | | 備考 |
| tags | array | | タグ（カンマ区切り文字列または配列） |

## 注意事項

1. **テナントID**: 自動的に環境変数 `TEST_TENANT_ID` から取得されます
2. **重複チェック**: 電話番号はテナント内でユニークです
3. **エラーハンドリング**: エラーが発生した行はスキップされ、処理が続行されます
4. **データ形式**: CSVの場合は、カンマ区切りで、最初の行がヘッダーである必要があります

## トラブルシューティング

### エラー: "ファイルが見つかりません"

ファイルパスを確認してください。相対パスの場合は、プロジェクトルートからのパスを指定してください。

### エラー: "電話番号またはメールアドレスが必要です"

顧客データの場合、`phone_number` または `email` のどちらかが必須です。

### エラー: "relation does not exist"

データベーススキーマが作成されていない可能性があります。以下を実行してください:

```bash
npm run db:push
```

