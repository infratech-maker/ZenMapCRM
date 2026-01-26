-- lead_vectorsテーブルのすべてのインデックスを確認

-- 1. すべてのインデックスを表示
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'lead_vectors'
ORDER BY indexname;

-- 2. pg_classからも確認（より詳細な情報）
SELECT 
    c.relname AS index_name,
    am.amname AS index_type,
    pg_get_indexdef(c.oid) AS index_definition
FROM pg_class c
JOIN pg_am am ON c.relam = am.oid
JOIN pg_index i ON c.oid = i.indexrelid
JOIN pg_class t ON i.indrelid = t.oid
WHERE t.relname = 'lead_vectors'
ORDER BY c.relname;

-- 3. HNSWインデックスの存在確認（大文字小文字を区別しない）
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'lead_vectors'
AND (indexname ILIKE '%hnsw%' OR indexdef ILIKE '%hnsw%');
