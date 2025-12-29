-- スクレイパー関連テーブルのインデックス
-- RLSとクエリパフォーマンス向上のため

-- scraping_jobs テーブル
CREATE INDEX idx_scraping_jobs_tenant ON scraping_jobs(tenant_id);
CREATE INDEX idx_scraping_jobs_tenant_status ON scraping_jobs(tenant_id, status);
CREATE INDEX idx_scraping_jobs_tenant_created ON scraping_jobs(tenant_id, created_at);

-- leads テーブル
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_tenant_created ON leads(tenant_id, created_at);
CREATE INDEX idx_leads_scraping_job ON leads(scraping_job_id);

