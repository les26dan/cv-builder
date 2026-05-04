-- =============================================================================
-- Pre-migration probe: Check pgvector availability on Supabase
-- =============================================================================
-- Run this in Supabase SQL Editor BEFORE applying 2026-add-matching-engine.sql.
-- Purpose: confirm pgvector is installed (or installable) on this project.
--
-- Expected output:
--   1. ext_available row → vector extension is in pg_available_extensions
--   2. ext_installed row → currently in pg_extension (may be empty initially)
--   3. After CREATE EXTENSION: should be 1 row in pg_extension
-- =============================================================================

-- 1) Is pgvector available to install on this Supabase plan?
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'vector';

-- 2) Is it already installed?
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'vector';

-- 3) Try installing (idempotent — safe to re-run)
CREATE EXTENSION IF NOT EXISTS vector;

-- 4) Verify it took
SELECT extname, extversion AS installed_version
FROM pg_extension
WHERE extname = 'vector';

-- 5) Functional test: create a vector column, insert, run cosine
DO $$
BEGIN
  CREATE TEMP TABLE _pgvector_probe (id INT, v vector(3));
  INSERT INTO _pgvector_probe VALUES (1, '[1,2,3]'::vector), (2, '[1,2,4]'::vector);
  PERFORM 1 - (a.v <=> b.v) AS cosine_sim
  FROM _pgvector_probe a, _pgvector_probe b
  WHERE a.id = 1 AND b.id = 2;
  RAISE NOTICE 'pgvector probe OK — cosine operator <=> works';
END $$;
