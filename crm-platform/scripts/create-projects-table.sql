-- projectsテーブルの作成
-- Prismaスキーマに基づいて、Drizzle ORMで作成されていないテーブルを作成

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, -- CUID形式
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
