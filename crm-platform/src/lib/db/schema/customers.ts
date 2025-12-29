import { pgTable, text, timestamp, uuid, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";
import { organizations } from "./organizations";
import { customerFieldValues } from "./dynamicFields";
import { kpiRecords } from "./kpi";
import { deals } from "./deals";
import { tenants } from "./tenants";

/**
 * 顧客ステータス
 */
export const customerStatusEnum = pgEnum("customer_status", [
  "lead",           // リード（未対応）
  "contacted",      // 接触済み
  "qualified",      // 案件化
  "proposal",       // 提案中
  "negotiation",    // 商談中
  "won",            // 獲得
  "lost",           // 失注
  "closed",         // クローズ
]);

/**
 * 顧客テーブル
 * 
 * 設計理由:
 * - 電話番号を主キー候補として扱う（重複チェック用）
 * - 動的フィールドは customerFieldValues テーブルで管理
 * - 組織（直営/パートナー）との紐付けで、アクセス制御と集計を実現
 * 
 * マルチテナント対応:
 * - tenant_id により、テナント間のデータ分離を実現
 * - phone_number は tenant_id と組み合わせてUNIQUE（マイグレーション時に複合UNIQUE制約を追加）
 * - RLS準備: 将来的にPostgreSQLのRow Level Securityを有効化し、tenant_idによる自動フィルタリングを実装
 */
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(), // マルチテナント対応: テナントID
  
  // 基本情報（頻繁に検索される項目は専用カラムとして保持）
  phoneNumber: text("phone_number"), // tenant_idと組み合わせてUNIQUE
  email: text("email"),
  name: text("name"),
  
  // リレーション
  productId: uuid("product_id").references(() => products.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  
  // ステータス
  status: customerStatusEnum("status").default("lead").notNull(),
  
  // メタデータ
  source: text("source"), // "scraping", "manual", "import" など
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>(),
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [customers.productId],
    references: [products.id],
  }),
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  fieldValues: many(customerFieldValues),
  kpiRecords: many(kpiRecords),
  deals: many(deals),
}));

