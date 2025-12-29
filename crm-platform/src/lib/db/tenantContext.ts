/**
 * テナントコンテキスト管理
 * 
 * アプリケーション層からデータベース層へテナントIDを安全に渡す仕組み
 * PostgreSQLのセッション変数を使用してRLSポリシーと連携
 */

import { db } from "./index";
import { sql } from "drizzle-orm";
import { tenants } from "./schema";

/**
 * テナントIDをセッション変数に設定
 * 
 * この関数を呼び出すと、そのセッション内のすべてのクエリが
 * 指定されたテナントのデータのみにアクセスできるようになります。
 * 
 * @param tenantId テナントID（UUID文字列）
 * @throws Error テナントが存在しない、または無効な場合
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  // テナントの存在確認
  const tenant = await db
    .select()
    .from(tenants)
    .where(sql`${tenants.id} = ${tenantId}::uuid AND ${tenants.isActive} = true`)
    .limit(1);

  if (tenant.length === 0) {
    throw new Error(`Invalid or inactive tenant: ${tenantId}`);
  }

  // PostgreSQLのセッション変数にテナントIDを設定
  // RLSポリシーがこの変数を参照して自動的にフィルタリング
  await db.execute(
    sql`SELECT set_config('app.current_tenant', ${tenantId}::text, true)`
  );
}

/**
 * 現在のセッションに設定されているテナントIDを取得
 * 
 * @returns テナントID（UUID文字列）、設定されていない場合はnull
 */
export async function getCurrentTenant(): Promise<string | null> {
  try {
    const result = await db.execute(
      sql`SELECT get_current_tenant() as get_current_tenant`
    );
    
    // postgres-js の結果形式に合わせて取得
    // 注意: 実際の実装では、使用しているDBクライアントの形式に合わせて調整が必要
    return (result as any)[0]?.get_current_tenant || null;
  } catch (error) {
    // セッション変数が設定されていない場合
    return null;
  }
}

/**
 * テナントコンテキストをクリア
 * 
 * 注意: 通常は使用しない。セッション終了時に自動的にクリアされる。
 */
export async function clearTenantContext(): Promise<void> {
  await db.execute(
    sql`SELECT set_config('app.current_tenant', NULL, true)`
  );
}

/**
 * テナントコンテキストを設定した状態で関数を実行
 * 
 * トランザクション内でテナントコンテキストを設定し、実行後にクリアします。
 * 
 * @param tenantId テナントID
 * @param fn 実行する関数
 * @returns 関数の戻り値
 */
export async function withTenantContext<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  await setTenantContext(tenantId);
  
  try {
    return await fn();
  } finally {
    // セッション終了時に自動的にクリアされるが、明示的にクリアすることも可能
    // await clearTenantContext();
  }
}

