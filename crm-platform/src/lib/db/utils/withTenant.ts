/**
 * テナントコンテキスト付きクエリヘルパー
 * 
 * Drizzle ORMのクエリに自動的にテナントフィルタを追加するヘルパー関数
 * RLSが有効な場合でも、アプリケーション層での二重チェックとして使用可能
 */

import { SQL, sql } from "drizzle-orm";
import { getCurrentTenant } from "../tenantContext";

/**
 * テナントIDでフィルタリングされたSQL条件を生成
 * 
 * RLSが有効な場合、この関数は冗長ですが、
 * アプリケーション層での明示的なフィルタリングとして使用できます。
 * 
 * @param tenantId テナントID（UUID文字列）
 * @param tableAlias テーブルエイリアス（例: "organizations"）
 * @returns SQL条件
 */
export function tenantFilter(tenantId: string, tableAlias: string = "tenant_id"): SQL {
  return sql`${sql.identifier(tableAlias)} = ${tenantId}::uuid`;
}

/**
 * 現在のテナントコンテキストでフィルタリングされたSQL条件を生成
 * 
 * @param tableAlias テーブルエイリアス（例: "organizations"）
 * @returns SQL条件、テナントコンテキストが設定されていない場合はnull
 */
export async function currentTenantFilter(tableAlias: string = "tenant_id"): Promise<SQL | null> {
  const tenantId = await getCurrentTenant();
  if (!tenantId) {
    return null;
  }
  return tenantFilter(tenantId, tableAlias);
}

/**
 * クエリにテナントフィルタを自動的に追加
 * 
 * 使用例:
 * ```typescript
 * const orgs = await db
 *   .select()
 *   .from(organizations)
 *   .where(
 *     and(
 *       await addTenantFilter(organizations.tenantId),
 *       eq(organizations.isActive, true)
 *     )
 *   );
 * ```
 */
export async function addTenantFilter(tenantIdColumn: any): Promise<SQL> {
  const tenantId = await getCurrentTenant();
  if (!tenantId) {
    throw new Error("Tenant context not set. Call setTenantContext() first.");
  }
  return sql`${tenantIdColumn} = ${tenantId}::uuid`;
}

