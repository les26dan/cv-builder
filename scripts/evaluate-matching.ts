/**
 * Run all 3 matchers against data/eval/pairs.json and write results.csv.
 *
 *   npx tsx scripts/evaluate-matching.ts                       # all methods
 *   npx tsx scripts/evaluate-matching.ts --methods tfidf,embedding  # skip LLM
 *   npx tsx scripts/evaluate-matching.ts --resume              # skip rows already in CSV
 *   npx tsx scripts/evaluate-matching.ts --limit 20            # quick smoke
 *
 * Inputs:
 *   data/eval/pairs.json              (400 labeled pairs)
 *   data/eval/embeddings_cache.json   (D4 output — required for 'embedding')
 *
 * Output:
 *   data/eval/results.csv             one row per (pair × method) = 1200 rows
 *     columns: pairId, label, method, score, predictedRelevant,
 *              latencyMs, costUsd, tokensUsed, error, computedAt
 *
 * Budget guard:
 *   Env LLM_MAX_SPEND_USD (default 5; OPENAI_MAX_SPEND_USD also accepted for back-compat).
 *   Aborts before each LLM call if
 *   cumulative LLM cost would exceed this. Other methods are free/cached
 *   and don't count.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import * as fs from 'node:fs'
import * as path from 'node:path'
import { TfidfMatcher } from '../shared/services/matching/tfidfMatcher'
import {
  EmbeddingMatcher,
  cosineSimDense,
  hashText,
  EMBED_DIM,
} from '../shared/services/matching/embeddingMatcher'
import { LLMMatcher } from '../shared/services/matching/llmMatcher'
import { MatchResult, MethodName } from '../shared/services/matching/types'

// =============================================================================
// CLI args
// =============================================================================

interface Args {
  pairs: string
  embeddingsCache: string
  out: string
  methods: MethodName[]
  resume: boolean
  limit: number
  threshold: number
  budgetUsd: number
}

function parseArgs(): Args {
  const a = process.argv.slice(2)
  const get = (flag: string, fb?: string) => {
    const i = a.indexOf(flag); return i >= 0 ? a[i + 1] : fb
  }
  const methodsRaw = get('--methods', 'tfidf,embedding,llm')!
  const methods = methodsRaw.split(',').map(s => s.trim()).filter(Boolean) as MethodName[]
  for (const m of methods) {
    if (!['tfidf', 'embedding', 'llm'].includes(m)) {
      console.error(`Unknown method: ${m}`); process.exit(1)
    }
  }
  return {
    pairs: get('--pairs', 'data/eval/pairs.json')!,
    embeddingsCache: get('--embeddings-cache', 'data/eval/embeddings_cache.json')!,
    out: get('--out', 'data/eval/results.csv')!,
    methods,
    resume: a.includes('--resume'),
    limit: parseInt(get('--limit', '0')!, 10),  // 0 = no limit
    threshold: parseFloat(get('--threshold', '50')!),
    budgetUsd: parseFloat(get('--budget',
      process.env.LLM_MAX_SPEND_USD || process.env.OPENAI_MAX_SPEND_USD || '5')!),
  }
}

// =============================================================================
// Schema
// =============================================================================

interface EvalPair {
  pairId: string
  resumeText: string
  jdText: string
  label: 0 | 1
}

interface ResultRow {
  pairId: string
  label: 0 | 1
  method: MethodName
  score: number
  predictedRelevant: 0 | 1
  latencyMs: number
  costUsd: number
  tokensUsed: number
  error: string
  computedAt: string
}

const CSV_HEADER = 'pairId,label,method,score,predictedRelevant,latencyMs,costUsd,tokensUsed,error,computedAt'

function escapeCsv(v: string | number): string {
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowToCsv(r: ResultRow): string {
  return [
    r.pairId, r.label, r.method, r.score, r.predictedRelevant,
    r.latencyMs, r.costUsd, r.tokensUsed, r.error, r.computedAt,
  ].map(escapeCsv).join(',')
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = parseArgs()

  // ---------------------------------------------------------------------------
  // Load pairs
  // ---------------------------------------------------------------------------
  const pairsPath = path.resolve(process.cwd(), args.pairs)
  const pairs: EvalPair[] = JSON.parse(fs.readFileSync(pairsPath, 'utf8'))
  const todoPairs = args.limit > 0 ? pairs.slice(0, args.limit) : pairs
  console.log(`Loaded ${pairs.length} pairs; processing ${todoPairs.length}`)
  console.log(`Methods: ${args.methods.join(', ')}`)
  console.log(`Threshold for binary relevance: score ≥ ${args.threshold}\n`)

  // ---------------------------------------------------------------------------
  // Init matchers (only those requested)
  // ---------------------------------------------------------------------------
  let tfidf: TfidfMatcher | null = null
  let embeddingsCache: Record<string, number[]> | null = null
  let embedder: EmbeddingMatcher | null = null
  let llm: LLMMatcher | null = null

  if (args.methods.includes('tfidf')) {
    // Build corpus IDF over all JDs in the eval set — the IR-textbook way.
    const corpus = pairs.map(p => p.jdText)
    tfidf = TfidfMatcher.fromCorpus(corpus)
    console.log(`✓ TF-IDF initialized (corpus IDF over ${corpus.length} JDs)`)
  }

  if (args.methods.includes('embedding')) {
    const cachePath = path.resolve(process.cwd(), args.embeddingsCache)
    if (!fs.existsSync(cachePath)) {
      console.error(`Embeddings cache missing: ${cachePath}`)
      console.error(`Run scripts/embed-corpus.ts first.`)
      process.exit(1)
    }
    embeddingsCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
    embedder = new EmbeddingMatcher()
    console.log(`✓ Embedding cache loaded (${Object.keys(embeddingsCache!).length} vectors)`)
  }

  if (args.methods.includes('llm')) {
    if (!process.env.OPENAI_API_KEY) {
      console.error(`OPENAI_API_KEY missing — required for 'llm' method`)
      console.error(`Set it in .env.local, or run with --methods tfidf,embedding to skip LLM`)
      process.exit(1)
    }
    llm = new LLMMatcher({ language: 'en' })
    console.log(`✓ LLM matcher initialized (budget cap $${args.budgetUsd})`)
  }

  // ---------------------------------------------------------------------------
  // Resume support — load existing results so we can skip done rows
  // ---------------------------------------------------------------------------
  const outPath = path.resolve(process.cwd(), args.out)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  const done = new Set<string>()  // key: `${pairId}::${method}`
  if (args.resume && fs.existsSync(outPath)) {
    const lines = fs.readFileSync(outPath, 'utf8').split('\n')
    for (const line of lines.slice(1)) {       // skip header
      if (!line.trim()) continue
      const [pairId, , method] = line.split(',')
      done.add(`${pairId}::${method}`)
    }
    console.log(`Resume: skipping ${done.size} already-computed (pair × method) rows`)
  }

  // Open output for append (or write header if new file)
  const writeHeader = !fs.existsSync(outPath) || !args.resume
  if (writeHeader) fs.writeFileSync(outPath, CSV_HEADER + '\n')
  const sink = fs.createWriteStream(outPath, { flags: 'a' })

  // ---------------------------------------------------------------------------
  // Process pairs
  // ---------------------------------------------------------------------------
  let llmCostUsd = 0
  let processed = 0
  const t0 = Date.now()

  for (const pair of todoPairs) {
    processed++
    const prefix = `[${processed}/${todoPairs.length}] ${pair.pairId} label=${pair.label}`

    for (const method of args.methods) {
      const key = `${pair.pairId}::${method}`
      if (done.has(key)) continue

      let result: MatchResult | null = null
      let error = ''
      const startedAt = Date.now()

      try {
        if (method === 'tfidf' && tfidf) {
          result = tfidf.score(pair.resumeText, pair.jdText)
        } else if (method === 'embedding' && embedder && embeddingsCache) {
          const cvHash = hashText(pair.resumeText)
          const jdHash = hashText(pair.jdText)
          const cvVec = embeddingsCache[cvHash]
          const jdVec = embeddingsCache[jdHash]
          if (!cvVec || cvVec.length !== EMBED_DIM) {
            throw new Error(`CV vector missing in cache (hash ${cvHash.slice(0, 8)})`)
          }
          if (!jdVec || jdVec.length !== EMBED_DIM) {
            throw new Error(`JD vector missing in cache (hash ${jdHash.slice(0, 8)})`)
          }
          const tEmb = Date.now()
          const sim = cosineSimDense(cvVec, jdVec)
          result = {
            method: 'embedding',
            score: Math.round(sim * 10000) / 100,
            latencyMs: Date.now() - tEmb,
            costUsd: 0,                       // already paid during D4
            cached: true,
            computedAt: new Date().toISOString(),
            extras: { cosineSimilarity: sim },
          }
        } else if (method === 'llm' && llm) {
          if (llmCostUsd >= args.budgetUsd) {
            throw new Error(`Budget $${args.budgetUsd} exhausted; cumulative LLM spend $${llmCostUsd.toFixed(4)}`)
          }
          result = await llm.score(pair.resumeText, pair.jdText)
          llmCostUsd += result.costUsd
        }
      } catch (e: any) {
        error = e?.message ?? String(e)
      }

      const row: ResultRow = {
        pairId: pair.pairId,
        label: pair.label,
        method,
        score: result?.score ?? -1,
        predictedRelevant: (result && result.score >= args.threshold) ? 1 : 0,
        latencyMs: result?.latencyMs ?? (Date.now() - startedAt),
        costUsd: result?.costUsd ?? 0,
        tokensUsed: result?.tokensUsed ?? 0,
        error,
        computedAt: result?.computedAt ?? new Date().toISOString(),
      }
      sink.write(rowToCsv(row) + '\n')
    }

    if (processed % 25 === 0) {
      const elapsedS = (Date.now() - t0) / 1000
      const rate = processed / elapsedS
      const remaining = (todoPairs.length - processed) / rate
      console.log(`${prefix} | done=${processed} rate=${rate.toFixed(2)}/s ETA=${(remaining / 60).toFixed(1)}min llm=$${llmCostUsd.toFixed(4)}`)
    }
  }

  sink.end()
  await new Promise<void>(r => sink.on('close', () => r()))

  const elapsed = (Date.now() - t0) / 1000
  console.log(`\nDone in ${elapsed.toFixed(1)}s`)
  console.log(`  pairs:    ${processed}`)
  console.log(`  LLM cost: $${llmCostUsd.toFixed(4)}`)
  console.log(`  output:   ${args.out}`)
}

main().catch(e => { console.error(e); process.exit(1) })
