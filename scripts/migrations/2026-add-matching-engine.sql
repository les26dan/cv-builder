-- =============================================================================
-- Migration: Add JD-CV Matching Engine
-- Date: 2026-05-03
-- Purpose: Support 3-method comparative matching (TF-IDF, Embedding, LLM)
-- =============================================================================
-- Run AFTER scripts/migrations/0_check_pgvector.sql confirms pgvector available.
-- Apply via Supabase SQL Editor: https://supabase.com/dashboard/project/avwxdoblngwwmxrcrpnk/sql
--
-- This migration is idempotent (safe to re-run).
-- =============================================================================

-- 1) Ensure pgvector is installed
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- 2) Extend cv_workflow with embedding columns
-- =============================================================================
ALTER TABLE cv_workflow
  ADD COLUMN IF NOT EXISTS cv_embedding vector(1536),
  ADD COLUMN IF NOT EXISTS cv_embedding_hash TEXT,
  ADD COLUMN IF NOT EXISTS cv_embedding_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN cv_workflow.cv_embedding IS 'OpenAI text-embedding-3-small (1536-dim) of concatenated CV text';
COMMENT ON COLUMN cv_workflow.cv_embedding_hash IS 'sha256 of input text used to generate the embedding (for cache invalidation)';

-- ANN index for similarity search (ivfflat — works for thesis-scale ~10k rows)
-- NOTE: ivfflat needs ANALYZE after bulk insert to be effective.
-- Cosine distance operator: <=>
CREATE INDEX IF NOT EXISTS idx_cv_workflow_embedding
  ON cv_workflow
  USING ivfflat (cv_embedding vector_cosine_ops)
  WITH (lists = 100);

-- =============================================================================
-- 3) jd_targets — multi-JD per CV with persistent embedding & keywords
-- =============================================================================
CREATE TABLE IF NOT EXISTS jd_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id TEXT NOT NULL REFERENCES cv_workflow(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  label VARCHAR(120) NOT NULL,                 -- e.g. "Senior Frontend @ Acme"
  jd_text TEXT NOT NULL,
  jd_url TEXT,
  jd_keywords TEXT[],                          -- top-N keywords (TF-IDF)
  jd_embedding vector(1536),
  jd_embedding_hash TEXT,
  jd_embedding_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE jd_targets IS 'Multiple Job Descriptions targeted by a single CV. Used for cross-JD comparison.';

CREATE INDEX IF NOT EXISTS idx_jd_targets_cv ON jd_targets(cv_id);
CREATE INDEX IF NOT EXISTS idx_jd_targets_user ON jd_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_jd_targets_embedding
  ON jd_targets
  USING ivfflat (jd_embedding vector_cosine_ops)
  WITH (lists = 100);

-- updated_at trigger (reuse pattern from cv_workflow)
CREATE OR REPLACE FUNCTION update_jd_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_jd_targets_updated_at ON jd_targets;
CREATE TRIGGER trigger_update_jd_targets_updated_at
  BEFORE UPDATE ON jd_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_jd_targets_updated_at();

-- RLS
ALTER TABLE jd_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_jd_targets" ON jd_targets;
CREATE POLICY "own_jd_targets" ON jd_targets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4) match_runs — cache & audit log of every method execution
-- =============================================================================
-- Both for production (don't recompute LLM cost) and for evaluation harness
-- (replays from this table for analysis without re-paying API cost).
CREATE TABLE IF NOT EXISTS match_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id TEXT NOT NULL,
  jd_target_id UUID REFERENCES jd_targets(id) ON DELETE CASCADE,

  method VARCHAR(16) NOT NULL CHECK (method IN ('tfidf', 'embedding', 'llm')),
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),

  matched_keywords TEXT[],
  missing_keywords TEXT[],
  section_scores JSONB,            -- {skills: 85, experience: 78, ...}
  raw_payload JSONB,               -- full method output (for debugging/eval)

  latency_ms INTEGER,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  tokens_used INTEGER,

  -- Eval-harness fields (NULL for production runs)
  eval_run_id TEXT,                -- e.g. "kaggle-2026-05-04-seed42"
  ground_truth_label NUMERIC(3,2), -- 0.0–1.0 if known, else NULL

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE match_runs IS 'Cache + audit of every (CV, JD, method) execution. Used by /api/cv/match for cache lookup and by evaluation harness for offline analysis.';
COMMENT ON COLUMN match_runs.eval_run_id IS 'NULL for production app traffic; set to a run-id during offline evaluation runs.';

CREATE INDEX IF NOT EXISTS idx_match_runs_lookup
  ON match_runs(cv_id, jd_target_id, method);
CREATE INDEX IF NOT EXISTS idx_match_runs_eval
  ON match_runs(eval_run_id) WHERE eval_run_id IS NOT NULL;

-- RLS — users can only see their own match runs
ALTER TABLE match_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_match_runs" ON match_runs;
CREATE POLICY "own_match_runs" ON match_runs
  FOR ALL
  USING (
    -- Allow if the linked CV belongs to the user, OR row has no jd_target (eval rows)
    EXISTS (
      SELECT 1 FROM cv_workflow
      WHERE cv_workflow.id = match_runs.cv_id
        AND cv_workflow.user_id = auth.uid()
    )
  );

-- Service-role bypass for eval scripts (the service role bypasses RLS by default,
-- but we declare an explicit policy for clarity).
DROP POLICY IF EXISTS "service_role_all_match_runs" ON match_runs;
CREATE POLICY "service_role_all_match_runs" ON match_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 5) ANALYZE so ivfflat indexes have stats (do this after first bulk insert too)
-- =============================================================================
ANALYZE cv_workflow;
ANALYZE jd_targets;

-- =============================================================================
-- 6) Verification — run these and confirm rows returned look right
-- =============================================================================

-- 6a) Confirm new columns on cv_workflow
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cv_workflow'
  AND column_name IN ('cv_embedding', 'cv_embedding_hash', 'cv_embedding_updated_at');

-- 6b) Confirm new tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('jd_targets', 'match_runs');

-- 6c) Confirm pgvector indexes
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('idx_cv_workflow_embedding', 'idx_jd_targets_embedding');

-- 6d) Confirm RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('jd_targets', 'match_runs');

-- 6e) Confirm RLS policies present
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('jd_targets', 'match_runs');
