-- Migration: Add job_postings table for RAG search corpus
-- Date: 2026-05-21
-- Apply via Supabase SQL Editor
-- Idempotent (safe to re-run)

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  jd_text TEXT NOT NULL,
  jd_embedding vector(1536),
  source TEXT DEFAULT 'kaggle_eval',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_embedding
  ON job_postings
  USING ivfflat (jd_embedding vector_cosine_ops)
  WITH (lists = 50);

COMMENT ON TABLE job_postings IS 'JD corpus for RAG job search pipeline';
COMMENT ON COLUMN job_postings.jd_embedding IS 'OpenAI text-embedding-3-small 1536-dim';
