/**
 * Seed job_postings table from data/eval/pairs.json + embeddings_cache.json
 *
 * Usage:
 *   npx tsx scripts/seed-job-postings.ts
 *
 * Prerequisites:
 *   1. Apply scripts/migrations/2026-job-postings.sql in Supabase SQL Editor
 *   2. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local
 *
 * Behaviour:
 *   - Deduplicates JDs by full jdText (303 unique from 400 pairs)
 *   - Looks up embeddings from embeddings_cache.json (sha256 keyed)
 *   - Inserts in batches of 50 to avoid Supabase timeout
 *   - Skips entirely if job_postings already has rows (idempotent guard)
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import * as fs from 'node:fs'
import * as path from 'node:path'
import { createHash } from 'node:crypto'
import { getServiceRoleSupabaseClient } from '../lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EvalPair {
  pairId: string
  resumeId: string
  resumeCategory: string
  resumeText: string
  jdTitle: string
  jdCategory: string
  jdText: string
  label: number
}

interface JobPostingRow {
  title: string
  category: string
  jd_text: string
  jd_embedding: number[] | null
  source: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const DATA_DIR = path.join(process.cwd(), 'data', 'eval')
  const PAIRS_PATH = path.join(DATA_DIR, 'pairs.json')
  const CACHE_PATH = path.join(DATA_DIR, 'embeddings_cache.json')
  const BATCH_SIZE = 50

  // 1. Load pairs
  console.log(`Loading pairs from ${PAIRS_PATH} ...`)
  const pairs: EvalPair[] = JSON.parse(fs.readFileSync(PAIRS_PATH, 'utf-8'))
  console.log(`  Loaded ${pairs.length} pairs`)

  // 2. Deduplicate JDs by full jdText
  const uniqueJDs = new Map<string, EvalPair>()
  for (const pair of pairs) {
    if (!uniqueJDs.has(pair.jdText)) {
      uniqueJDs.set(pair.jdText, pair)
    }
  }
  const totalUnique = uniqueJDs.size
  console.log(`  ${totalUnique} unique JDs (deduplicated by full jdText)`)

  // 3. Load embeddings cache
  console.log(`Loading embeddings cache from ${CACHE_PATH} ...`)
  const embeddingsCache: Record<string, number[]> = JSON.parse(
    fs.readFileSync(CACHE_PATH, 'utf-8')
  )
  console.log(`  ${Object.keys(embeddingsCache).length} cached embeddings`)

  // 4. Build rows
  let withEmbedding = 0
  let withoutEmbedding = 0
  const rows: JobPostingRow[] = []

  for (const [jdText, pair] of uniqueJDs) {
    const hash = hashText(jdText)
    const embedding = embeddingsCache[hash] ?? null

    if (embedding) {
      withEmbedding++
    } else {
      withoutEmbedding++
    }

    rows.push({
      title: pair.jdTitle,
      category: pair.jdCategory,
      jd_text: jdText,
      jd_embedding: embedding,
      source: 'kaggle_eval',
    })
  }

  console.log(`  ${withEmbedding} JDs with cached embeddings`)
  console.log(`  ${withoutEmbedding} JDs without embeddings (will insert as NULL)`)

  // 5. Connect to Supabase
  const supabase = getServiceRoleSupabaseClient()
  if (!supabase) {
    console.error('ERROR: Could not initialise Supabase service role client.')
    console.error('  Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  // 6. Check if table already has rows (idempotency guard)
  const { count, error: countError } = await supabase
    .from('job_postings')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('ERROR: Could not query job_postings table:', countError.message)
    console.error('  Did you apply the migration in the Supabase SQL Editor?')
    process.exit(1)
  }

  if (count && count > 0) {
    console.warn(`WARNING: job_postings already contains ${count} rows. Skipping seed to avoid duplicates.`)
    console.warn('  If you want to re-seed, truncate the table first:')
    console.warn('    TRUNCATE TABLE job_postings;')
    process.exit(0)
  }

  // 7. Batch insert
  console.log(`Inserting ${rows.length} rows in batches of ${BATCH_SIZE} ...`)
  const batches = chunkArray(rows, BATCH_SIZE)
  let totalInserted = 0
  let totalErrors = 0

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const { error } = await supabase.from('job_postings').insert(batch)

    if (error) {
      console.error(`  Batch ${i + 1}/${batches.length} FAILED: ${error.message}`)
      totalErrors += batch.length
    } else {
      totalInserted += batch.length
      process.stdout.write(`  Batch ${i + 1}/${batches.length}: inserted ${batch.length} rows (running total: ${totalInserted})\n`)
    }
  }

  // 8. Summary
  console.log('\n=== Seed complete ===')
  console.log(`  Total unique JDs:         ${totalUnique}`)
  console.log(`  JDs with embeddings:      ${withEmbedding}`)
  console.log(`  JDs without embeddings:   ${withoutEmbedding}`)
  console.log(`  Successfully inserted:    ${totalInserted}`)
  if (totalErrors > 0) {
    console.error(`  Failed (errors):          ${totalErrors}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
