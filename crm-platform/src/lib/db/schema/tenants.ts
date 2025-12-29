import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * テナントテーブル（マルチテナント対応）
 * 
 * 設計理由:
 * - SaaS化により、複数のクライアント企業が同じデータベースを使用
 * - 各テナントのデータを完全に分離するため、すべてのテーブルに tenant_id を追加
 * - Row Level Security (RLS) と組み合わせて、テナント間のデータ漏洩を防止
 * 
 * RLS準備:
 * - 将来的にPostgreSQLのRow Level Securityを有効化する予定
 * - 各テーブルで tenant_id による自動フィルタリングを実装
 * - アプリケーション層でも tenant_id によるフィルタリングを必須とする
 */
export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(), // URL用スラッグ（例: "company-abc"）
  
  // メタデータ
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 循環参照を避けるため、リレーションは各テーブルのスキーマファイルで定義
// 例: organizations.ts で tenants へのリレーションを定義

