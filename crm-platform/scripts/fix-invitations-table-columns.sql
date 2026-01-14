-- invitationsテーブルのカラム名を修正（camelCase → snake_case）

-- tenant_idカラムが存在しない場合は追加
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'tenant_id') THEN
    -- tenantIdカラムが存在する場合はリネーム
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitations' AND column_name = 'tenantId') THEN
      ALTER TABLE invitations RENAME COLUMN "tenantId" TO tenant_id;
    ELSE
      -- どちらも存在しない場合は追加
      ALTER TABLE invitations ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- organization_idカラムが存在しない場合は追加
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

-- role_idカラムが存在しない場合は追加
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

-- expires_atカラムが存在しない場合は追加
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

-- invited_byカラムが存在しない場合は追加
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

-- created_atカラムが存在しない場合は追加
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

-- updated_atカラムが存在しない場合は追加
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

-- インデックスを追加（存在しない場合）
CREATE INDEX IF NOT EXISTS idx_invitations_tenant_id ON invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
