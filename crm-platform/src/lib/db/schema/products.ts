import { pgTable, text, timestamp, uuid, boolean, numeric, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productFieldDefinitions } from "./dynamicFields";
import { customers } from "./customers";
import { tenants } from "./tenants";

/**
 * 商材カテゴリ
 */
export const productCategoryEnum = pgEnum("product_category", [
  "service",
  "hardware",
  "software",
  "consulting",
  "other",
]);

/**
 * 商材テーブル
 * 
 * 各商材は独自の管理項目（動的カラム）を持つ可能性がある
 * 
 * マルチテナント対応:
 * - tenant_id により、テナント間のデータ分離を実現
 * - code は tenant_id と組み合わせてUNIQUE（マイグレーション時に複合UNIQUE制約を追加）
 * - RLS準備: 将来的にPostgreSQLのRow Level Securityを有効化し、tenant_idによる自動フィルタリングを実装
 */
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(), // マルチテナント対応: テナントID
  name: text("name").notNull(),
  code: text("code").notNull(), // tenant_idと組み合わせてUNIQUE
  category: productCategoryEnum("category").notNull(),
  
  // 基本情報
  description: text("description"),
  basePrice: numeric("base_price", { precision: 15, scale: 2 }), // decimal.js互換
  
  // メタデータ
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  fieldDefinitions: many(productFieldDefinitions),
  customers: many(customers),
}));

