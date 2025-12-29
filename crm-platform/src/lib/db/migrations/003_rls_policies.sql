-- Row Level Security (RLS) ポリシーの実装
-- マルチテナント対応: データベース層での自動テナント分離

-- ============================================
-- 1. RLSの有効化
-- ============================================

-- テナント依存テーブルにRLSを有効化
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_closure ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- tenants テーブルはRLSを適用しない（全テナント共通のマスタデータ）

-- ============================================
-- 2. セッション変数設定関数の作成
-- ============================================

-- テナントIDをセッション変数に設定する関数
-- アプリケーション層から呼び出される
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_uuid::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 現在のテナントIDを取得する関数
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. RLSポリシーの定義
-- ============================================

-- organizations テーブル
CREATE POLICY "tenant_isolation_organizations" ON organizations
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  );

-- organization_closure テーブル
-- 注意: ancestor_id と descendant_id は必ず同じ tenant_id に属する必要がある
CREATE POLICY "tenant_isolation_organization_closure" ON organization_closure
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
    -- 追加の整合性チェック: ancestor と descendant が同じテナントに属することを確認
    AND EXISTS (
      SELECT 1 FROM organizations o1, organizations o2
      WHERE o1.id = ancestor_id
        AND o2.id = descendant_id
        AND o1.tenant_id = tenant_id
        AND o2.tenant_id = tenant_id
    )
  );

-- products テーブル
CREATE POLICY "tenant_isolation_products" ON products
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  );

-- product_field_definitions テーブル
CREATE POLICY "tenant_isolation_product_field_definitions" ON product_field_definitions
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
    -- 追加の整合性チェック: 関連する product が同じテナントに属することを確認
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id
        AND p.tenant_id = tenant_id
    )
  );

-- customer_field_values テーブル
CREATE POLICY "tenant_isolation_customer_field_values" ON customer_field_values
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
    -- 追加の整合性チェック: 関連する customer と field_definition が同じテナントに属することを確認
    AND EXISTS (
      SELECT 1 FROM customers c, product_field_definitions pfd
      WHERE c.id = customer_id
        AND pfd.id = field_definition_id
        AND c.tenant_id = tenant_id
        AND pfd.tenant_id = tenant_id
    )
  );

-- customers テーブル
CREATE POLICY "tenant_isolation_customers" ON customers
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
    -- 追加の整合性チェック: 関連する product と organization が同じテナントに属することを確認
    AND (
      product_id IS NULL OR EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_id
          AND p.tenant_id = tenant_id
      )
    )
    AND (
      organization_id IS NULL OR EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_id
          AND o.tenant_id = tenant_id
      )
    )
  );

-- kpi_records テーブル
CREATE POLICY "tenant_isolation_kpi_records" ON kpi_records
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
    -- 追加の整合性チェック: 関連する organization, product, customer が同じテナントに属することを確認
    AND (
      organization_id IS NULL OR EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_id
          AND o.tenant_id = tenant_id
      )
    )
    AND (
      product_id IS NULL OR EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_id
          AND p.tenant_id = tenant_id
      )
    )
    AND (
      customer_id IS NULL OR EXISTS (
        SELECT 1 FROM customers c
        WHERE c.id = customer_id
          AND c.tenant_id = tenant_id
      )
    )
  );

-- pl_records テーブル
CREATE POLICY "tenant_isolation_pl_records" ON pl_records
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
    -- 追加の整合性チェック: 関連する organization, product, customer が同じテナントに属することを確認
    AND (
      organization_id IS NULL OR EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_id
          AND o.tenant_id = tenant_id
      )
    )
    AND (
      product_id IS NULL OR EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_id
          AND p.tenant_id = tenant_id
      )
    )
    AND (
      customer_id IS NULL OR EXISTS (
        SELECT 1 FROM customers c
        WHERE c.id = customer_id
          AND c.tenant_id = tenant_id
      )
    )
  );

-- simulations テーブル
CREATE POLICY "tenant_isolation_simulations" ON simulations
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  );

-- deals テーブル
CREATE POLICY "tenant_isolation_deals" ON deals
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
    -- 追加の整合性チェック: 関連する customer, product, organization が同じテナントに属することを確認
    AND EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
        AND c.tenant_id = tenant_id
    )
    AND (
      product_id IS NULL OR EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_id
          AND p.tenant_id = tenant_id
      )
    )
    AND (
      organization_id IS NULL OR EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = organization_id
          AND o.tenant_id = tenant_id
      )
    )
  );

-- scraping_jobs テーブル
CREATE POLICY "tenant_isolation_scraping_jobs" ON scraping_jobs
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  );

-- leads テーブル
CREATE POLICY "tenant_isolation_leads" ON leads
  AS PERMISSIVE FOR ALL
  TO public
  USING (
    tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant', true)::uuid
    -- 追加の整合性チェック: 関連する scraping_job が同じテナントに属することを確認
    AND (
      scraping_job_id IS NULL OR EXISTS (
        SELECT 1 FROM scraping_jobs sj
        WHERE sj.id = scraping_job_id
          AND sj.tenant_id = tenant_id
      )
    )
  );

-- ============================================
-- 4. コメント追加
-- ============================================

COMMENT ON FUNCTION set_current_tenant(UUID) IS 
  'アプリケーション層から呼び出され、現在のセッションのテナントIDを設定します。RLSポリシーで使用されます。';

COMMENT ON FUNCTION get_current_tenant() IS 
  '現在のセッションに設定されているテナントIDを取得します。';

COMMENT ON POLICY "tenant_isolation_organizations" ON organizations IS 
  'organizations テーブルのRLSポリシー: tenant_id がセッション変数 app.current_tenant と一致するレコードのみアクセス可能';

-- ============================================
-- 5. テスト用のヘルパー関数（開発環境のみ）
-- ============================================

-- 注意: 本番環境では削除することを推奨
-- 開発環境でのテスト用に、テナントIDを検証する関数
CREATE OR REPLACE FUNCTION verify_tenant_isolation()
RETURNS TABLE (
  table_name TEXT,
  policy_name TEXT,
  is_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename AS table_name,
    policyname AS policy_name,
    true AS is_enabled
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE 'tenant_isolation_%'
  ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verify_tenant_isolation() IS 
  '開発環境用: RLSポリシーが正しく設定されているか確認する関数';

