# テナントセットアップガイド

> **最終更新日**: 2024-12-19

ローカル開発環境でテナントコンテキストを使用するためのセットアップ手順です。

## 前提条件

- PostgreSQLが起動していること
- データベースマイグレーションが実行済みであること

## セットアップ手順

### 1. テスト用テナントの作成

テスト用テナントを作成する方法は2つあります：

#### 方法A: TypeScriptスクリプトを使用（推奨）

```bash
npm run db:seed:tenant
```

このコマンドは `scripts/seed-tenant.ts` を実行し、以下のテスト用テナントを作成します：
- **ID**: `00000000-0000-0000-0000-000000000000`
- **Name**: `Test Company`
- **Slug**: `test-co`

#### 方法B: SQLファイルを直接実行

```bash
psql -U postgres -d crm_platform -f src/lib/db/migrations/004_seed_test_tenant.sql
```

### 2. 環境変数の設定

`.env.local` ファイルを作成（または既存のファイルを編集）し、以下の環境変数を設定します：

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_platform

# Tenant Context (for local development)
TEST_TENANT_ID=00000000-0000-0000-0000-000000000000
```

`.env.local.example` をコピーして使用することもできます：

```bash
cp .env.local.example .env.local
```

### 3. 動作確認

テナントが正しく作成されたか確認します：

```bash
psql -U postgres -d crm_platform -c "SELECT id, name, slug FROM tenants WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;"
```

期待される出力：
```
                  id                  |     name      |  slug
--------------------------------------+---------------+---------
 00000000-0000-0000-0000-000000000000 | Test Company  | test-co
```

## 使用方法

### 基本的な使用

`withTenant` 関数を使用して、テナントコンテキストを設定した状態でクエリを実行します：

```typescript
import { withTenant } from "@/lib/db/tenant-helper";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

// テナントIDを自動取得（環境変数 TEST_TENANT_ID から）
const orgs = await withTenant(async () => {
  // この時点で、テナントコンテキストが設定されている
  // RLSにより、自動的に現在のテナントのデータのみが返される
  return await db.select().from(organizations);
});
```

### テナントIDを明示的に指定

```typescript
const orgs = await withTenant(
  async () => {
    return await db.select().from(organizations);
  },
  "00000000-0000-0000-0000-000000000000" // テナントIDを明示的に指定
);
```

### Server Actionsでの使用

```typescript
// app/actions/organizations.ts
"use server";

import { withTenant } from "@/lib/db/tenant-helper";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export async function getOrganizations() {
  // ヘッダーの x-tenant-id または環境変数の TEST_TENANT_ID が自動的に使用される
  return await withTenant(async () => {
    return await db.select().from(organizations);
  });
}
```

### API Routeでの使用

```typescript
// app/api/organizations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db/tenant-helper";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  // ヘッダーの x-tenant-id または環境変数の TEST_TENANT_ID が自動的に使用される
  const orgs = await withTenant(async () => {
    return await db.select().from(organizations);
  });
  
  return NextResponse.json(orgs);
}
```

## テナントIDの取得優先順位

`withTenant` 関数は、以下の優先順位でテナントIDを取得します：

1. **引数で指定された tenantId**（明示的に指定した場合）
2. **ヘッダーの `x-tenant-id`**（Next.js Server Components / Server Actions）
3. **環境変数の `TEST_TENANT_ID`**（ローカル開発用）

## トラブルシューティング

### エラー: "Tenant ID not found"

**原因**: テナントIDが取得できていない

**解決策**:
1. `.env.local` に `TEST_TENANT_ID` が設定されているか確認
2. ヘッダーに `x-tenant-id` が設定されているか確認
3. テナントが正しく作成されているか確認

### エラー: "Invalid or inactive tenant"

**原因**: 指定されたテナントIDが存在しない、または無効

**解決策**:
1. テナントが正しく作成されているか確認
2. テナントの `is_active` が `true` であることを確認

### クエリ結果が空

**原因**: RLSが有効化されていない、またはテナントコンテキストが設定されていない

**解決策**:
1. RLSポリシーが適用されているか確認：
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
     AND tablename = 'organizations';
   ```

2. セッション変数が設定されているか確認：
   ```typescript
   import { getCurrentTenant } from "@/lib/db/tenant-helper";
   const tenantId = await getCurrentTenant();
   console.log("Current tenant:", tenantId);
   ```

## 追加のテナント作成

テスト用テナント以外のテナントを作成する場合：

```sql
INSERT INTO tenants (id, name, slug, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Your Company Name',
  'your-company-slug',
  true,
  NOW(),
  NOW()
);
```

作成後、`.env.local` の `TEST_TENANT_ID` を更新するか、APIリクエストのヘッダーに `x-tenant-id` を設定してください。

## 参考資料

- [RLS実装ドキュメント](./RLS_IMPLEMENTATION.md)
- [マルチテナント対応ドキュメント](./MULTITENANT.md)

