-- テスト用テナントの作成（マイグレーション）
-- 
-- ローカル開発環境でテスト用テナントを作成します。
-- RLSをバイパスして直接テーブルに挿入します。
--
-- 実行方法:
-- ```bash
-- psql -U postgres -d crm_platform -f src/lib/db/migrations/004_seed_test_tenant.sql
-- ```

-- テスト用テナントの挿入（RLSをバイパスして挿入する必要があるため、migrationで行う）
INSERT INTO tenants (id, name, slug, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Test Company',
  'test-co',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 確認
SELECT 
  id,
  name,
  slug,
  is_active,
  created_at
FROM tenants
WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;

