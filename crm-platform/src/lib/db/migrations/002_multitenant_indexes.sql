-- マルチテナント対応: インデックスとUNIQUE制約の追加
-- このマイグレーションは、tenant_id を追加した後のパフォーマンス最適化とデータ整合性を保証します

-- 1. 複合UNIQUE制約の追加（tenant_id + 既存のUNIQUEカラム）

-- organizations: tenant_id + code の複合UNIQUE
CREATE UNIQUE INDEX idx_organizations_tenant_code 
ON organizations(tenant_id, code) 
WHERE code IS NOT NULL;

-- products: tenant_id + code の複合UNIQUE
CREATE UNIQUE INDEX idx_products_tenant_code 
ON products(tenant_id, code);

-- customers: tenant_id + phone_number の複合UNIQUE
CREATE UNIQUE INDEX idx_customers_tenant_phone 
ON customers(tenant_id, phone_number) 
WHERE phone_number IS NOT NULL;

-- 2. tenant_id のインデックス（RLSとクエリパフォーマンス向上のため）

CREATE INDEX idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX idx_organization_closure_tenant ON organization_closure(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_product_field_definitions_tenant ON product_field_definitions(tenant_id);
CREATE INDEX idx_customer_field_values_tenant ON customer_field_values(tenant_id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_kpi_records_tenant ON kpi_records(tenant_id);
CREATE INDEX idx_pl_records_tenant ON pl_records(tenant_id);
CREATE INDEX idx_simulations_tenant ON simulations(tenant_id);
CREATE INDEX idx_deals_tenant ON deals(tenant_id);

-- 3. 複合インデックス（tenant_id + よく使われるカラムの組み合わせ）

-- 組織階層のクエリ最適化
CREATE INDEX idx_organizations_tenant_parent ON organizations(tenant_id, parent_id);
CREATE INDEX idx_organization_closure_tenant_ancestor ON organization_closure(tenant_id, ancestor_id);
CREATE INDEX idx_organization_closure_tenant_descendant ON organization_closure(tenant_id, descendant_id);

-- 顧客検索の最適化
CREATE INDEX idx_customers_tenant_status ON customers(tenant_id, status);
CREATE INDEX idx_customers_tenant_product ON customers(tenant_id, product_id);
CREATE INDEX idx_customers_tenant_organization ON customers(tenant_id, organization_id);

-- KPI/PL集計の最適化
CREATE INDEX idx_kpi_records_tenant_org_date ON kpi_records(tenant_id, organization_id, record_date);
CREATE INDEX idx_kpi_records_tenant_product_date ON kpi_records(tenant_id, product_id, record_date);
CREATE INDEX idx_pl_records_tenant_org_date ON pl_records(tenant_id, organization_id, record_date);
CREATE INDEX idx_pl_records_tenant_product_date ON pl_records(tenant_id, product_id, record_date);

-- 商談管理の最適化
CREATE INDEX idx_deals_tenant_customer ON deals(tenant_id, customer_id);
CREATE INDEX idx_deals_tenant_status ON deals(tenant_id, status);

-- 4. RLS準備: コメント追加（実際のRLSポリシーは別途実装）

COMMENT ON TABLE tenants IS 'マルチテナント対応: テナントマスタテーブル。RLSポリシーは適用しない（全テナント共通）';
COMMENT ON TABLE organizations IS 'マルチテナント対応: tenant_id によるデータ分離。RLSポリシーで tenant_id = current_setting(''app.current_tenant_id'') を実装予定';
COMMENT ON TABLE organization_closure IS 'マルチテナント対応: tenant_id によるデータ分離。ancestor_id と descendant_id は必ず同じ tenant_id に属する必要がある';
COMMENT ON TABLE products IS 'マルチテナント対応: tenant_id によるデータ分離。code は tenant_id と組み合わせてUNIQUE';
COMMENT ON TABLE customers IS 'マルチテナント対応: tenant_id によるデータ分離。phone_number は tenant_id と組み合わせてUNIQUE';

