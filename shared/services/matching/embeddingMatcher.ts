/**
 * Embedding matcher — semantic baseline for thesis comparison.
 *
 * Uses OpenAI `text-embedding-3-small` (1536-dim) and cosine similarity.
 *
 * 2026-05-12: Switched from Voyage voyage-3 → OpenAI text-embedding-3-small.
 * Voyage free tier (3 RPM) was too slow for 676-text corpus; OpenAI has
 * higher rate limits and the user's API key is already provisioned.
 * Pricing: $0.02 / 1M tokens — full corpus ~$0.024 (one-time).
 *
 * Two ways to use:
 *
 *   1. Single-pair production:
 *        const m = new EmbeddingMatcher()
 *        const r = await m.score(cvText, jdText)
 *
 *   2. Pre-computed (eval / corpus mode):
 *        const cvVec = await m.embed(cvText)
 *        const jdVec = await m.embed(jdText)
 *        const r = m.scoreFromVectors(cvVec, jdVec, latencyMs)
 *
 * The cache (sha256(text) -> vector) is opt-in: pass a `cache` Map and
 * the matcher will reuse vectors instead of re-calling the API. The
 * evaluation harness (D4) wires this to a JSON file on disk.
 */

import { createHash } from 'node:crypto'
import { MatchResult } from './types'

const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings'
const DEFAULT_MODEL = 'text-embedding-3-small'
export const EMBED_DIM = 1536

// OpenAI embedding pricing as of 2026-05 — https://openai.com/api/pricing/
const OPENAI_EMBED_PRICING_USD = {
  'text-embedding-3-small': 0.02 / 1_000_000,
  'text-embedding-3-large': 0.13 / 1_000_000,
  'text-embedding-ada-002': 0.10 / 1_000_000,
} as const

export interface EmbeddingCache {
  get(hash: string): number[] | undefined
  set(hash: string, vec: number[]): void
}

/** Simple Map-backed cache. The eval harness can swap this for a disk-backed one. */
export class InMemoryCache implements EmbeddingCache {
  private map = new Map<string, number[]>()
  get(h: string) { return this.map.get(h) }
  set(h: string, v: number[]) { this.map.set(h, v) }
  size() { return this.map.size }
  toJSON(): Record<string, number[]> { return Object.fromEntries(this.map) }
  static fromJSON(j: Record<string, number[]>): InMemoryCache {
    const c = new InMemoryCache()
    for (const [k, v] of Object.entries(j)) c.map.set(k, v)
    return c
  }
}

export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

// =============================================================================
// Cosine similarity (dense, fixed-dim vectors)
// =============================================================================

export function cosineSimDense(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dim mismatch: ${a.length} vs ${b.length}`)
  }
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// =============================================================================
// Matcher
// =============================================================================

export interface EmbeddingMatcherOptions {
  apiKey?: string                      // defaults to env OPENAI_API_KEY
  model?: string                       // defaults to text-embedding-3-small
  cache?: EmbeddingCache               // optional sha256→vector cache
  timeoutMs?: number                   // default 30s
}

export class EmbeddingMatcher {
  private apiKey: string
  private model: string
  private cache?: EmbeddingCache
  private timeoutMs: number

  constructor(opts: EmbeddingMatcherOptions = {}) {
    this.apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY ?? ''
    this.model = opts.model ?? DEFAULT_MODEL
    this.cache = opts.cache
    this.timeoutMs = opts.timeoutMs ?? 30_000
  }

  /**
   * Embed a single text. Uses cache if provided.
   * Returns { vec, cached, tokensUsed, costUsd, latencyMs }.
   */
  async embed(text: string): Promise<{
    vec: number[]
    cached: boolean
    tokensUsed: number
    costUsd: number
    latencyMs: number
    hash: string
  }> {
    const start = Date.now()
    const hash = hashText(text)

    if (this.cache) {
      const cached = this.cache.get(hash)
      if (cached) {
        return {
          vec: cached,
          cached: true,
          tokensUsed: 0,
          costUsd: 0,
          latencyMs: Date.now() - start,
          hash,
        }
      }
    }

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY missing — required for embedding matcher')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)
    let resp: Response
    try {
      resp = await fetch(OPENAI_EMBED_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({} as any))
      throw new Error(
        `OpenAI embedding error ${resp.status}: ${err?.error?.message || resp.statusText}`
      )
    }

    const data = await resp.json() as {
      data: { embedding: number[]; index: number }[]
      usage: { prompt_tokens: number; total_tokens: number }
      model: string
    }
    const vec = data.data?.[0]?.embedding
    const tokensUsed = data.usage?.total_tokens ?? 0
    if (!vec || vec.length !== EMBED_DIM) {
      throw new Error(`Bad embedding response: dim=${vec?.length}, expected ${EMBED_DIM}`)
    }

    if (this.cache) this.cache.set(hash, vec)

    const pricePerToken = (OPENAI_EMBED_PRICING_USD as Record<string, number>)[this.model] ?? OPENAI_EMBED_PRICING_USD['text-embedding-3-small']
    return {
      vec,
      cached: false,
      tokensUsed,
      costUsd: tokensUsed * pricePerToken,
      latencyMs: Date.now() - start,
      hash,
    }
  }

  /**
   * Score a (CV, JD) pair end-to-end. Embeds both texts (with cache) and
   * returns a normalized 0–100 MatchResult.
   */
  async score(cvText: string, jdText: string): Promise<MatchResult> {
    const start = Date.now()
    const cv = await this.embed(cvText)
    const jd = await this.embed(jdText)
    const sim = cosineSimDense(cv.vec, jd.vec)        // 0–1 (typically 0.3–0.9)
    const score = Math.round(sim * 10000) / 100       // 0–100, 2dp

    return {
      method: 'embedding',
      score,
      // Embeddings don't expose explicit keyword overlap; leave undefined so
      // downstream UI can show "—" rather than fake data.
      latencyMs: Date.now() - start,
      costUsd: cv.costUsd + jd.costUsd,
      tokensUsed: cv.tokensUsed + jd.tokensUsed,
      cached: cv.cached && jd.cached,
      computedAt: new Date().toISOString(),
      extras: {
        cosineSimilarity: sim,
        model: this.model,
        cvCached: cv.cached,
        jdCached: jd.cached,
        cvHash: cv.hash,
        jdHash: jd.hash,
      },
    }
  }

  get modelName(): string { return this.model }

  /**
   * Score from already-computed vectors. Used by the evaluation harness
   * to avoid re-embedding when running 3 methods × 400 pairs.
   */
  scoreFromVectors(cvVec: number[], jdVec: number[]): MatchResult {
    const start = Date.now()
    const sim = cosineSimDense(cvVec, jdVec)
    const score = Math.round(sim * 10000) / 100
    return {
      method: 'embedding',
      score,
      latencyMs: Date.now() - start,
      costUsd: 0,                    // assumed pre-paid
      cached: true,
      computedAt: new Date().toISOString(),
      extras: { cosineSimilarity: sim, model: this.model },
    }
  }
}
