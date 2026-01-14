-- すべてのPrismaモデルに対応するテーブルが存在するか確認するSQLスクリプト
-- このスクリプトは実行してもエラーにはなりませんが、存在しないテーブルを特定できます

-- 1. Core Models
SELECT 'tenants' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') as exists;
SELECT 'users' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') as exists;
SELECT 'organizations' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') as exists;
SELECT 'user_organizations' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_organizations') as exists;
SELECT 'roles' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') as exists;
SELECT 'permissions' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions') as exists;
SELECT 'user_roles' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') as exists;
SELECT 'role_permissions' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') as exists;
SELECT 'invitations' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invitations') as exists;
SELECT 'organization_closure' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_closure') as exists;

-- 2. Product & Dynamic Fields
SELECT 'products' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') as exists;
SELECT 'product_field_definitions' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_field_definitions') as exists;
SELECT 'customer_field_values' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_field_values') as exists;

-- 3. Customer & Lead Management
SELECT 'customers' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') as exists;
SELECT 'leads' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') as exists;

-- 4. Deal Management
SELECT 'deals' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') as exists;

-- 5. KPI & PL Management
SELECT 'kpi_records' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'kpi_records') as exists;
SELECT 'pl_records' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pl_records') as exists;
SELECT 'simulations' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'simulations') as exists;

-- 6. Project Management
SELECT 'projects' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') as exists;

-- 7. Master Lead Management
SELECT 'master_leads' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'master_leads') as exists;
SELECT 'lead_vectors' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_vectors') as exists;

-- 8. Scraper Management
SELECT 'scraping_jobs' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scraping_jobs') as exists;

-- 9. Activity Log
SELECT 'activity_logs' as table_name, EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') as exists;
