-- HNSWインデックスを直接作成するスクリプト
-- このスクリプトは、既存のインデックスを削除してから新しく作成します

-- 1. 既存のインデックスを削除（存在する場合）
DROP INDEX IF EXISTS lead_vectors_embedding_idx;

-- 2. HNSWインデックスを作成
CREATE INDEX lead_vectors_embedding_idx 
ON lead_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3. 確認
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'lead_vectors' 
AND indexname = 'lead_vectors_embedding_idx';
