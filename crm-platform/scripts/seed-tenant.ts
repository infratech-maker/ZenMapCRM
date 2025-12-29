/**
 * テスト用テナントのシードスクリプト
 * 
 * ローカル開発環境でテスト用テナントを作成します。
 * RLSをバイパスして直接テーブルに挿入するため、このスクリプトを実行してください。
 * 
 * 実行方法:
 * ```bash
 * npx tsx scripts/seed-tenant.ts
 * ```
 */

import { db } from "../src/lib/db/index";
import { tenants } from "../src/lib/db/schema";
import { sql } from "drizzle-orm";

const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000000";
const TEST_TENANT_NAME = "Test Company";
const TEST_TENANT_SLUG = "test-co";

async function seedTenant() {
  try {
    console.log("Creating test tenant...");

    // RLSをバイパスして直接挿入（ON CONFLICT DO NOTHING）
    await db.execute(
      sql`
        INSERT INTO tenants (id, name, slug, is_active, created_at, updated_at)
        VALUES (
          ${TEST_TENANT_ID}::uuid,
          ${TEST_TENANT_NAME},
          ${TEST_TENANT_SLUG},
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `
    );

    // 確認
    const tenant = await db
      .select()
      .from(tenants)
      .where(sql`${tenants.id} = ${TEST_TENANT_ID}::uuid`)
      .limit(1);

    if (tenant.length > 0) {
      console.log("✅ Test tenant created successfully!");
      console.log(`   ID: ${tenant[0].id}`);
      console.log(`   Name: ${tenant[0].name}`);
      console.log(`   Slug: ${tenant[0].slug}`);
      console.log(`\n   Add this to your .env.local:`);
      console.log(`   TEST_TENANT_ID=${TEST_TENANT_ID}`);
    } else {
      console.log("⚠️  Tenant already exists or creation failed.");
    }
  } catch (error) {
    console.error("❌ Error creating test tenant:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedTenant();

