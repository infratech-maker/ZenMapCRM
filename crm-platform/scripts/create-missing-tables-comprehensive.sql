-- すべての不足しているテーブルを作成する包括的なSQLスクリプト
-- 既に存在するテーブルはスキップされます

-- ============================================
-- 1. Core Models (既に作成済みの可能性が高い)
-- ============================================

-- productsテーブル（tenant_id, base_price, is_active, created_at, updated_atカラムを確認）
DO $$ 
BEGIN
  -- productsテーブルが存在しない場合は作成
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    CREATE TABLE products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      category TEXT NOT NULL, -- ProductCategory ENUM
      description TEXT,
      base_price NUMERIC(15, 2),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(tenant_id, code)
    );
    CREATE INDEX idx_products_tenant_id ON products(tenant_id);
  END IF;

  -- productsテーブルに不足しているカラムを追加
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'tenant_id') THEN
    ALTER TABLE products ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'base_price') THEN
    ALTER TABLE products ADD COLUMN base_price NUMERIC(15, 2);
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_active') THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'created_at') THEN
    ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'updated_at') THEN
    ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- lead_vectorsテーブル
CREATE TABLE IF NOT EXISTS lead_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_lead_id TEXT UNIQUE NOT NULL REFERENCES master_leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- pgvector拡張が必要
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_vectors_master_lead_id ON lead_vectors(master_lead_id);

-- ============================================
-- 2. その他の不足している可能性のあるテーブル
-- ============================================

-- product_field_definitionsテーブル
CREATE TABLE IF NOT EXISTS product_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- FieldType ENUM
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value TEXT,
  options JSONB,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_product_field_definitions_tenant_id ON product_field_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_field_definitions_product_id ON product_field_definitions(product_id);

-- customer_field_valuesテーブル
CREATE TABLE IF NOT EXISTS customer_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES product_field_definitions(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, field_definition_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_field_values_tenant_id ON customer_field_values(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_field_values_customer_id ON customer_field_values(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_field_values_field_definition_id ON customer_field_values(field_definition_id);

-- dealsテーブル
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'prospecting', -- DealStatus ENUM
  amount NUMERIC(15, 2),
  expected_close_date DATE,
  actual_close_date DATE,
  probability NUMERIC(5, 2), -- 0-100 (%)
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_tenant_id ON deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deals_tenant_status ON deals(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_customer_id ON deals(customer_id);
CREATE INDEX IF NOT EXISTS idx_deals_organization_id ON deals(organization_id);

-- kpi_recordsテーブル
CREATE TABLE IF NOT EXISTS kpi_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  kpi_type TEXT NOT NULL, -- KpiType ENUM
  value NUMERIC(15, 4) NOT NULL,
  record_date DATE NOT NULL,
  period_type TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_records_tenant_id ON kpi_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpi_records_tenant_org_date ON kpi_records(tenant_id, organization_id, record_date);
CREATE INDEX IF NOT EXISTS idx_kpi_records_tenant_product_date ON kpi_records(tenant_id, product_id, record_date);

-- pl_recordsテーブル
CREATE TABLE IF NOT EXISTS pl_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL, -- PlItemType ENUM
  amount NUMERIC(15, 2) NOT NULL,
  record_date DATE NOT NULL,
  period_type TEXT NOT NULL,
  is_actual TEXT DEFAULT 'actual', -- "actual" | "forecast" | "simulation"
  simulation_id UUID REFERENCES simulations(id) ON DELETE SET NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pl_records_tenant_id ON pl_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pl_records_tenant_org_date ON pl_records(tenant_id, organization_id, record_date);
CREATE INDEX IF NOT EXISTS idx_pl_records_tenant_product_date ON pl_records(tenant_id, product_id, record_date);

-- simulationsテーブル
CREATE TABLE IF NOT EXISTS simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parameters TEXT NOT NULL, -- JSON string
  projected_revenue NUMERIC(15, 2),
  projected_gross_profit NUMERIC(15, 2),
  projected_operating_profit NUMERIC(15, 2),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulations_tenant_id ON simulations(tenant_id);
