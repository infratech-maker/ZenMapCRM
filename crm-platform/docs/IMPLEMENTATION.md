# 実装ドキュメント

> **最終更新日**: 2024-12-19  
> **バージョン**: 0.1.0

このドキュメントは、統合CRMプラットフォームの実装詳細を記録します。実装に変更が入るたびに更新されます。

## 目次

1. [プロジェクト構造](#プロジェクト構造)
2. [データベーススキーマ](#データベーススキーマ)
3. [主要機能の実装](#主要機能の実装)
4. [ユーティリティ関数](#ユーティリティ関数)
5. [設定ファイル](#設定ファイル)
6. [変更履歴](#変更履歴)

---

## プロジェクト構造

```
crm-platform/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # ルートレイアウト
│   │   └── page.tsx                  # ホームページ
│   ├── features/                     # 機能別モジュール
│   │   ├── analytics/               # ダッシュボード、グラフ、集計ロジック
│   │   ├── simulation/              # 将来予測、計算シミュレーター
│   │   ├── crm/                     # 顧客リスト、マスタ管理
│   │   ├── scraper/                 # スクレイピング機能
│   │   └── cti/                     # CTI統合
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema/              # Drizzle ORMスキーマ
│   │   │   │   ├── index.ts         # スキーマエクスポート
│   │   │   │   ├── organizations.ts # 組織階層（Closure Table）
│   │   │   │   ├── products.ts      # 商材マスタ
│   │   │   │   ├── dynamicFields.ts # 動的カラム（メタデータ）
│   │   │   │   ├── customers.ts     # 顧客マスタ
│   │   │   │   ├── kpi.ts           # KPI記録
│   │   │   │   ├── pl.ts            # PL記録（損益計算書）
│   │   │   │   └── deals.ts         # 商談管理
│   │   │   ├── utils/
│   │   │   │   └── closureTable.ts # Closure Tableヘルパー
│   │   │   ├── migrations/
│   │   │   │   └── 001_closure_table_indexes.sql
│   │   │   └── index.ts             # DB接続設定
│   │   └── utils/                   # 汎用ユーティリティ
│   └── components/ui/               # Shadcn/UIコンポーネント
├── drizzle/                         # マイグレーションファイル（生成）
├── docker-compose.yml               # Docker環境設定
├── drizzle.config.ts                # Drizzle設定
├── package.json                     # 依存関係
├── tsconfig.json                    # TypeScript設定
├── tailwind.config.ts              # Tailwind CSS設定
├── next.config.js                  # Next.js設定
├── README.md                        # プロジェクト概要
└── DESIGN.md                       # 設計ドキュメント
```

---

## データベーススキーマ

### テーブル一覧

| テーブル名 | 説明 | 主要カラム |
|-----------|------|-----------|
| `organizations` | 組織マスタ | id, name, code, type, parent_id, path, level |
| `organization_closure` | 組織階層（Closure Table） | ancestor_id, descendant_id, depth |
| `products` | 商材マスタ | id, name, code, category, base_price |
| `product_field_definitions` | 動的フィールド定義 | id, product_id, field_key, field_label, field_type |
| `customer_field_values` | 動的フィールド値 | id, customer_id, field_definition_id, value (JSONB) |
| `customers` | 顧客マスタ | id, phone_number, email, name, product_id, organization_id, status |
| `kpi_records` | KPI記録 | id, organization_id, product_id, kpi_type, value, record_date |
| `pl_records` | PL記録（損益計算書） | id, organization_id, product_id, item_type, amount, record_date |
| `simulations` | シミュレーション履歴 | id, name, parameters, projected_revenue, projected_gross_profit |
| `deals` | 商談管理 | id, customer_id, product_id, name, status, amount |

### 詳細スキーマ定義

#### 1. organizations テーブル

**ファイル**: `src/lib/db/schema/organizations.ts`

```typescript
{
  id: uuid (PK),
  name: text (NOT NULL),
  code: text (UNIQUE),
  type: organization_type (NOT NULL), // direct | partner_1st | partner_2nd | unit | individual
  parent_id: uuid (FK -> organizations.id),
  is_active: boolean (DEFAULT true),
  path: text, // Materialized Path (例: "/root/direct/partner-001")
  level: integer (DEFAULT 0), // 階層レベル
  created_at: timestamp,
  updated_at: timestamp
}
```

**インデックス**:
- `idx_organizations_parent` (parent_id)
- `idx_organizations_type` (type)
- `idx_organizations_path` (path)

#### 2. organization_closure テーブル

**ファイル**: `src/lib/db/schema/organizations.ts`

```typescript
{
  ancestor_id: uuid (FK -> organizations.id),
  descendant_id: uuid (FK -> organizations.id),
  depth: integer (NOT NULL) // 0 = 自己参照, 1 = 直接の親子, 2+ = 間接的
}
```

**主キー**: `(ancestor_id, descendant_id)`

**インデックス**:
- `idx_closure_ancestor` (ancestor_id)
- `idx_closure_descendant` (descendant_id)
- `idx_closure_depth` (depth)

#### 3. product_field_definitions テーブル

**ファイル**: `src/lib/db/schema/dynamicFields.ts`

```typescript
{
  id: uuid (PK),
  product_id: uuid (FK -> products.id),
  field_key: text (NOT NULL), // 内部キー（例: "phone_number"）
  field_label: text (NOT NULL), // 表示ラベル（例: "電話番号"）
  field_type: field_type (NOT NULL), // text | number | date | select | multiselect | textarea | boolean | currency
  is_required: boolean (DEFAULT false),
  is_unique: boolean (DEFAULT false), // 重複チェック用
  default_value: text,
  options: jsonb, // 選択肢（select/multiselect用）
  display_order: integer (DEFAULT 0),
  is_active: boolean (DEFAULT true),
  created_at: timestamp,
  updated_at: timestamp
}
```

#### 4. customer_field_values テーブル

**ファイル**: `src/lib/db/schema/dynamicFields.ts`

```typescript
{
  id: uuid (PK),
  customer_id: uuid (FK -> customers.id),
  field_definition_id: uuid (FK -> product_field_definitions.id),
  value: jsonb (NOT NULL), // 型に応じた値を格納
  created_at: timestamp,
  updated_at: timestamp
}
```

**インデックス**:
- `idx_customer_field_values_lookup` (customer_id, field_definition_id)

**値の形式例**:
- text: `"090-1234-5678"`
- number: `123.45`
- date: `"2024-01-01"`
- select: `"option1"`
- multiselect: `["option1", "option2"]`
- boolean: `true`
- currency: `{ "amount": 10000, "currency": "JPY" }`

#### 5. customers テーブル

**ファイル**: `src/lib/db/schema/customers.ts`

```typescript
{
  id: uuid (PK),
  phone_number: text (UNIQUE), // 重複チェック用キー
  email: text,
  name: text,
  product_id: uuid (FK -> products.id),
  organization_id: uuid (FK -> organizations.id),
  status: customer_status (DEFAULT 'lead'), // lead | contacted | qualified | proposal | negotiation | won | lost | closed
  source: text, // "scraping" | "manual" | "import"
  notes: text,
  tags: jsonb, // string[]
  is_active: boolean (DEFAULT true),
  created_at: timestamp,
  updated_at: timestamp
}
```

**インデックス**:
- `idx_customers_phone` (phone_number) WHERE phone_number IS NOT NULL

#### 6. kpi_records テーブル

**ファイル**: `src/lib/db/schema/kpi.ts`

```typescript
{
  id: uuid (PK),
  organization_id: uuid (FK -> organizations.id),
  product_id: uuid (FK -> products.id),
  customer_id: uuid (FK -> customers.id), // 個別記録の場合
  kpi_type: kpi_type (NOT NULL), // toss_count | toss_rate | pre_confirmed | post_confirmed | et_count | activation_same_day | activation_next_day | conversion_rate
  value: numeric(15, 4) (NOT NULL), // 率は小数点4桁まで
  record_date: date (NOT NULL),
  period_type: text (NOT NULL), // "daily" | "weekly" | "monthly" | "yearly"
  notes: text,
  created_at: timestamp,
  updated_at: timestamp
}
```

**インデックス**:
- `idx_kpi_records_org_date` (organization_id, record_date)
- `idx_kpi_records_product_date` (product_id, record_date)

#### 7. pl_records テーブル

**ファイル**: `src/lib/db/schema/pl.ts`

```typescript
{
  id: uuid (PK),
  organization_id: uuid (FK -> organizations.id),
  product_id: uuid (FK -> products.id),
  customer_id: uuid (FK -> customers.id), // 個別取引の場合
  item_type: pl_item_type (NOT NULL), // revenue | gross_profit | operating_profit | cost_of_sales | sga | agency_payment | other_income | other_expense
  amount: numeric(15, 2) (NOT NULL), // 金額（JPY）
  record_date: date (NOT NULL),
  period_type: text (NOT NULL), // "daily" | "weekly" | "monthly" | "yearly"
  is_actual: text (NOT NULL, DEFAULT 'actual'), // "actual" | "forecast" | "simulation"
  simulation_id: uuid,
  description: text,
  created_at: timestamp,
  updated_at: timestamp
}
```

**インデックス**:
- `idx_pl_records_org_date` (organization_id, record_date)
- `idx_pl_records_product_date` (product_id, record_date)

#### 8. simulations テーブル

**ファイル**: `src/lib/db/schema/pl.ts`

```typescript
{
  id: uuid (PK),
  name: text (NOT NULL),
  description: text,
  parameters: text (NOT NULL), // JSON文字列
  projected_revenue: numeric(15, 2),
  projected_gross_profit: numeric(15, 2),
  projected_operating_profit: numeric(15, 2),
  created_by: uuid, // users テーブル参照（将来実装）
  created_at: timestamp,
  updated_at: timestamp
}
```

#### 9. deals テーブル

**ファイル**: `src/lib/db/schema/deals.ts`

```typescript
{
  id: uuid (PK),
  customer_id: uuid (FK -> customers.id, NOT NULL),
  product_id: uuid (FK -> products.id),
  organization_id: uuid (FK -> organizations.id),
  name: text (NOT NULL),
  status: deal_status (DEFAULT 'prospecting'), // prospecting | qualification | proposal | negotiation | closed_won | closed_lost
  amount: numeric(15, 2),
  expected_close_date: date,
  actual_close_date: date,
  probability: numeric(5, 2), // 0-100 (%)
  notes: text,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 主要機能の実装

### 1. Closure Table ヘルパー関数

**ファイル**: `src/lib/db/utils/closureTable.ts`

#### `addOrganization(orgData)`

組織を追加し、Closure Tableを自動更新します。

**パラメータ**:
```typescript
{
  name: string;
  code?: string;
  type: "direct" | "partner_1st" | "partner_2nd" | "unit" | "individual";
  parentId?: string | null;
}
```

**処理内容**:
1. 親組織の情報を取得（level, path計算用）
2. 組織を追加（level = parentLevel + 1, path = `${parentPath}/${code}`）
3. Closure Tableを更新:
   - 自己参照 (depth=0) を追加
   - 親組織の全祖先との関係を追加（depth = 親のdepth + 1）

**使用例**:
```typescript
import { addOrganization } from "@/lib/db/utils/closureTable";

const org = await addOrganization({
  name: "1次代理店A",
  code: "PARTNER-001",
  type: "partner_1st",
  parentId: "直営組織ID",
});
```

#### `getDescendants(organizationId, includeSelf?)`

組織の全子孫を取得します（Closure Tableを使用）。

**パラメータ**:
- `organizationId`: string
- `includeSelf`: boolean (デフォルト: false)

**戻り値**:
```typescript
Array<{
  organization: Organization;
  depth: number;
}>
```

**使用例**:
```typescript
import { getDescendants } from "@/lib/db/utils/closureTable";

// 直営配下の全組織を取得（自分自身を除く）
const descendants = await getDescendants("直営組織ID", false);
```

#### `getAncestors(organizationId, includeSelf?)`

組織の全祖先を取得します。

**パラメータ**:
- `organizationId`: string
- `includeSelf`: boolean (デフォルト: false)

**使用例**:
```typescript
import { getAncestors } from "@/lib/db/utils/closureTable";

// 組織の全祖先を取得
const ancestors = await getAncestors("組織ID", true);
```

#### `deleteOrganization(organizationId)`

組織を削除します（子組織がある場合はエラー）。

**処理内容**:
1. 子組織の存在チェック
2. 組織を削除（CASCADE DELETEにより、Closure Tableの関連レコードも自動削除）

---

## ユーティリティ関数

### DB接続

**ファイル**: `src/lib/db/index.ts`

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/crm_platform";
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

**使用方法**:
```typescript
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

const orgs = await db.select().from(organizations);
```

---

## 設定ファイル

### 1. Drizzle設定

**ファイル**: `drizzle.config.ts`

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/crm_platform",
  },
  verbose: true,
  strict: true,
});
```

**コマンド**:
- `npm run db:generate` - マイグレーションファイルを生成
- `npm run db:push` - スキーマをDBにプッシュ
- `npm run db:studio` - Drizzle Studioを起動

### 2. Docker Compose

**ファイル**: `docker-compose.yml`

**サービス**:
- `postgres`: PostgreSQL 16 (ポート: 5432)
- `redis`: Redis 7 (ポート: 6379)
- `redis-commander`: Redis Commander (ポート: 8081)

**起動コマンド**:
```bash
docker-compose up -d
```

### 3. 環境変数

**ファイル**: `.env.local.example`

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_platform

# Supabase (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Twilio (CTI)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## 変更履歴

### 2024-12-19 - v0.1.0

**Phase 0 & Phase 1 実装完了**

#### 追加
- Docker Compose環境（PostgreSQL, Redis）
- Next.js 15プロジェクト構造
- Drizzle ORMスキーマ設計:
  - 組織階層（Closure Table実装）
  - 動的カラム（メタデータ駆動設計）
  - KPI/PL管理テーブル
  - 顧客・商材・商談管理テーブル
- Closure Tableヘルパー関数
- マイグレーション用SQL（インデックス定義）
- 設計ドキュメント（DESIGN.md）
- 実装ドキュメント（本ファイル）

#### ファイル一覧
- `docker-compose.yml`
- `crm-platform/package.json`
- `crm-platform/drizzle.config.ts`
- `crm-platform/src/lib/db/index.ts`
- `crm-platform/src/lib/db/schema/index.ts`
- `crm-platform/src/lib/db/schema/organizations.ts`
- `crm-platform/src/lib/db/schema/products.ts`
- `crm-platform/src/lib/db/schema/dynamicFields.ts`
- `crm-platform/src/lib/db/schema/customers.ts`
- `crm-platform/src/lib/db/schema/kpi.ts`
- `crm-platform/src/lib/db/schema/pl.ts`
- `crm-platform/src/lib/db/schema/deals.ts`
- `crm-platform/src/lib/db/utils/closureTable.ts`
- `crm-platform/src/lib/db/migrations/001_closure_table_indexes.sql`
- `crm-platform/README.md`
- `crm-platform/DESIGN.md`
- `crm-platform/docs/IMPLEMENTATION.md` (本ファイル)

---

## 更新ガイドライン

このドキュメントは、実装に変更が入るたびに更新してください。

### 更新が必要なケース

1. **新しいテーブルの追加**
   - テーブル一覧に追加
   - 詳細スキーマ定義セクションに追加

2. **既存テーブルの変更**
   - カラムの追加・削除・変更を反映
   - インデックスの追加・変更を反映

3. **新しい関数の追加**
   - 主要機能の実装セクションに追加
   - 使用例を含める

4. **設定ファイルの変更**
   - 設定ファイルセクションを更新

5. **プロジェクト構造の変更**
   - プロジェクト構造セクションを更新

### 更新手順

1. 実装を変更
2. このドキュメントの該当セクションを更新
3. 変更履歴に日付と変更内容を追加
4. 最終更新日を更新

---

## 参考資料

- [README.md](../README.md) - プロジェクト概要とセットアップ手順
- [DESIGN.md](../DESIGN.md) - 設計思想とアーキテクチャ
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Closure Table Pattern](https://www.slideshare.net/billkarwin/models-for-hierarchical-data)

