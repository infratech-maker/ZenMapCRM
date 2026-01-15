-- 包括的なマイグレーションスクリプト
-- Prismaスキーマに合わせて、すべてのテーブルのカラム名をスネークケースに統一
-- 不足しているテーブルやカラムを追加

-- ============================================
-- 1. ENUM型の作成（既に存在する場合はスキップ）
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organizationtype') THEN
    CREATE TYPE "OrganizationType" AS ENUM ('DIRECT', 'PARTNER_1ST', 'PARTNER_2ND', 'UNIT', 'INDIVIDUAL');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customerstatus') THEN
    CREATE TYPE "CustomerStatus" AS ENUM ('LEAD', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'CLOSED');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dealstatus') THEN
    CREATE TYPE "DealStatus" AS ENUM ('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'productcategory') THEN
    CREATE TYPE "ProductCategory" AS ENUM ('SERVICE', 'HARDWARE', 'SOFTWARE', 'CONSULTING', 'OTHER');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fieldtype') THEN
    CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTISELECT', 'TEXTAREA', 'BOOLEAN', 'CURRENCY');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kpitype') THEN
    CREATE TYPE "KpiType" AS ENUM ('TOSS_COUNT', 'TOSS_RATE', 'PRE_CONFIRMED', 'POST_CONFIRMED', 'ET_COUNT', 'ACTIVATION_SAME_DAY', 'ACTIVATION_NEXT_DAY', 'CONVERSION_RATE');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plitemtype') THEN
    CREATE TYPE "PlItemType" AS ENUM ('REVENUE', 'GROSS_PROFIT', 'OPERATING_PROFIT', 'COST_OF_SALES', 'SGA', 'AGENCY_PAYMENT', 'OTHER_INCOME', 'OTHER_EXPENSE');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scrapingjobstatus') THEN
    CREATE TYPE "ScrapingJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitationstatus') THEN
    CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activitytype') THEN
    CREATE TYPE "ActivityType" AS ENUM ('CALL', 'VISIT', 'EMAIL', 'CHAT', 'OTHER');
  END IF;
END $$;

-- ============================================
-- 2. invitationsテーブルのカラム名修正
-- ============================================

DO $$ 
BEGIN
  -- tenantId → tenant_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'tenantId') THEN
    ALTER TABLE invitations RENAME COLUMN "tenantId" TO tenant_id;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'tenant_id') THEN
    ALTER TABLE invitations ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  
  -- organizationId → organization_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'organizationId') THEN
    ALTER TABLE invitations RENAME COLUMN "organizationId" TO organization_id;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'organization_id') THEN
    ALTER TABLE invitations ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
  
  -- roleId → role_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'roleId') THEN
    ALTER TABLE invitations RENAME COLUMN "roleId" TO role_id;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'role_id') THEN
    ALTER TABLE invitations ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
  
  -- expiresAt → expires_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'expiresAt') THEN
    ALTER TABLE invitations RENAME COLUMN "expiresAt" TO expires_at;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'expires_at') THEN
    ALTER TABLE invitations ADD COLUMN expires_at TIMESTAMP NOT NULL;
  END IF;
  
  -- invitedBy → invited_by
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'invitedBy') THEN
    ALTER TABLE invitations RENAME COLUMN "invitedBy" TO invited_by;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'invited_by') THEN
    ALTER TABLE invitations ADD COLUMN invited_by UUID REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  -- createdAt → created_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'createdAt') THEN
    ALTER TABLE invitations RENAME COLUMN "createdAt" TO created_at;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'created_at') THEN
    ALTER TABLE invitations ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
  END IF;
  
  -- updatedAt → updated_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'updatedAt') THEN
    ALTER TABLE invitations RENAME COLUMN "updatedAt" TO updated_at;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'updated_at') THEN
    ALTER TABLE invitations ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END $$;

-- ============================================
-- 3. leadsテーブルのカラム名修正と不足カラム追加
-- ============================================

