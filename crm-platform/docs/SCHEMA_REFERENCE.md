# スキーマリファレンス

> **最終更新日**: 2024-12-19  
> **自動生成**: このファイルは手動で更新してください

このドキュメントは、データベーススキーマの完全なリファレンスです。実装に変更が入るたびに更新してください。

## 目次

1. [Enum型](#enum型)
2. [テーブル定義](#テーブル定義)
3. [リレーション](#リレーション)
4. [インデックス](#インデックス)

---

## Enum型

### organization_type

**定義場所**: `src/lib/db/schema/organizations.ts`

```typescript
enum organization_type {
  "direct",      // 直営
  "partner_1st", // 1次代理店
  "partner_2nd", // 2次代理店
  "unit",        // ユニット
  "individual"   // 個人
}
```

### field_type

**定義場所**: `src/lib/db/schema/dynamicFields.ts`

```typescript
enum field_type {
  "text",
  "number",
  "date",
  "select",
  "multiselect",
  "textarea",
  "boolean",
  "currency"
}
```

### customer_status

**定義場所**: `src/lib/db/schema/customers.ts`

```typescript
enum customer_status {
  "lead",        // リード（未対応）
  "contacted",   // 接触済み
  "qualified",   // 案件化
  "proposal",    // 提案中
  "negotiation", // 商談中
  "won",         // 獲得
  "lost",        // 失注
  "closed"       // クローズ
}
```

### kpi_type

**定義場所**: `src/lib/db/schema/kpi.ts`

```typescript
enum kpi_type {
  "toss_count",           // トス数
  "toss_rate",            // トス率
  "pre_confirmed",        // 前確
  "post_confirmed",       // 後確
  "et_count",             // ET数
  "activation_same_day",  // 当日開通数
  "activation_next_day",  // 翌日以降開通数
  "conversion_rate"       // コンバージョン率
}
```

### pl_item_type

**定義場所**: `src/lib/db/schema/pl.ts`

```typescript
enum pl_item_type {
  "revenue",          // 売上
  "gross_profit",     // 粗利
  "operating_profit", // 営業利益
  "cost_of_sales",    // 営業原価
  "sga",              // 販管費
  "agency_payment",   // 代理店支払い
  "other_income",     // その他収益
  "other_expense"     // その他費用
}
```

### deal_status

**定義場所**: `src/lib/db/schema/deals.ts`

```typescript
enum deal_status {
  "prospecting",    // 開拓中
  "qualification",  // 資格確認
  "proposal",       // 提案中
  "negotiation",    // 商談中
  "closed_won",     // 獲得
  "closed_lost"     // 失注
}
```

### product_category

**定義場所**: `src/lib/db/schema/products.ts`

```typescript
enum product_category {
  "service",
  "hardware",
  "software",
  "consulting",
  "other"
}
```

---

## テーブル定義

### organizations

**ファイル**: `src/lib/db/schema/organizations.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, DEFAULT random() | 組織ID |
| name | text | NOT NULL | 組織名 |
| code | text | UNIQUE | 組織コード |
| type | organization_type | NOT NULL | 組織タイプ |
| parent_id | uuid | FK -> organizations.id | 親組織ID |
| is_active | boolean | DEFAULT true | 有効フラグ |
| path | text | | Materialized Path |
| level | integer | DEFAULT 0 | 階層レベル |
| created_at | timestamp | DEFAULT now() | 作成日時 |
| updated_at | timestamp | DEFAULT now() | 更新日時 |

### organization_closure

**ファイル**: `src/lib/db/schema/organizations.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| ancestor_id | uuid | FK -> organizations.id, PK | 祖先組織ID |
| descendant_id | uuid | FK -> organizations.id, PK | 子孫組織ID |
| depth | integer | NOT NULL | 距離（0=自己, 1=直接, 2+=間接） |

**複合主キー**: `(ancestor_id, descendant_id)`

### products

**ファイル**: `src/lib/db/schema/products.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, DEFAULT random() | 商材ID |
| name | text | NOT NULL | 商材名 |
| code | text | UNIQUE, NOT NULL | 商材コード |
| category | product_category | NOT NULL | カテゴリ |
| description | text | | 説明 |
| base_price | numeric(15, 2) | | 基本価格 |
| is_active | boolean | DEFAULT true | 有効フラグ |
| created_at | timestamp | DEFAULT now() | 作成日時 |
| updated_at | timestamp | DEFAULT now() | 更新日時 |

### product_field_definitions

**ファイル**: `src/lib/db/schema/dynamicFields.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, DEFAULT random() | 定義ID |
| product_id | uuid | FK -> products.id, NOT NULL | 商材ID |
| field_key | text | NOT NULL | 内部キー |
| field_label | text | NOT NULL | 表示ラベル |
| field_type | field_type | NOT NULL | フィールドタイプ |
| is_required | boolean | DEFAULT false | 必須フラグ |
| is_unique | boolean | DEFAULT false | 重複チェック用 |
| default_value | text | | デフォルト値 |
| options | jsonb | | 選択肢（select/multiselect用） |
| display_order | integer | DEFAULT 0 | 表示順序 |
| is_active | boolean | DEFAULT true | 有効フラグ |
| created_at | timestamp | DEFAULT now() | 作成日時 |
| updated_at | timestamp | DEFAULT now() | 更新日時 |

### customer_field_values

**ファイル**: `src/lib/db/schema/dynamicFields.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, DEFAULT random() | 値ID |
| customer_id | uuid | FK -> customers.id, NOT NULL | 顧客ID |
| field_definition_id | uuid | FK -> product_field_definitions.id, NOT NULL | フィールド定義ID |
| value | jsonb | NOT NULL | 値（型に応じた形式） |
| created_at | timestamp | DEFAULT now() | 作成日時 |
| updated_at | timestamp | DEFAULT now() | 更新日時 |

### customers

**ファイル**: `src/lib/db/schema/customers.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, DEFAULT random() | 顧客ID |
| phone_number | text | UNIQUE | 電話番号（重複チェック用） |
| email | text | | メールアドレス |
| name | text | | 名前 |
| product_id | uuid | FK -> products.id | 商材ID |
| organization_id | uuid | FK -> organizations.id | 組織ID |
| status | customer_status | DEFAULT 'lead' | ステータス |
| source | text | | 取得元（scraping/manual/import） |
| notes | text | | 備考 |
| tags | jsonb | | タグ（string[]） |
| is_active | boolean | DEFAULT true | 有効フラグ |
| created_at | timestamp | DEFAULT now() | 作成日時 |
| updated_at | timestamp | DEFAULT now() | 更新日時 |

### kpi_records

**ファイル**: `src/lib/db/schema/kpi.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, DEFAULT random() | 記録ID |
| organization_id | uuid | FK -> organizations.id | 組織ID |
| product_id | uuid | FK -> products.id | 商材ID |
| customer_id | uuid | FK -> customers.id | 顧客ID（個別記録の場合） |
| kpi_type | kpi_type | NOT NULL | KPI種別 |
| value | numeric(15, 4) | NOT NULL | 値（率は小数点4桁まで） |
| record_date | date | NOT NULL | 記録日 |
| period_type | text | NOT NULL | 期間タイプ（daily/weekly/monthly/yearly） |
| notes | text | | 備考 |
| created_at | timestamp | DEFAULT now() | 作成日時 |
| updated_at | timestamp | DEFAULT now() | 更新日時 |

### pl_records

**ファイル**: `src/lib/db/schema/pl.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, DEFAULT random() | 記録ID |
| organization_id | uuid | FK -> organizations.id | 組織ID |
| product_id | uuid | FK -> products.id | 商材ID |
| customer_id | uuid | FK -> customers.id | 顧客ID（個別取引の場合） |
| item_type | pl_item_type | NOT NULL | PL項目種別 |
| amount | numeric(15, 2) | NOT NULL | 金額（JPY） |
| record_date | date | NOT NULL | 記録日 |
| period_type | text | NOT NULL | 期間タイプ（daily/weekly/monthly/yearly） |
| is_actual | text | DEFAULT 'actual' | 予実区分（actual/forecast/simulation） |
| simulation_id | uuid | | シミュレーションID |
| description | text | | 説明 |
| created_at | timestamp | DEFAULT now() | 作成日時 |
| updated_at | timestamp | DEFAULT now() | 更新日時 |

### simulations

**ファイル**: `src/lib/db/schema/pl.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, DEFAULT random() | シミュレーションID |
| name | text | NOT NULL | シミュレーション名 |
| description | text | | 説明 |
| parameters | text | NOT NULL | シミュレーション条件（JSON） |
| projected_revenue | numeric(15, 2) | | 予測売上 |
| projected_gross_profit | numeric(15, 2) | | 予測粗利 |
| projected_operating_profit | numeric(15, 2) | | 予測営業利益 |
| created_by | uuid | | 作成者ID（将来実装） |
| created_at | timestamp | DEFAULT now() | 作成日時 |
| updated_at | timestamp | DEFAULT now() | 更新日時 |

### deals

**ファイル**: `src/lib/db/schema/deals.ts`

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | uuid | PK, DEFAULT random() | 商談ID |
| customer_id | uuid | FK -> customers.id, NOT NULL | 顧客ID |
| product_id | uuid | FK -> products.id | 商材ID |
| organization_id | uuid | FK -> organizations.id | 組織ID |
| name | text | NOT NULL | 商談名 |
| status | deal_status | DEFAULT 'prospecting' | ステータス |
| amount | numeric(15, 2) | | 金額 |
| expected_close_date | date | | 予定クローズ日 |
| actual_close_date | date | | 実際のクローズ日 |
| probability | numeric(5, 2) | | 確度（0-100%） |
| notes | text | | 備考 |
| created_at | timestamp | DEFAULT now() | 作成日時 |
| updated_at | timestamp | DEFAULT now() | 更新日時 |

---

## リレーション

### organizations

```typescript
{
  parent: one(organizations),           // 親組織
  children: many(organizations),       // 子組織
  ancestors: many(organizationClosure), // 祖先関係
  descendants: many(organizationClosure) // 子孫関係
}
```

### products

```typescript
{
  fieldDefinitions: many(productFieldDefinitions), // フィールド定義
  customers: many(customers)                        // 顧客
}
```

### product_field_definitions

```typescript
{
  product: one(products),        // 商材
  values: many(customerFieldValues) // フィールド値
}
```

### customer_field_values

```typescript
{
  customer: one(customers),              // 顧客
  fieldDefinition: one(productFieldDefinitions) // フィールド定義
}
```

### customers

```typescript
{
  product: one(products),           // 商材
  organization: one(organizations), // 組織
  fieldValues: many(customerFieldValues), // フィールド値
  kpiRecords: many(kpiRecords),     // KPI記録
  deals: many(deals)                // 商談
}
```

### kpi_records

```typescript
{
  organization: one(organizations), // 組織
  product: one(products),            // 商材
  customer: one(customers)          // 顧客
}
```

### pl_records

```typescript
{
  organization: one(organizations), // 組織
  product: one(products),            // 商材
  customer: one(customers)          // 顧客
}
```

### deals

```typescript
{
  customer: one(customers),         // 顧客
  product: one(products),            // 商材
  organization: one(organizations)  // 組織
}
```

---

## インデックス

### organizations

- `idx_organizations_parent` (parent_id)
- `idx_organizations_type` (type)
- `idx_organizations_path` (path)

### organization_closure

- `pk_organization_closure` (ancestor_id, descendant_id) - 複合主キー
- `idx_closure_ancestor` (ancestor_id)
- `idx_closure_descendant` (descendant_id)
- `idx_closure_depth` (depth)

### customer_field_values

- `idx_customer_field_values_lookup` (customer_id, field_definition_id)

### customers

- `idx_customers_phone` (phone_number) WHERE phone_number IS NOT NULL

### kpi_records

- `idx_kpi_records_org_date` (organization_id, record_date)
- `idx_kpi_records_product_date` (product_id, record_date)

### pl_records

- `idx_pl_records_org_date` (organization_id, record_date)
- `idx_pl_records_product_date` (product_id, record_date)

---

## 更新履歴

### 2024-12-19 - v0.1.0
- 初版作成
- 全テーブル定義を追加
- Enum型定義を追加
- リレーション定義を追加
- インデックス定義を追加

---

## 更新ガイドライン

このドキュメントは、スキーマに変更が入るたびに更新してください。

1. 新しいテーブル/Enum型の追加 → 該当セクションに追加
2. 既存テーブルのカラム変更 → 該当テーブルの定義を更新
3. 新しいリレーションの追加 → リレーションセクションに追加
4. インデックスの追加/変更 → インデックスセクションに更新
5. 更新履歴に日付と変更内容を追加


