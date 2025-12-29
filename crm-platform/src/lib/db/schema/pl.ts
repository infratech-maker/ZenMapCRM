import { pgTable, text, timestamp, uuid, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { products } from "./products";
import { customers } from "./customers";
import { tenants } from "./tenants";

/**
 * PL項目種別
 */
export const plItemTypeEnum = pgEnum("pl_item_type", [
  "revenue",           // 売上
  "gross_profit",      // 粗利
  "operating_profit",  // 営業利益
  "cost_of_sales",     // 営業原価
  "sga",               // 販管費
  "agency_payment",    // 代理店支払い
  "other_income",      // その他収益
  "other_expense",     // その他費用
]);

/**
 * PL記録テーブル（損益計算書）
 * 
 * 設計理由:
 * - 売上から粗利、営業利益まで一貫した収支管理
 * - 組織階層（直営/パートナー）ごとの収益性分析
 * - 商材別の収益性分析
 * - シミュレーション機能との連携（予実管理）
 * 
 * 金額計算:
 * - numeric(15, 2) で正確な金銭計算を保証
 * - アプリ側では decimal.js を使用して整合性を保つ
 * 
 * マルチテナント対応:
 * - tenant_id により、テナント間のデータ分離を実現
 * - RLS準備: 将来的にPostgreSQLのRow Level Securityを有効化し、tenant_idによる自動フィルタリングを実装
 */
export const plRecords = pgTable("pl_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(), // マルチテナント対応: テナントID
  
  // 集計対象
  organizationId: uuid("organization_id").references(() => organizations.id),
  productId: uuid("product_id").references(() => products.id),
  customerId: uuid("customer_id").references(() => customers.id), // 個別取引の場合
  
  // PL項目
  itemType: plItemTypeEnum("item_type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(), // 金額（JPY）
  
  // 集計期間
  recordDate: date("record_date").notNull(),
  periodType: text("period_type").notNull(), // "daily", "weekly", "monthly", "yearly"
  
  // 予実区分
  isActual: text("is_actual").notNull().default("actual"), // "actual" | "forecast" | "simulation"
  simulationId: uuid("simulation_id"), // シミュレーション実行時のID
  
  // メタデータ
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * シミュレーション実行履歴
 * 
 * 設計理由:
 * - 「もし獲得件数がX件なら？」といった仮定に基づく売上・粗利の予測
 * - 複数のシナリオを保存・比較可能にする
 * 
 * マルチテナント対応:
 * - tenant_id により、テナント間のデータ分離を実現
 * - RLS準備: 将来的にPostgreSQLのRow Level Securityを有効化し、tenant_idによる自動フィルタリングを実装
 */
export const simulations = pgTable("simulations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(), // マルチテナント対応: テナントID
  name: text("name").notNull(),
  description: text("description"),
  
  // シミュレーション条件（JSONBで柔軟に保存）
  // 例: { targetAcquisitions: 100, period: "2024-Q1", assumptions: {...} }
  parameters: text("parameters").notNull(), // JSON文字列
  
  // 結果サマリー（計算済み）
  projectedRevenue: numeric("projected_revenue", { precision: 15, scale: 2 }),
  projectedGrossProfit: numeric("projected_gross_profit", { precision: 15, scale: 2 }),
  projectedOperatingProfit: numeric("projected_operating_profit", { precision: 15, scale: 2 }),
  
  // メタデータ
  createdBy: uuid("created_by"), // users テーブル参照（後で定義）
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const plRecordsRelations = relations(plRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [plRecords.tenantId],
    references: [tenants.id],
  }),
  organization: one(organizations, {
    fields: [plRecords.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [plRecords.productId],
    references: [products.id],
  }),
  customer: one(customers, {
    fields: [plRecords.customerId],
    references: [customers.id],
  }),
}));

export const simulationsRelations = relations(simulations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [simulations.tenantId],
    references: [tenants.id],
  }),
}));


