# Row Level Security (RLS) 実装ドキュメント

> **最終更新日**: 2024-12-19  
> **バージョン**: 0.3.0

このドキュメントは、PostgreSQLのRow Level Security (RLS) を使用したマルチテナント対応の実装詳細を記録します。

## 概要

データベース層での自動テナント分離を実現するため、PostgreSQLのRow Level Security (RLS) を実装しました。アプリケーション層からデータベース層へテナントIDを安全に渡す仕組み（Context Passing）を提供します。

## アーキテクチャ

### 1. セッション変数によるテナント識別

PostgreSQLのセッション変数 `app.current_tenant` を使用して、現在のセッションのテナントIDを管理します。

```
アプリケーション層
    ↓ setTenantContext(tenantId)
PostgreSQLセッション変数: app.current_tenant
    ↓ RLSポリシーが参照
データベースクエリ結果（自動的にテナントフィルタリング）
```

### 2. RLSポリシーの動作

すべてのテナント依存テーブルにRLSポリシーを適用:

```sql
CREATE POLICY "tenant_isolation_organizations" ON organizations
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  );
```

**動作**:
- `SELECT`: `USING` 句により、現在のテナントのデータのみが返される
- `INSERT/UPDATE/DELETE`: `WITH CHECK` 句により、現在のテナントのデータのみ操作可能

## 実装ファイル

### 1. データベース側

#### `src/lib/db/migrations/003_rls_policies.sql`

**内容**:
- RLSの有効化（すべてのテナント依存テーブル）
- セッション変数設定関数の作成
- RLSポリシーの定義
- 整合性チェック（関連テーブルのテナントID検証）

**主要な関数**:
- `set_current_tenant(UUID)`: セッション変数にテナントIDを設定
- `get_current_tenant()`: 現在のセッション変数を取得

### 2. アプリケーション側

#### `src/lib/db/tenantContext.ts`

**主要な関数**:
- `setTenantContext(tenantId: string)`: テナントコンテキストを設定
- `getCurrentTenant()`: 現在のテナントIDを取得
- `clearTenantContext()`: テナントコンテキストをクリア
- `withTenantContext<T>(tenantId, fn)`: テナントコンテキスト付きで関数を実行

#### `src/lib/db/tenantMiddleware.ts`

**Next.js用ミドルウェア**:
- `withTenant()`: API Route用ミドルウェア
- `getTenantIdFromRequest()`: リクエストからテナントIDを取得
- `setTenantContextForServerAction()`: Server Actions用

#### `src/lib/db/utils/withTenant.ts`

**クエリヘルパー**:
- `tenantFilter()`: テナントIDでフィルタリング
- `addTenantFilter()`: クエリにテナントフィルタを追加

## 使用方法

### 基本的な使用方法

```typescript
import { setTenantContext } from "@/lib/db/tenantContext";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

// テナントコンテキストを設定
await setTenantContext("123e4567-e89b-12d3-a456-426614174000");

// この時点で、すべてのクエリが自動的にこのテナントのデータのみにアクセス
const orgs = await db.select().from(organizations);
// RLSにより、tenant_id = "123e4567-..." のレコードのみが返される
```

### Next.js API Routeでの使用

```typescript
// app/api/organizations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db/tenantMiddleware";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export const GET = withTenant(async (req: NextRequest) => {
  // この時点で、テナントコンテキストが設定されている
  const orgs = await db.select().from(organizations);
  
  return NextResponse.json(orgs);
});
```

### Server Actionsでの使用

```typescript
// app/actions/organizations.ts
"use server";

import { setTenantContextForServerAction } from "@/lib/db/tenantMiddleware";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export async function getOrganizations() {
  // Server Actionsでは、headers() からテナントIDを取得
  await setTenantContextForServerAction();
  
  const orgs = await db.select().from(organizations);
  return orgs;
}
```

### withTenantContext を使用した実行

```typescript
import { withTenantContext } from "@/lib/db/tenantContext";

const result = await withTenantContext(tenantId, async () => {
  const orgs = await db.select().from(organizations);
  const customers = await db.select().from(customers);
  
  return { orgs, customers };
});
```

## テナントIDの取得方法

### 優先順位

1. **サブドメイン**（例: `company-abc.crm-platform.com`）
2. **ヘッダー**（`X-Tenant-ID`）
3. **クエリパラメータ**（`tenant_id`）

### 実装例

```typescript
// サブドメインから取得
const hostname = request.headers.get("host") || "";
const subdomain = hostname.split(".")[0];

// ヘッダーから取得
const tenantId = request.headers.get("X-Tenant-ID");

// クエリパラメータから取得
const { searchParams } = new URL(request.url);
const tenantId = searchParams.get("tenant_id");
```

## セキュリティ考慮事項

