-- scraping_jobsテーブルのカラム名を修正
-- Drizzleスキーマで作成されたカラム名（キャメルケース）をスネークケースにリネーム

-- tenantId → tenant_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scraping_jobs' 
    AND column_name = 'tenantId'
  ) THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "tenantId" TO tenant_id;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- bullmqJobId → bullmq_job_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scraping_jobs' 
    AND column_name = 'bullmqJobId'
  ) THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "bullmqJobId" TO bullmq_job_id;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- startedAt → started_at
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scraping_jobs' 
    AND column_name = 'startedAt'
  ) THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "startedAt" TO started_at;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- completedAt → completed_at
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scraping_jobs' 
    AND column_name = 'completedAt'
  ) THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "completedAt" TO completed_at;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- createdAt → created_at
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scraping_jobs' 
    AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "createdAt" TO created_at;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- updatedAt → updated_at
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scraping_jobs' 
    AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE scraping_jobs RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- created_byカラムを追加（既に存在する場合はスキップ）
DO $$ BEGIN
  ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- インデックスを追加（既に存在する場合はスキップ）
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_tenant_id ON scraping_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_tenant_status ON scraping_jobs(tenant_id, status);
