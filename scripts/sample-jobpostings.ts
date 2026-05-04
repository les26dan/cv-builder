/**
 * Sample LinkedIn JobPostings.csv (~517MB, ~120K rows) down to a manageable
 * file for thesis evaluation.
 *
 * Strategy:
 *   - Stream the source CSV (no full load → no OOM)
 *   - Reservoir-sample N rows uniformly (seed=42, deterministic)
 *   - Filter: must have non-empty `title` + `description` ≥ 100 chars
 *   - Write to JobPostings.sampled.csv (kept committed-friendly small ~5K rows)
 *
 * Run once after first download; downstream loaders read the sampled file.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { parse } from 'csv-parse'

const KAGGLE_DIR = path.resolve(process.cwd(), 'data/kaggle')
const SOURCE = path.join(KAGGLE_DIR, 'JobPostings.csv')
const TARGET = path.join(KAGGLE_DIR, 'JobPostings.sampled.csv')

const TARGET_SIZE = 5000
const SEED = 42

// Mulberry32 PRNG — small, deterministic, good-enough.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Missing ${SOURCE}`)
    process.exit(1)
  }

  const rng = mulberry32(SEED)
  const reservoir: Record<string, string>[] = []
  let seen = 0

  const parser = fs.createReadStream(SOURCE).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      relax_quotes: true,
    })
  )

  for await (const row of parser as AsyncIterable<Record<string, string>>) {
    const title = (row.title || '').trim()
    const desc = (row.description || '').trim()
    if (!title || desc.length < 100) continue

    if (reservoir.length < TARGET_SIZE) {
      reservoir.push(row)
    } else {
      const j = Math.floor(rng() * (seen + 1))
      if (j < TARGET_SIZE) reservoir[j] = row
    }
    seen++
    if (seen % 10000 === 0) {
      process.stdout.write(`\r  scanned ${seen.toLocaleString()} rows, kept ${reservoir.length}`)
    }
  }
  console.log(`\n✓ Scanned ${seen.toLocaleString()} valid rows; sampled ${reservoir.length}.`)

  // Write CSV (RFC-4180 compatible)
  const cols = Object.keys(reservoir[0])
  const escape = (v: string) => {
    if (v == null) return ''
    const s = String(v)
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines: string[] = [cols.join(',')]
  for (const r of reservoir) lines.push(cols.map(c => escape(r[c] ?? '')).join(','))
  fs.writeFileSync(TARGET, lines.join('\n'), 'utf8')

  const stat = fs.statSync(TARGET)
  console.log(`✓ Wrote ${TARGET} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
