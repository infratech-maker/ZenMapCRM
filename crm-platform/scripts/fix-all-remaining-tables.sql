-- すべての不足しているテーブルとカラムを修正する包括的なSQLスクリプト

-- ============================================
-- 1. activity_logsテーブルの作成
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY, -- CUID形式
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
-- 2. invitationsテーブルのカラム名修正
-- ============================================

-- tenant_idカラムの確認と修正
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'tenant_id') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'tenantId') THEN
      ALTER TABLE invitations RENAME COLUMN "tenantId" TO tenant_id;
    ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'tenant_id') THEN
      -- 既に存在する場合は何もしない
      NULL;
    ELSE
      -- どちらも存在しない場合は追加
      ALTER TABLE invitations ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- organization_idカラムの確認と修正
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'organization_id') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'organizationId') THEN
      ALTER TABLE invitations RENAME COLUMN "organizationId" TO organization_id;
    ELSE
      ALTER TABLE invitations ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- role_idカラムの確認と修正
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'role_id') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'roleId') THEN
      ALTER TABLE invitations RENAME COLUMN "roleId" TO role_id;
    ELSE
      ALTER TABLE invitations ADD COLUMN role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- expires_atカラムの確認と修正
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'expires_at') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'expiresAt') THEN
      ALTER TABLE invitations RENAME COLUMN "expiresAt" TO expires_at;
    ELSE
      ALTER TABLE invitations ADD COLUMN expires_at TIMESTAMP NOT NULL;
    END IF;
  END IF;
END $$;

-- invited_byカラムの確認と修正
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'invited_by') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'invitedBy') THEN
      ALTER TABLE invitations RENAME COLUMN "invitedBy" TO invited_by;
    ELSE
      ALTER TABLE invitations ADD COLUMN invited_by UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- created_atカラムの確認と修正
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'created_at') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'createdAt') THEN
      ALTER TABLE invitations RENAME COLUMN "createdAt" TO created_at;
    ELSE
      ALTER TABLE invitations ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- updated_atカラムの確認と修正
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'updated_at') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'updatedAt') THEN
      ALTER TABLE invitations RENAME COLUMN "updatedAt" TO updated_at;
    ELSE
      ALTER TABLE invitations ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- インデックスの追加（存在しない場合）
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
