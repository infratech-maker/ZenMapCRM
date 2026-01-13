/**
 * MasterLeadスキーマ
 * 
 * 設計理由:
 * - スクレイピングで取得したリードのマスターデータを管理
 * - 複数のテナント/組織で同じリードを共有可能にする
 * - 重複チェックと検索の高速化
 * 
 * 注意: MasterLeadはテナント非依存（グローバル）なテーブルです
 */

import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { leads } from "./scraper";

export const masterLeads = pgTable(
  "master_leads",
  {
    id: text("id").primaryKey(), // CUID形式
    companyName: text("company_name").notNull(), // 検索用
    phone: text("phone"), // 重複チェック用
    address: text("address"),
    source: text("source").notNull(), // "tabelog.com" 等
    data: jsonb("data").notNull(), // 詳細データ（leads.dataと同じ構造）
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    companyNameIdx: index("master_leads_company_name_idx").on(table.companyName),
    phoneIdx: index("master_leads_phone_idx").on(table.phone),
  })
);

// 循環参照を避けるため、リレーションはscraper.tsで定義
