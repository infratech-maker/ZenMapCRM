/**
 * Drizzle ORM Schema - 統合CRMプラットフォーム
 * 
 * 設計思想:
 * 1. マルチテナント対応: すべてのテーブルに tenant_id を追加し、SaaS化に対応
 * 2. 組織階層: Closure Table パターンで高速な階層集計を実現
 * 3. 動的カラム: メタデータ駆動設計で商材ごとの柔軟な項目管理
 * 4. KPI/PL: 多軸集計（組織/商材/期間）に対応した正規化設計
 * 5. 金額計算: numeric(15,2) + decimal.js で正確性を担保
 * 
 * RLS準備:
 * - 将来的にPostgreSQLのRow Level Security (RLS) を有効化することを前提とした設計
 * - すべてのテーブルで tenant_id による自動フィルタリングを実装予定
 */

export * from "./tenants";
export * from "./organizations";
export * from "./products";
export * from "./dynamicFields";
export * from "./customers";
export * from "./kpi";
export * from "./pl";
export * from "./deals";
export * from "./scraper";


