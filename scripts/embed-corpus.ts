/**
 * Embed all unique texts in data/eval/pairs.json into a disk-backed cache.
 *
 *   npx tsx scripts/embed-corpus.ts                    # embed all uncached texts
 *   npx tsx scripts/embed-corpus.ts --dry-run          # show plan + cost estimate, no API calls
 *   npx tsx scripts/embed-corpus.ts --pairs other.json # use a different pairs file
 *   npx tsx scripts/embed-corpus.ts --batch 16         # smaller batches (default 32)
 *
 * Output: data/eval/embeddings_cache.json
 *   { "<sha256>": [<1536 floats>], ... }
 *
 * Idempotent: re-running picks up only texts not already in the cache.
 * The cache is shared across eval methods that need pre-computed vectors
 * (currently: embedding method in D5 harness).
 *
 * 2026-05-12: Switched from Voyage to OpenAI text-embedding-3-small.
 * Existing Voyage cache (1024-dim) is incompatible — DELETE the cache file
 * before re-running this script. The script will detect dim mismatch and
 * re-embed any vectors that don't match EMBED_DIM (1536) automatically.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import * as fs from 'node:fs'
import * as path from 'node:path'
import { EmbeddingMatcher, hashText, EMBED_DIM } from '../shared/services/matching/embeddingMatcher'

// =============================================================================
// CLI args
// =============================================================================

interface Args {
  pairs: string
  out: string
  batch: number
  dryRun: boolean
  budgetUsd: number
  sleepMs: number
}

function parseArgs(): Args {
  const a = process.argv.slice(2)
  const get = (flag: string, fb?: string) => {
    const i = a.indexOf(flag); return i >= 0 ? a[i + 1] : fb
  }
  return {
    pairs: get('--pairs', 'data/eval/pairs.json')!,
    out: get('--out', 'data/eval/embeddings_cache.json')!,
    // OpenAI embeddings: tier 1 = 3000 RPM, 1M TPM. batch=128 is the max
    // OpenAI accepts per request. 676 texts / 128 ≈ 6 batches, no sleep needed.
    batch: parseInt(get('--batch', '128')!, 10),
    sleepMs: parseInt(get('--sleep-ms', '0')!, 10),
    dryRun: a.includes('--dry-run'),
    budgetUsd: parseFloat(get('--budget', '10')!),
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// =============================================================================
// Pair schema (mirror of scripts/build-ground-truth.ts EvalPair)
// =============================================================================

interface EvalPair {
  pairId: string
  resumeText: string
  jdText: string
}

// =============================================================================
// OpenAI batch endpoint — embed up to 2048 inputs per call (we use 128 to
// stay well under TPM caps and to flush partial progress more often)
// =============================================================================

interface OpenAIBatchResult {
  vectors: number[][]
  totalTokens: number
  latencyMs: number
}

async function openaiBatchEmbed(
  texts: string[],
  apiKey: string,
  model: string,
): Promise<OpenAIBatchResult> {
  const start = Date.now()
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: texts,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`OpenAI batch error ${resp.status}: ${err}`)
  }
  const data = await resp.json() as {
    data: { embedding: number[]; index: number }[]
    usage: { prompt_tokens: number; total_tokens: number }
  }
  // OpenAI returns ordered by index, but we re-sort defensively.
  const vectors = new Array<number[]>(texts.length)
  for (const d of data.data) {
    if (d.embedding.length !== EMBED_DIM) {
      throw new Error(`Bad dim ${d.embedding.length} at index ${d.index}`)
    }
    vectors[d.index] = d.embedding
  }
  return {
    vectors,
    totalTokens: data.usage.total_tokens,
    latencyMs: Date.now() - start,
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = parseArgs()

  // ---------------------------------------------------------------------------
  // 1) Load pairs.json, collect unique texts
  // ---------------------------------------------------------------------------
  const pairsPath = path.resolve(process.cwd(), args.pairs)
  if (!fs.existsSync(pairsPath)) {
    console.error(`Pairs file not found: ${pairsPath}`)
    console.error(`Run scripts/build-ground-truth.ts first.`)
    process.exit(1)
  }
  const pairs: EvalPair[] = JSON.parse(fs.readFileSync(pairsPath, 'utf8'))
  console.log(`Loaded ${pairs.length} pairs from ${args.pairs}`)

  // Deduplicate texts by sha256. Same text appearing in N pairs = embed once.
  const textByHash = new Map<string, string>()
  for (const p of pairs) {
    textByHash.set(hashText(p.resumeText), p.resumeText)
    textByHash.set(hashText(p.jdText), p.jdText)
  }
  console.log(`Unique texts: ${textByHash.size} (${pairs.length * 2} text references, ${(100 * textByHash.size / (pairs.length * 2)).toFixed(1)}% unique)`)

  // ---------------------------------------------------------------------------
  // 2) Load existing cache, identify what's missing
  // ---------------------------------------------------------------------------
  const outPath = path.resolve(process.cwd(), args.out)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  let cache: Record<string, number[]> = {}
  if (fs.existsSync(outPath)) {
    cache = JSON.parse(fs.readFileSync(outPath, 'utf8'))
    console.log(`Existing cache: ${Object.keys(cache).length} vectors`)
  }

  const needed: Array<{ hash: string; text: string }> = []
  for (const [hash, text] of textByHash) {
    if (!cache[hash] || cache[hash].length !== EMBED_DIM) {
      needed.push({ hash, text })
    }
  }
  console.log(`Need to embed: ${needed.length}`)

  if (needed.length === 0) {
    console.log('All texts already cached. Nothing to do.')
    return
  }

  // ---------------------------------------------------------------------------
  // 3) Cost estimate (rough — OpenAI tokens ≈ chars / 4 for English)
  // ---------------------------------------------------------------------------
  const approxTokens = needed.reduce((s, x) => s + Math.ceil(x.text.length / 4), 0)
  const OPENAI_EMBED_PRICE = 0.02 / 1_000_000
  const estCost = approxTokens * OPENAI_EMBED_PRICE
  console.log(`Estimated tokens: ~${approxTokens.toLocaleString()}`)
  console.log(`Estimated cost:   ~$${estCost.toFixed(4)} (text-embedding-3-small @ $0.02/1M tokens)`)

  if (estCost > args.budgetUsd) {
    console.error(`Estimated cost exceeds --budget ${args.budgetUsd}. Aborting.`)
    process.exit(1)
  }

  if (args.dryRun) {
    console.log('\n--dry-run: stopping here. Drop the flag to actually embed.')
    return
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY missing in .env.local')
    process.exit(1)
  }
  const matcher = new EmbeddingMatcher()  // for model name only

  // ---------------------------------------------------------------------------
  // 4) Embed in batches; save cache incrementally after each batch
  // ---------------------------------------------------------------------------
  let totalTokens = 0
  let totalLatencyMs = 0
  let totalCost = 0
  const t0 = Date.now()

  for (let i = 0; i < needed.length; i += args.batch) {
    const slice = needed.slice(i, i + args.batch)
    const batchNum = Math.floor(i / args.batch) + 1
    const totalBatches = Math.ceil(needed.length / args.batch)

    process.stdout.write(`  batch ${batchNum}/${totalBatches} (${slice.length} texts)… `)
    let result: OpenAIBatchResult
    try {
      result = await openaiBatchEmbed(
        slice.map(s => s.text),
        process.env.OPENAI_API_KEY!,
        matcher.modelName,
      )
    } catch (e: any) {
      console.log(`FAIL — ${e.message}`)
      console.log('Saving partial cache and aborting.')
      fs.writeFileSync(outPath, JSON.stringify(cache, null, 2))
      process.exit(1)
    }

    for (let j = 0; j < slice.length; j++) {
      cache[slice[j].hash] = result.vectors[j]
    }
    totalTokens += result.totalTokens
    totalLatencyMs += result.latencyMs
    totalCost += result.totalTokens * OPENAI_EMBED_PRICE

    console.log(`${result.latencyMs}ms  tokens=${result.totalTokens}  cumul cost=$${totalCost.toFixed(4)}`)

    // Save after every batch — crash-safe.
    fs.writeFileSync(outPath, JSON.stringify(cache, null, 2))

    // Hard budget guard.
    if (totalCost > args.budgetUsd) {
      console.error(`Hit --budget $${args.budgetUsd}. Saving and stopping.`)
      break
    }

    // Optional throttle. OpenAI tier 1 has 3000 RPM — usually not needed.
    if (i + args.batch < needed.length && args.sleepMs > 0) {
      await sleep(args.sleepMs)
    }
  }

  // ---------------------------------------------------------------------------
  // 5) Summary
  // ---------------------------------------------------------------------------
  const wallMs = Date.now() - t0
  console.log(`\nDone in ${(wallMs / 1000).toFixed(1)}s`)
  console.log(`  vectors cached:   ${Object.keys(cache).length}`)
  console.log(`  tokens consumed:  ${totalTokens.toLocaleString()}`)
  console.log(`  API latency sum:  ${(totalLatencyMs / 1000).toFixed(1)}s`)
  console.log(`  cost:             $${totalCost.toFixed(4)}`)
  console.log(`  cache file:       ${args.out} (${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB)`)
}

main().catch(e => { console.error(e); process.exit(1) })
