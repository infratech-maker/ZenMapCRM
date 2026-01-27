-- HNSWインデックスの適用スクリプト
-- このスクリプトは、pgvector拡張機能とHNSWインデックスを確認・作成します

-- 1. pgvector拡張機能の確認と有効化
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE EXTENSION vector;
        RAISE NOTICE 'pgvector拡張機能を有効化しました';
    ELSE
        RAISE NOTICE 'pgvector拡張機能は既に有効化されています';
    END IF;
END $$;

-- 2. lead_vectorsテーブルの存在確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_vectors') THEN
        RAISE NOTICE 'lead_vectorsテーブルが存在しません。先にテーブルを作成してください。';
    ELSE
        RAISE NOTICE 'lead_vectorsテーブルが存在します';
    END IF;
END $$;

-- 3. HNSWインデックスの確認と作成
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'lead_vectors' AND indexname = 'lead_vectors_embedding_idx') THEN
        RAISE NOTICE 'HNSWインデックスは既に存在します';
    ELSE
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_vectors') THEN
            CREATE INDEX IF NOT EXISTS lead_vectors_embedding_idx 
            ON lead_vectors 
            USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
            RAISE NOTICE 'HNSWインデックスを作成しました';
        ELSE
            RAISE NOTICE 'lead_vectorsテーブルが存在しないため、インデックスを作成できません';
        END IF;
    END IF;
END $$;

-- 4. 確認クエリ
SELECT 
    'pgvector拡張機能' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') 
        THEN '✅ 有効化済み' 
        ELSE '❌ 未有効化' 
    END as status;

SELECT 
    'HNSWインデックス' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'lead_vectors' AND indexname = 'lead_vectors_embedding_idx') 
        THEN '✅ 存在する' 
        ELSE '❌ 存在しない' 
    END as status;
