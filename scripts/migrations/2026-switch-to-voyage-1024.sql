-- =============================================================================
-- Migration: Switch embedding dim 1536 → 1024 (OpenAI → Voyage AI)
-- Date: 2026-05-03
-- =============================================================================
-- Rationale: thesis switched embedding provider from OpenAI text-embedding-3-small
-- (1536-dim) to Voyage voyage-3-lite (1024-dim).
--
-- Safe to run because cv_embedding / jd_embedding are still NULL on every row
-- (no embeddings have been computed yet). Otherwise we'd need to clear them.
-- =============================================================================

-- 1) cv_workflow.cv_embedding
-- Drop the ivfflat index first (depends on the column type)
DROP INDEX IF EXISTS idx_cv_workflow_embedding;
ALTER TABLE cv_workflow ALTER COLUMN cv_embedding TYPE vector(1024) USING NULL;
-- Reset hash so re-embed is forced even if the same text was previously seen
UPDATE cv_workflow SET cv_embedding_hash = NULL, cv_embedding_updated_at = NULL
  WHERE cv_embedding_hash IS NOT NULL;

-- Re-create index with the new dim
CREATE INDEX idx_cv_workflow_embedding
  ON cv_workflow
  USING ivfflat (cv_embedding vector_cosine_ops)
  WITH (lists = 100);

-- 2) jd_targets.jd_embedding
DROP INDEX IF EXISTS idx_jd_targets_embedding;
ALTER TABLE jd_targets ALTER COLUMN jd_embedding TYPE vector(1024) USING NULL;
UPDATE jd_targets SET jd_embedding_hash = NULL, jd_embedding_updated_at = NULL
  WHERE jd_embedding_hash IS NOT NULL;

CREATE INDEX idx_jd_targets_embedding
  ON jd_targets
  USING ivfflat (jd_embedding vector_cosine_ops)
  WITH (lists = 100);

-- 3) Update column comment so future readers know the source
COMMENT ON COLUMN cv_workflow.cv_embedding IS
  'Voyage AI voyage-3-lite (1024-dim) of concatenated CV text';

-- 4) Verify — should show dim=1024 for both columns
SELECT a.attname AS column_name,
       format_type(a.atttypid, a.atttypmod) AS column_type,
       c.relname AS table_name
FROM pg_attribute a
JOIN pg_class c ON c.oid = a.attrelid
WHERE c.relname IN ('cv_workflow', 'jd_targets')
  AND a.attname IN ('cv_embedding', 'jd_embedding')
  AND a.attnum > 0;
