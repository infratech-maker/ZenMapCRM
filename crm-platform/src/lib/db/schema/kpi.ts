import { pgTable, text, timestamp, uuid, integer, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { customers } from "./customers";
import { organizations } from "./organizations";
import { products } from "./products";
import { tenants } from "./tenants";

/**
 * KPI種別
 */
export const kpiTypeEnum = pgEnum("kpi_type", [
  "toss_count",        // トス数
  "toss_rate",         // トス率
  "pre_confirmed",     // 前確
  "post_confirmed",    // 後確
  "et_count",          // ET数
  "activation_same_day",    // 当日開通数
  "activation_next_day",    // 翌日以降開通数
  "conversion_rate",   // コンバージョン率
]);

/**
 * KPI記録テーブル
 * 
 * 設計理由:
 * - 日次/週次/月次で集計可能な粒度で記録
 * - 組織階層（直営/パートナー/ユニット/個人）ごとに集計
 * - 商材別、期間別のドリルダウン分析を可能にする
 * 
 * パフォーマンス考慮:
 * - リアルタイム集計は負荷が高いため、Materialized View または
 *   非同期集計（Edge Functions）での事前計算を推奨
 * 
 * マルチテナント対応:
 * - tenant_id により、テナント間のデータ分離を実現
 * - RLS準備: 将来的にPostgreSQLのRow Level Securityを有効化し、tenant_idによる自動フィルタリングを実装
 */
export const kpiRecords = pgTable("kpi_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(), // マルチテナント対応: テナントID
  
  // 集計対象
  organizationId: uuid("organization_id").references(() => organizations.id),
  productId: uuid("product_id").references(() => products.id),
  customerId: uuid("customer_id").references(() => customers.id), // 個別記録の場合
  
  // KPI種別と値
  kpiType: kpiTypeEnum("kpi_type").notNull(),
  value: numeric("value", { precision: 15, scale: 4 }).notNull(), // 率は小数点4桁まで
  
  // 集計期間
  recordDate: date("record_date").notNull(), // 日次
  periodType: text("period_type").notNull(), // "daily", "weekly", "monthly", "yearly"
  
  // メタデータ
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kpiRecordsRelations = relations(kpiRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [kpiRecords.tenantId],
    references: [tenants.id],
  }),
  organization: one(organizations, {
    fields: [kpiRecords.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [kpiRecords.productId],
    references: [products.id],
  }),
  customer: one(customers, {
    fields: [kpiRecords.customerId],
    references: [customers.id],
  }),
}));


