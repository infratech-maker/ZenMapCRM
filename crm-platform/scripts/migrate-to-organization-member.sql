-- ============================================
-- 既存データ移行スクリプト: UserOrganization + UserRole → OrganizationMember
-- ============================================
-- 
-- このスクリプトは、既存のUserOrganizationとUserRoleのデータを
-- 新しいOrganizationMemberテーブルに移行します。
--
-- 移行ロジック:
-- 1. UserOrganizationの各レコードに対して
-- 2. 同じユーザーのUserRoleを取得（最初の1つを使用）
-- 3. OrganizationMemberレコードを作成
--
-- 注意: 1人のユーザーが複数のロールを持っている場合、
-- 主所属（isPrimary: true）の組織に対して最初のロールを割り当てます。
-- ============================================

-- 一時テーブルを作成して移行データを準備
CREATE TEMP TABLE IF NOT EXISTS migration_data AS
SELECT DISTINCT ON (uo.user_id, uo.organization_id)
  uo.user_id,
  uo.organization_id,
  uo.tenant_id,
  uo.is_primary,
  COALESCE(ur.role_id, (SELECT id FROM roles WHERE tenant_id = uo.tenant_id AND name = 'User' LIMIT 1)) as role_id,
  ur.assigned_by,
  ur.expires_at,
  uo.created_at,
  uo.updated_at
FROM user_organizations uo
LEFT JOIN user_roles ur ON uo.user_id = ur.user_id AND uo.tenant_id = ur.tenant_id
ORDER BY uo.user_id, uo.organization_id, uo.is_primary DESC, ur.created_at ASC;

-- OrganizationMemberテーブルにデータを挿入
INSERT INTO organization_members (
  id,
  user_id,
  organization_id,
  role_id,
  tenant_id,
  is_primary,
  assigned_by,
  expires_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  user_id,
  organization_id,
  role_id,
  tenant_id,
  is_primary,
  assigned_by,
  expires_at,
  created_at,
  updated_at
FROM migration_data
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- 移行結果を確認
SELECT 
  COUNT(*) as total_memberships,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT organization_id) as unique_organizations
FROM organization_members;

-- 一時テーブルを削除
DROP TABLE IF EXISTS migration_data;
