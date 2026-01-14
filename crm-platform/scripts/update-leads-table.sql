-- leadsテーブルに不足しているカラムを追加

-- master_lead_idカラムを追加（既に存在する場合はスキップ）
-- master_leadsテーブルが存在する場合のみ外部キー制約を追加
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'master_leads') THEN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS master_lead_id TEXT REFERENCES master_leads(id) ON DELETE CASCADE;
  ELSE
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS master_lead_id TEXT;
  END IF;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- organization_idカラムを追加（既に存在する場合はスキップ）
DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- project_idカラムを追加（既に存在する場合はスキップ）
-- projectsテーブルが存在する場合のみ外部キー制約を追加
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
  ELSE
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS project_id TEXT;
  END IF;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- created_byカラムを追加（既に存在する場合はスキップ）
DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- updated_byカラムを追加（既に存在する場合はスキップ）
DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- インデックスを追加（既に存在する場合はスキップ）
CREATE INDEX IF NOT EXISTS idx_leads_master_lead_id ON leads(master_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON leads(project_id);