### 1. テナントIDの検証

`setTenantContext()` 関数内で、テナントの存在と有効性を検証:

```typescript
// テナントの存在確認
const tenant = await db
  .select()
  .from(tenants)
  .where(sql`${tenants.id} = ${tenantId}::uuid AND ${tenants.isActive} = true`)
  .limit(1);

if (tenant.length === 0) {
  throw new Error(`Invalid or inactive tenant: ${tenantId}`);
}
```

### 2. RLSポリシーの整合性チェック

RLSポリシー内で、関連テーブルのテナントIDを検証:

```sql
-- 例: customers テーブルのポリシー
CREATE POLICY "tenant_isolation_customers" ON customers
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
    AND (
      product_id IS NULL OR EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_id
          AND p.tenant_id = tenant_id
      )
    )
  );
```

### 3. クロステナントアクセスの防止

RLSにより、異なるテナントのデータにアクセスすることは不可能:

```typescript
// テナントAのコンテキストで設定
await setTenantContext("tenant-a-id");

// テナントBのデータを取得しようとしても、RLSにより空の結果が返される
const orgs = await db
  .select()
  .from(organizations)
  .where(eq(organizations.id, "tenant-b-org-id"));
// 結果: []（空配列）
```

## パフォーマンス考慮事項

### 1. セッション変数のオーバーヘッド

セッション変数の設定は軽量ですが、すべてのクエリで評価されます。インデックスを適切に設定することで、パフォーマンスへの影響を最小限に抑えます。

### 2. インデックスの最適化

`tenant_id` を最初のカラムに配置した複合インデックスを作成:

```sql
CREATE INDEX idx_organizations_tenant_parent ON organizations(tenant_id, parent_id);
CREATE INDEX idx_customers_tenant_status ON customers(tenant_id, status);
```

### 3. 接続プールの考慮

接続プールを使用する場合、セッション変数は接続ごとに設定される必要があります。各リクエストで `setTenantContext()` を呼び出すことで、この問題を解決します。

## トラブルシューティング

### 1. RLSポリシーが適用されない

**原因**: RLSが有効化されていない、またはポリシーが作成されていない

**解決策**:
```sql
-- RLSが有効か確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'organizations';

-- ポリシーが存在するか確認
SELECT * FROM pg_policies 
WHERE tablename = 'organizations';
```

### 2. セッション変数が設定されていない

**原因**: `setTenantContext()` が呼び出されていない

**解決策**:
```typescript
// 現在のテナントIDを確認
const tenantId = await getCurrentTenant();
console.log("Current tenant:", tenantId);
```

### 3. すべてのデータが返されない

**原因**: テナントコンテキストが設定されていない、または無効なテナントID

**解決策**:
```typescript
// テナントの存在確認
const tenant = await db
  .select()
  .from(tenants)
  .where(eq(tenants.id, tenantId))
  .limit(1);

if (tenant.length === 0) {
  throw new Error("Tenant not found");
}
```

## マイグレーション手順

### 1. RLSポリシーの適用

```bash
# マイグレーションファイルを実行
psql -U postgres -d crm_platform -f src/lib/db/migrations/003_rls_policies.sql
```

### 2. 動作確認

```sql
-- RLSが有効か確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

-- ポリシーが作成されているか確認
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 3. テスト

```typescript
// テストコード例
import { setTenantContext } from "@/lib/db/tenantContext";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

// テナントAのコンテキストで設定
await setTenantContext("tenant-a-id");
const orgsA = await db.select().from(organizations);
console.log("Tenant A organizations:", orgsA.length);

// テナントBのコンテキストで設定
await setTenantContext("tenant-b-id");
const orgsB = await db.select().from(organizations);
console.log("Tenant B organizations:", orgsB.length);

// orgsA と orgsB は異なるデータであることを確認
```

## 変更履歴

### 2024-12-19 - v0.3.0

**RLS実装完了**

#### 追加
- RLSポリシーのマイグレーションファイル（003_rls_policies.sql）
- テナントコンテキスト管理関数（tenantContext.ts）
- Next.js用ミドルウェア（tenantMiddleware.ts）
- クエリヘルパー関数（utils/withTenant.ts）
- 使用例（examples/tenantUsage.ts）

#### ファイル一覧
- `src/lib/db/migrations/003_rls_policies.sql` (新規)
- `src/lib/db/tenantContext.ts` (新規)
- `src/lib/db/tenantMiddleware.ts` (新規)
- `src/lib/db/utils/withTenant.ts` (新規)
- `src/lib/db/examples/tenantUsage.ts` (新規)
- `docs/RLS_IMPLEMENTATION.md` (本ファイル)

---

## 参考資料

- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL Session Variables](https://www.postgresql.org/docs/current/sql-set.html)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