DO $$ 
BEGIN
  -- tenantId → tenant_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'tenantId') THEN
    ALTER TABLE leads RENAME COLUMN "tenantId" TO tenant_id;
  END IF;
  
  -- scrapingJobId → scraping_job_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'scrapingJobId') THEN
    ALTER TABLE leads RENAME COLUMN "scrapingJobId" TO scraping_job_id;
  END IF;
  
  -- organizationId → organization_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organizationId') THEN
    ALTER TABLE leads RENAME COLUMN "organizationId" TO organization_id;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organization_id') THEN
    ALTER TABLE leads ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
  
  -- projectId → project_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'projectId') THEN
    ALTER TABLE leads RENAME COLUMN "projectId" TO project_id;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'project_id') THEN
    ALTER TABLE leads ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
  
  -- masterLeadId → master_lead_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'masterLeadId') THEN
    ALTER TABLE leads RENAME COLUMN "masterLeadId" TO master_lead_id;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'master_lead_id') THEN
    ALTER TABLE leads ADD COLUMN master_lead_id TEXT REFERENCES master_leads(id) ON DELETE CASCADE;
  END IF;
  
  -- createdBy → created_by
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'createdBy') THEN
    ALTER TABLE leads RENAME COLUMN "createdBy" TO created_by;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'created_by') THEN
    ALTER TABLE leads ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- updatedBy → updated_by
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'updatedBy') THEN
    ALTER TABLE leads RENAME COLUMN "updatedBy" TO updated_by;
  ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'updated_by') THEN
    ALTER TABLE leads ADD COLUMN updated_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- createdAt → created_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'createdAt') THEN
    ALTER TABLE leads RENAME COLUMN "createdAt" TO created_at;
  END IF;
  
  -- updatedAt → updated_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'updatedAt') THEN
    ALTER TABLE leads RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
END $$;

-- ============================================
-- 4. scraping_jobsテーブルのカラム名修正
-- ============================================

DO $$ 
BEGIN
  -- tenantId → tenant_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scraping_jobs' AND column_name = 'tenantId') THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "tenantId" TO tenant_id;
  END IF;
  
  -- bullmqJobId → bullmq_job_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scraping_jobs' AND column_name = 'bullmqJobId') THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "bullmqJobId" TO bullmq_job_id;
  END IF;
  
  -- startedAt → started_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scraping_jobs' AND column_name = 'startedAt') THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "startedAt" TO started_at;
  END IF;
  
  -- completedAt → completed_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scraping_jobs' AND column_name = 'completedAt') THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "completedAt" TO completed_at;
  END IF;
  
  -- createdAt → created_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scraping_jobs' AND column_name = 'createdAt') THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "createdAt" TO created_at;
  END IF;
  
  -- updatedAt → updated_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scraping_jobs' AND column_name = 'updatedAt') THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
  
  -- createdBy → created_by
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scraping_jobs' AND column_name = 'created_by') THEN
    ALTER TABLE scraping_jobs ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 5. 不足しているテーブルの作成
-- ============================================

-- projectsテーブル
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);

-- activity_logsテーブル
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
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

-- ============================================
-- 6. インデックスの追加（不足している場合）
-- ============================================

-- invitationsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- leadsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_scraping_job_id ON leads(scraping_job_id);
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_master_lead_id ON leads(master_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON leads(project_id);

-- ============================================
-- 7. 外部キー制約の追加（不足している場合）
-- ============================================

DO $$ 
BEGIN
  -- invitations.tenant_id の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invitations_tenant_id_fkey' 
    AND table_name = 'invitations'
  ) THEN
    ALTER TABLE invitations ADD CONSTRAINT invitations_tenant_id_fkey 
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
  
  -- invitations.organization_id の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invitations_organization_id_fkey' 
    AND table_name = 'invitations'
  ) AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'organization_id') THEN
    ALTER TABLE invitations ADD CONSTRAINT invitations_organization_id_fkey 
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
  
  -- invitations.role_id の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invitations_role_id_fkey' 
    AND table_name = 'invitations'
  ) AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'role_id') THEN
    ALTER TABLE invitations ADD CONSTRAINT invitations_role_id_fkey 
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
  
  -- invitations.invited_by の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invitations_invited_by_fkey' 
    AND table_name = 'invitations'
  ) AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invitations' AND column_name = 'invited_by') THEN
    ALTER TABLE invitations ADD CONSTRAINT invitations_invited_by_fkey 
      FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  -- leads.organization_id の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_organization_id_fkey' 
    AND table_name = 'leads'
  ) AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'organization_id') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_organization_id_fkey 
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
  
  -- leads.project_id の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_project_id_fkey' 
    AND table_name = 'leads'
  ) AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'project_id') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
  
  -- leads.master_lead_id の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_master_lead_id_fkey' 
    AND table_name = 'leads'
  ) AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'master_lead_id') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_master_lead_id_fkey 
      FOREIGN KEY (master_lead_id) REFERENCES master_leads(id) ON DELETE CASCADE;
  END IF;
  
  -- leads.created_by の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_created_by_fkey' 
    AND table_name = 'leads'
  ) AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'created_by') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- leads.updated_by の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_updated_by_fkey' 
    AND table_name = 'leads'
  ) AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'updated_by') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_updated_by_fkey 
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  
  -- scraping_jobs.created_by の外部キー制約
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'scraping_jobs_created_by_fkey' 
    AND table_name = 'scraping_jobs'
  ) AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'scraping_jobs' AND column_name = 'created_by') THEN
    ALTER TABLE scraping_jobs ADD CONSTRAINT scraping_jobs_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- マイグレーション完了
SELECT 'Migration completed successfully!' AS status;
