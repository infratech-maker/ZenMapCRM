-- ============================================
-- organization_members テーブル作成スクリプト
-- ============================================
-- 
-- このスクリプトは、OrganizationMemberモデルに対応する
-- organization_membersテーブルを作成します。
--
-- Prismaスキーマ:
-- model OrganizationMember {
--   id             String    @id @default(uuid())
--   userId         String    @map("user_id")
--   organizationId String    @map("organization_id")
--   roleId         String    @map("role_id")
--   tenantId       String    @map("tenant_id")
--   isPrimary      Boolean   @default(false) @map("is_primary")
--   assignedBy     String?   @map("assigned_by")
--   expiresAt      DateTime? @map("expires_at")
--   createdAt      DateTime  @default(now()) @map("created_at")
--   updatedAt      DateTime  @updatedAt @map("updated_at")
--   @@map("organization_members")
-- }
-- ============================================

-- テーブルが既に存在する場合は削除（開発環境用）
-- DROP TABLE IF EXISTS organization_members CASCADE;

-- organization_membersテーブルを作成
-- 注意: Staging環境ではusers.id、organizations.id、roles.id、tenants.idがTEXT型のため、TEXT型を使用
CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  assigned_by TEXT, -- 割り当てたユーザーID（nullable）
  expires_at TIMESTAMP WITH TIME ZONE, -- 有効期限（nullable）
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- 外部キー制約
  CONSTRAINT organization_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT organization_members_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT organization_members_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT organization_members_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT organization_members_assigned_by_fkey 
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- ユニーク制約: 1人のユーザーが同じ組織に重複して所属しない
  CONSTRAINT organization_members_user_organization_unique 
    UNIQUE (user_id, organization_id)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS organization_members_user_id_idx 
  ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS organization_members_organization_id_idx 
  ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS organization_members_role_id_idx 
  ON organization_members(role_id);
CREATE INDEX IF NOT EXISTS organization_members_tenant_id_idx 
  ON organization_members(tenant_id);
CREATE INDEX IF NOT EXISTS organization_members_user_id_is_primary_idx 
  ON organization_members(user_id, is_primary);
CREATE INDEX IF NOT EXISTS organization_members_user_id_expires_at_idx 
  ON organization_members(user_id, expires_at);

-- updated_atを自動更新するトリガー関数（既に存在する場合はスキップ）
CREATE OR REPLACE FUNCTION update_organization_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成（既に存在する場合はスキップ）
DROP TRIGGER IF EXISTS organization_members_updated_at_trigger ON organization_members;
CREATE TRIGGER organization_members_updated_at_trigger
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_members_updated_at();

-- テーブル作成確認
SELECT 
  'organization_members table created successfully' as status,
  COUNT(*) as existing_records
FROM organization_members;
