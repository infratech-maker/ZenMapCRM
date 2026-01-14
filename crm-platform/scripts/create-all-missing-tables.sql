-- 不足しているテーブルとカラムを一括作成・修正

-- 1. projectsテーブル（既に作成済みの可能性があるが、念のため）
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, -- CUID形式
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);

-- 2. activity_logsテーブル
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY, -- CUID形式
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'CALL',
  status TEXT,
  note TEXT,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_lead_id ON activity_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_org ON activity_logs(tenant_id, organization_id);

-- 3. invitationsテーブルのカラム名を修正（既に存在する場合）
DO $$ BEGIN
  -- tenantId → tenant_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE invitations RENAME COLUMN "tenantId" TO tenant_id;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  -- organizationId → organization_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'organizationId'
  ) THEN
    ALTER TABLE invitations RENAME COLUMN "organizationId" TO organization_id;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  -- roleId → role_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'roleId'
  ) THEN
    ALTER TABLE invitations RENAME COLUMN "roleId" TO role_id;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  -- expiresAt → expires_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'expiresAt'
  ) THEN
    ALTER TABLE invitations RENAME COLUMN "expiresAt" TO expires_at;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  -- invitedBy → invited_by
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'invitedBy'
  ) THEN
    ALTER TABLE invitations RENAME COLUMN "invitedBy" TO invited_by;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  -- createdAt → created_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE invitations RENAME COLUMN "createdAt" TO created_at;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  -- updatedAt → updated_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE invitations RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- 4. leadsテーブルのproject_idカラムの型を確認・修正
-- projectsテーブルのidはTEXT（CUID）なので、leads.project_idもTEXTである必要がある
DO $$ BEGIN
  -- project_idカラムが存在しない場合は追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'project_id'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
      ALTER TABLE leads ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
    ELSE
      ALTER TABLE leads ADD COLUMN project_id TEXT;
    END IF;
  END IF;
  
  -- project_idカラムがUUID型の場合はTEXT型に変更
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'project_id'
    AND data_type = 'uuid'
  ) THEN
    -- データをバックアップしてから型変更
    ALTER TABLE leads ALTER COLUMN project_id TYPE TEXT USING project_id::TEXT;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;
