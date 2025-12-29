-- Closure Table の複合主キーとインデックス
-- Drizzleでは複合主キーを直接定義できないため、マイグレーション時に追加

-- 複合主キー
ALTER TABLE organization_closure
ADD CONSTRAINT pk_organization_closure
PRIMARY KEY (ancestor_id, descendant_id);

-- パフォーマンス最適化用インデックス
CREATE INDEX idx_closure_ancestor ON organization_closure(ancestor_id);
CREATE INDEX idx_closure_descendant ON organization_closure(descendant_id);
CREATE INDEX idx_closure_depth ON organization_closure(depth);

-- 組織テーブルのインデックス
CREATE INDEX idx_organizations_parent ON organizations(parent_id);
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_path ON organizations(path); -- Materialized Path用

-- 動的フィールド値の複合インデックス（高速検索用）
CREATE INDEX idx_customer_field_values_lookup 
ON customer_field_values(customer_id, field_definition_id);

-- 電話番号の重複チェック用インデックス（既にUNIQUE制約があるが、明示的に）
CREATE INDEX idx_customers_phone ON customers(phone_number) WHERE phone_number IS NOT NULL;

-- KPI/PL記録の集計用インデックス
CREATE INDEX idx_kpi_records_org_date ON kpi_records(organization_id, record_date);
CREATE INDEX idx_kpi_records_product_date ON kpi_records(product_id, record_date);
CREATE INDEX idx_pl_records_org_date ON pl_records(organization_id, record_date);
CREATE INDEX idx_pl_records_product_date ON pl_records(product_id, record_date);


