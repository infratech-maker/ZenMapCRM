import { pgTable, text, timestamp, uuid, boolean, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";
import { customers } from "./customers";
import { tenants } from "./tenants";

/**
 * フィールドタイプ
 */
export const fieldTypeEnum = pgEnum("field_type", [
  "text",
  "number",
  "date",
  "select",
  "multiselect",
  "textarea",
  "boolean",
  "currency",
]);

/**
 * 商材ごとの動的フィールド定義テーブル
 * 
 * 設計理由:
 * - 商材ごとに管理項目が異なる（例: 通信系は「回線速度」、保険系は「保険金額」）
 * - スキーマ変更なしで、管理画面から項目を追加・編集できる
 * - 型安全性を保つため、fieldType でバリデーションルールを定義
 * 
 * 例:
 * - 商材A: [名前, 電話番号, 希望日時]
 * - 商材B: [会社名, 従業員数, 業種, 予算]
 * 
 * マルチテナント対応:
 * - tenant_id により、テナント間のデータ分離を実現
 * - パフォーマンス向上のため、product経由ではなく直接tenant_idを保持
 * - RLS準備: 将来的にPostgreSQLのRow Level Securityを有効化し、tenant_idによる自動フィルタリングを実装
 */
export const productFieldDefinitions = pgTable("product_field_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(), // マルチテナント対応: テナントID
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  
  // フィールド定義
  fieldKey: text("field_key").notNull(), // 内部キー（例: "phone_number"）
  fieldLabel: text("field_label").notNull(), // 表示ラベル（例: "電話番号"）
  fieldType: fieldTypeEnum("field_type").notNull(),
  
  // バリデーション・表示設定
  isRequired: boolean("is_required").default(false).notNull(),
  isUnique: boolean("is_unique").default(false).notNull(), // 重複チェック用
  defaultValue: text("default_value"),
  
  // 選択肢（select/multiselect用）
  options: jsonb("options").$type<Array<{ label: string; value: string }>>(),
  
  // 表示順序
  displayOrder: integer("display_order").default(0).notNull(),
  
  // メタデータ
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * 顧客ごとの動的フィールド値テーブル
 * 
 * 設計理由:
 * - 定義（Definitions）と値（Values）を分離することで、スキーマ変更なしで柔軟な拡張が可能
 * - JSONB を使用することで、異なる型の値を1テーブルで管理
 * - インデックス戦略: (customerId, fieldDefinitionId) の複合インデックスで高速検索
 * 
 * パフォーマンス考慮:
 * - 頻繁に検索されるフィールド（電話番号など）は、別途専用カラムとして持つことも検討
 * - 例: customers テーブルに phone_number カラムを追加し、動的フィールドと同期
 * 
 * マルチテナント対応:
 * - tenant_id により、テナント間のデータ分離を実現
 * - パフォーマンス向上のため、customer経由ではなく直接tenant_idを保持
 * - RLS準備: 将来的にPostgreSQLのRow Level Securityを有効化し、tenant_idによる自動フィルタリングを実装
 */
export const customerFieldValues = pgTable("customer_field_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" })
    .notNull(), // マルチテナント対応: テナントID
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),
  fieldDefinitionId: uuid("field_definition_id")
    .references(() => productFieldDefinitions.id, { onDelete: "cascade" })
    .notNull(),
  
  // 値（JSONBで型に応じた値を格納）
  // text: "文字列"
  // number: 123.45
  // date: "2024-01-01"
  // select: "option1"
  // multiselect: ["option1", "option2"]
  // boolean: true
  // currency: { amount: 10000, currency: "JPY" }
  value: jsonb("value").notNull(),
  
  // メタデータ
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productFieldDefinitionsRelations = relations(
  productFieldDefinitions,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [productFieldDefinitions.tenantId],
      references: [tenants.id],
    }),
    product: one(products, {
      fields: [productFieldDefinitions.productId],
      references: [products.id],
    }),
    values: many(customerFieldValues),
  })
);

export const customerFieldValuesRelations = relations(customerFieldValues, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customerFieldValues.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [customerFieldValues.customerId],
    references: [customers.id],
  }),
  fieldDefinition: one(productFieldDefinitions, {
    fields: [customerFieldValues.fieldDefinitionId],
    references: [productFieldDefinitions.id],
  }),
}));

