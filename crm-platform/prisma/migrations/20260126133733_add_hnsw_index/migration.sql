-- Add HNSW Index for Vector Search (RAG)
-- This index enables fast approximate nearest neighbor search using HNSW algorithm
-- Optimized for cosine similarity search with vector_cosine_ops

-- HNSW (Hierarchical Navigable Small World) Index
-- Parameters:
--   m: Maximum number of connections per node (default: 16, recommended: 16-64)
--   ef_construction: Search range during index construction (default: 64, recommended: 64-200)
-- 
-- This index significantly improves search performance for large datasets
-- and is essential for future "predictive" and "atmosphere search" features

CREATE INDEX IF NOT EXISTS lead_vectors_embedding_idx 
ON lead_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Note: HNSW index creation may take time depending on the number of existing vectors
-- For large datasets, consider running this during off-peak hours
