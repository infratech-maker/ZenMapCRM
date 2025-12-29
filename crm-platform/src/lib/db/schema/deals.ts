import { pgTable, text, timestamp, uuid, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { customers } from "./customers";
import { products } from "./products";
import { organizations } from "./organizations";
import { tenants } from "./tenants";

/**
 * 商談ステータス
 */
export const dealStatusEnum = pgEnum("deal_status", [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]);

/**
 * 商談テーブル
 * 
 * 設計理由:
 * - 顧客から案件化（qualified）された後の詳細な商談管理
 * - 売上・粗利の源泉となる取引を記録
 * - PL記録（plRecords）との連携で収益を追跡
 * 
 * マルチテナント対応:
 * - tenant_id により、テナント間のデータ分離を実現
 * - RLS準備: 将来的にPostgreSQLのRow Level Securityを有効化し、tenant_idによる自動フィルタリングを実装
 */
export const deals = pgTable("deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(), // マルチテナント対応: テナントID
  
  // リレーション
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id").references(() => products.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  
  // 商談情報
  name: text("name").notNull(),
  status: dealStatusEnum("status").default("prospecting").notNull(),
  
  // 金額
  amount: numeric("amount", { precision: 15, scale: 2 }),
  expectedCloseDate: date("expected_close_date"),
  actualCloseDate: date("actual_close_date"),
  
  // メタデータ
  probability: numeric("probability", { precision: 5, scale: 2 }), // 0-100 (%)
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dealsRelations = relations(deals, ({ one }) => ({
  tenant: one(tenants, {
    fields: [deals.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [deals.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [deals.productId],
    references: [products.id],
  }),
  organization: one(organizations, {
    fields: [deals.organizationId],
    references: [organizations.id],
  }),
}));


