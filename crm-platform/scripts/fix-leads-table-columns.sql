-- leadsテーブルのカラム名を修正
-- Drizzleスキーマで作成されたカラム名（キャメルケース）をスネークケースにリネーム

-- tenantId → tenant_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE leads RENAME COLUMN "tenantId" TO tenant_id;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- scrapingJobId → scraping_job_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'scrapingJobId'
  ) THEN
    ALTER TABLE leads RENAME COLUMN "scrapingJobId" TO scraping_job_id;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- masterLeadId → master_lead_id（既に存在する場合はスキップ）
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'masterLeadId'
  ) THEN
    ALTER TABLE leads RENAME COLUMN "masterLeadId" TO master_lead_id;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- createdAt → created_at
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE leads RENAME COLUMN "createdAt" TO created_at;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- updatedAt → updated_at
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE leads RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- 不足しているカラムを追加（既に存在する場合はスキップ）
DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
  ELSE
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_id TEXT;
  END IF;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_leads') THEN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS master_lead_id TEXT REFERENCES master_leads(id) ON DELETE CASCADE;
  ELSE
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS master_lead_id TEXT;
  END IF;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- インデックスを追加（既に存在する場合はスキップ）
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_scraping_job_id ON leads(scraping_job_id);
CREATE INDEX IF NOT EXISTS idx_leads_master_lead_id ON leads(master_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON leads(tenant_id, status);
