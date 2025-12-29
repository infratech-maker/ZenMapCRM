# マルチテナント対応ドキュメント

> **最終更新日**: 2024-12-19  
> **バージョン**: 0.2.0

このドキュメントは、統合CRMプラットフォームのマルチテナント対応（SaaS化）の実装詳細を記録します。

## 概要

システムをSaaSとして複数のクライアント企業に提供するため、データベース設計をマルチテナント・アーキテクチャに変更しました。

## 設計方針

### 1. テナント分離戦略

**採用方式**: **Row Level Security (RLS) + tenant_id カラム**

- すべてのテーブルに `tenant_id` カラムを追加
- PostgreSQLのRow Level Security (RLS) を将来的に有効化
- アプリケーション層でも `tenant_id` によるフィルタリングを必須とする

**メリット**:
- 単一データベースで複数テナントを管理（運用コスト削減）
- RLSにより、データベース層での自動フィルタリングが可能
- スキーマ変更が不要（既存テーブルにカラム追加のみ）

### 2. テナントテーブル

**ファイル**: `src/lib/db/schema/tenants.ts`

```typescript
{
  id: uuid (PK),
  name: text (NOT NULL),
  slug: text (UNIQUE, NOT NULL), // URL用スラッグ（例: "company-abc"）
  is_active: boolean (DEFAULT true),
  created_at: timestamp,
  updated_at: timestamp
}
```

**特徴**:
- `slug`: URLやサブドメインでの識別に使用（例: `company-abc.crm-platform.com`）
- テナントの有効/無効を管理

## スキーマ変更

### 変更されたテーブル一覧

すべての既存テーブルに `tenant_id` カラムを追加しました:

| テーブル名 | tenant_id の位置 | 備考 |
|-----------|----------------|------|
| `tenants` | - | テナントマスタ（tenant_id不要） |
| `organizations` | 先頭 | FK -> tenants.id |
| `organization_closure` | 先頭 | ancestor_id と descendant_id は同じ tenant_id に属する必要がある |
| `products` | 先頭 | code は tenant_id と組み合わせてUNIQUE |
| `product_field_definitions` | productId の前 | パフォーマンス向上のため直接保持 |
| `customer_field_values` | 先頭 | パフォーマンス向上のため直接保持 |
| `customers` | 先頭 | phone_number は tenant_id と組み合わせてUNIQUE |
| `kpi_records` | 先頭 | FK -> tenants.id |
| `pl_records` | 先頭 | FK -> tenants.id |
| `simulations` | 先頭 | FK -> tenants.id |
| `deals` | 先頭 | FK -> tenants.id |

### UNIQUE制約の変更

以下のテーブルで、既存のUNIQUE制約を複合UNIQUE制約に変更:

1. **organizations**: `code` → `(tenant_id, code)`
2. **products**: `code` → `(tenant_id, code)`
3. **customers**: `phone_number` → `(tenant_id, phone_number)`

**理由**: 異なるテナント間で同じコードや電話番号を使用できるようにするため

## インデックス戦略

### 1. tenant_id 単独インデックス

すべてのテーブルに `tenant_id` のインデックスを追加:

```sql
CREATE INDEX idx_<table_name>_tenant ON <table_name>(tenant_id);
```

**目的**: RLSとクエリパフォーマンスの向上

### 2. 複合インデックス

よく使われるクエリパターンに対応:

```sql
-- 組織階層
CREATE INDEX idx_organizations_tenant_parent ON organizations(tenant_id, parent_id);
CREATE INDEX idx_organization_closure_tenant_ancestor ON organization_closure(tenant_id, ancestor_id);

-- 顧客検索
CREATE INDEX idx_customers_tenant_status ON customers(tenant_id, status);
CREATE INDEX idx_customers_tenant_product ON customers(tenant_id, product_id);

-- KPI/PL集計
CREATE INDEX idx_kpi_records_tenant_org_date ON kpi_records(tenant_id, organization_id, record_date);
CREATE INDEX idx_pl_records_tenant_org_date ON pl_records(tenant_id, organization_id, record_date);
```

## Row Level Security (RLS) 準備

### 将来の実装方針

PostgreSQLのRow Level Securityを有効化し、データベース層で自動的にテナント分離を実現します。

### RLSポリシーの例

```sql
-- RLSを有効化
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY tenant_isolation_policy ON organizations
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### アプリケーション層での実装

RLS有効化前は、アプリケーション層で `tenant_id` によるフィルタリングを必須とします:

```typescript
// 例: 組織一覧取得
const orgs = await db
  .select()
  .from(organizations)
  .where(
    and(
      eq(organizations.tenantId, currentTenantId),
      eq(organizations.isActive, true)
    )
  );
```

## BullMQ ジョブペイロード

### tenantId の必須化

すべてのジョブペイロードに `tenantId` を含める必要があります:

```typescript
// 例: スクレイピングジョブ
interface ScrapingJobPayload {
  tenantId: string; // 必須
  url: string;
  // ... その他のパラメータ
}

// ジョブ追加時
await queue.add('scraping', {
  tenantId: currentTenantId,
  url: 'https://example.com',
  // ...
});
```

### ジョブ処理時の検証

ジョブ処理時に `tenantId` を検証し、適切なテナントのデータのみを操作します:

```typescript
// 例: ジョブハンドラー
async function handleScrapingJob(job: Job<ScrapingJobPayload>) {
  const { tenantId, url } = job.data;
  
  // tenantId を検証
  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (tenant.length === 0) {
    throw new Error(`Invalid tenantId: ${tenantId}`);
  }
  
  // テナント固有のデータを操作
  // ...
}
```

## マイグレーション手順

### 1. テナントテーブルの作成

```bash
npm run db:generate
npm run db:push
```

### 2. 既存データの移行

既存データがある場合、デフォルトテナントを作成し、すべてのレコードに `tenant_id` を設定:

```sql
-- デフォルトテナントを作成
INSERT INTO tenants (id, name, slug, is_active) 
VALUES (gen_random_uuid(), 'Default Tenant', 'default', true);

