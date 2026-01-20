-- ============================================
-- 既存ユーザーのデータをorganization_membersに移行
-- ============================================
-- 
-- このスクリプトは、既存のUserOrganizationとUserRoleのデータを
-- 新しいOrganizationMemberテーブルに移行します。
--
-- 注意: このスクリプトは既存データを移行するためのものです。
-- organization_membersテーブルが既に作成されていることを前提とします。
-- ============================================

-- 既存のorganization_membersレコードを確認
SELECT 
  'Before migration' as status,
  COUNT(*) as existing_memberships
FROM organization_members;

-- 一時テーブルを作成して移行データを準備
CREATE TEMP TABLE IF NOT EXISTS migration_data AS
SELECT DISTINCT ON (uo.user_id, uo.organization_id)
  uo.user_id,
  uo.organization_id,
  uo.tenant_id,
  uo.is_primary,
  COALESCE(
    ur.role_id, 
    (SELECT id FROM roles WHERE tenant_id = uo.tenant_id AND name = 'User' LIMIT 1)
  ) as role_id,
  ur.assigned_by,
  ur.expires_at,
  uo.created_at,
  uo.updated_at
FROM user_organizations uo
LEFT JOIN user_roles ur ON uo.user_id = ur.user_id AND uo.tenant_id = ur.tenant_id
WHERE NOT EXISTS (
  -- 既にorganization_membersに存在するレコードは除外
  SELECT 1 FROM organization_members om
  WHERE om.user_id = uo.user_id 
    AND om.organization_id = uo.organization_id
)
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
  'After migration' as status,
  COUNT(*) as total_memberships,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT organization_id) as unique_organizations
FROM organization_members;

-- 一時テーブルを削除
DROP TABLE IF EXISTS migration_data;

-- 移行されたユーザーごとの組織数を表示
SELECT 
  u.email,
  u.name,
  COUNT(om.id) as organization_count,
  STRING_AGG(o.name, ', ') as organizations
FROM users u
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
GROUP BY u.id, u.email, u.name
ORDER BY u.email;