-- 既存データに tenant_id を設定（例: organizations）
UPDATE organizations 
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'default')
WHERE tenant_id IS NULL;
```

### 3. NOT NULL制約の追加

すべてのレコードに `tenant_id` が設定された後、NOT NULL制約を追加:

```sql
ALTER TABLE organizations ALTER COLUMN tenant_id SET NOT NULL;
-- 他のテーブルも同様に実行
```

### 4. インデックスの追加

```bash
psql -U postgres -d crm_platform -f src/lib/db/migrations/002_multitenant_indexes.sql
```

## アプリケーション層での実装

### 1. テナントコンテキストの管理

リクエストごとに現在のテナントIDを取得・設定:

```typescript
// ミドルウェア例（Next.js）
export function withTenant(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // サブドメインやヘッダーからテナントIDを取得
    const tenantId = getTenantIdFromRequest(req);
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant not found' });
    }
    
    // リクエストコンテキストに設定
    req.tenantId = tenantId;
    
    return handler(req, res);
  };
}
```

### 2. クエリヘルパーの作成

すべてのクエリに `tenant_id` フィルタを自動的に追加:

```typescript
// 例: クエリヘルパー
export function withTenantFilter<T>(
  query: SQL,
  tenantId: string
): SQL {
  return sql`${query} AND tenant_id = ${tenantId}`;
}
```

### 3. Drizzle ORMでの使用

```typescript
// 例: 組織一覧取得
const orgs = await db
  .select()
  .from(organizations)
  .where(
    and(
      eq(organizations.tenantId, currentTenantId),
      // その他の条件
    )
  );
```

## セキュリティ考慮事項

### 1. テナントIDの検証

すべてのリクエストでテナントIDを検証し、存在しないテナントへのアクセスを拒否:

```typescript
async function validateTenant(tenantId: string): Promise<boolean> {
  const tenant = await db
    .select()
    .from(tenants)
    .where(
      and(
        eq(tenants.id, tenantId),
        eq(tenants.isActive, true)
      )
    )
    .limit(1);
  
  return tenant.length > 0;
}
```

### 2. クロステナントアクセスの防止

アプリケーション層で、異なるテナントのデータにアクセスできないようにする:

```typescript
// 悪い例（テナントIDを検証しない）
const org = await db
  .select()
  .from(organizations)
  .where(eq(organizations.id, orgId))
  .limit(1);

// 良い例（テナントIDを検証する）
const org = await db
  .select()
  .from(organizations)
  .where(
    and(
      eq(organizations.id, orgId),
      eq(organizations.tenantId, currentTenantId) // 必須
    )
  )
  .limit(1);
```

## パフォーマンス考慮事項

### 1. インデックスの最適化

`tenant_id` を最初のカラムに配置した複合インデックスを作成:

```sql
-- 良い例: tenant_id が最初
CREATE INDEX idx_customers_tenant_status ON customers(tenant_id, status);

-- 悪い例: tenant_id が最後
CREATE INDEX idx_customers_status_tenant ON customers(status, tenant_id);
```

### 2. クエリパターンの最適化

すべてのクエリで `tenant_id` を最初の条件として使用:

```typescript
// 良い例: tenant_id を最初にフィルタ
.where(
  and(
    eq(organizations.tenantId, currentTenantId), // 最初
    eq(organizations.isActive, true),
    // その他の条件
  )
)

// 悪い例: tenant_id が後ろ
.where(
  and(
    eq(organizations.isActive, true),
    eq(organizations.tenantId, currentTenantId), // 後ろ
  )
)
```

## 変更履歴

### 2024-12-19 - v0.2.0

**マルチテナント対応実装**

#### 追加
- `tenants` テーブルの作成
- すべての既存テーブルに `tenant_id` カラムを追加
- 複合UNIQUE制約の追加（tenant_id + code/phone_number）
- マルチテナント対応用インデックスの追加
- RLS準備のコメント追加

#### 変更
- `organizations.code`: UNIQUE → (tenant_id, code) UNIQUE
- `products.code`: UNIQUE → (tenant_id, code) UNIQUE
- `customers.phone_number`: UNIQUE → (tenant_id, phone_number) UNIQUE

#### ファイル一覧
- `src/lib/db/schema/tenants.ts` (新規)
- `src/lib/db/schema/organizations.ts` (更新)
- `src/lib/db/schema/products.ts` (更新)
- `src/lib/db/schema/dynamicFields.ts` (更新)
- `src/lib/db/schema/customers.ts` (更新)
- `src/lib/db/schema/kpi.ts` (更新)
- `src/lib/db/schema/pl.ts` (更新)
- `src/lib/db/schema/deals.ts` (更新)
- `src/lib/db/migrations/002_multitenant_indexes.sql` (新規)
- `docs/MULTITENANT.md` (本ファイル)

---

## 参考資料

- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Multi-Tenant Data Architecture](https://docs.microsoft.com/en-us/azure/sql-database/saas-tenancy-app-design-patterns)
- [Drizzle ORM Multi-Tenant Guide](https://orm.drizzle.team/docs/overview)

