/**
 * TF-IDF matcher — lexical baseline for thesis comparison.
 *
 * Improvements over the inline keyword extractor in
 * `app/api/cv/jd-analyze/route.ts:75-87`:
 *
 *  1. **Corpus-IDF**: IDF computed across the JD corpus (or `idfStats`
 *     loaded from disk during evaluation), not single-document frequency.
 *     This is what makes it actually TF-IDF, not just term-frequency.
 *
 *  2. **Cosine similarity** of TF-IDF vectors over the union vocabulary,
 *     so the score reflects both presence AND relative importance of
 *     matched terms. Matches go from 0–1 → mapped to 0–100.
 *
 *  3. **Stable, deterministic**: pure function, no external API calls.
 *     Ideal as a baseline that should be reproducible byte-exact across
 *     evaluation runs (seed-independent).
 *
 * Usage:
 *
 *   // Production / single pair:
 *   const matcher = new TfidfMatcher()                       // builds 1-doc IDF
 *   const r = matcher.score(cvText, jdText)
 *
 *   // Evaluation / corpus mode (recommended for thesis numbers):
 *   const matcher = TfidfMatcher.fromCorpus(allJDs)          // proper IDF
 *   const r = matcher.score(cvText, jdText)
 */

import { MatchResult, OPENAI_PRICING_USD } from './types'

// =============================================================================
// Tokenization
// =============================================================================

/**
 * Stopwords for Vietnamese + English. Kept identical to the existing
 * `extractKeywords` in jd-analyze/route.ts so the thesis baseline is
 * comparable to the legacy fallback.
 */
const STOP_WORDS = new Set([
  // Vietnamese
  'và', 'hoặc', 'của', 'để', 'với', 'trong', 'các', 'có', 'là', 'được',
  'cho', 'về', 'từ', 'một', 'những', 'này', 'đó', 'không', 'sẽ', 'đã',
  // English
  'the', 'and', 'or', 'of', 'to', 'with', 'in', 'for', 'a', 'an',
  'be', 'is', 'are', 'will', 'have', 'has', 'on', 'at', 'by', 'from',
  'as', 'this', 'that', 'these', 'those', 'it', 'we', 'you', 'they',
])

const TOKEN_RE = /\b[a-zA-ZÀ-ỹ][a-zA-ZÀ-ỹ+#.]{2,}\b/g

export function tokenize(text: string): string[] {
  if (!text) return []
  return (text.toLowerCase().match(TOKEN_RE) || []).filter(t => !STOP_WORDS.has(t))
}

// =============================================================================
// TF, IDF, vectors
// =============================================================================

function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1)
  return tf
}

/**
 * IDF stats over a corpus.
 * idf[t] = ln((N + 1) / (df[t] + 1)) + 1   (smoothed, scikit-learn style)
 */
export interface IdfStats {
  N: number                             // # docs
  idf: Map<string, number>
}

export function buildIdf(corpus: string[]): IdfStats {
  const N = corpus.length
  const df = new Map<string, number>()
  for (const doc of corpus) {
    const seen = new Set(tokenize(doc))
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1)
  }
  const idf = new Map<string, number>()
  for (const [t, d] of df) {
    idf.set(t, Math.log((N + 1) / (d + 1)) + 1)
  }
  return { N, idf }
}

/** TF-IDF vector as a sparse Map. */
function tfidfVector(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const tf = termFreq(tokens)
  const vec = new Map<string, number>()
  const totalTokens = tokens.length || 1
  for (const [t, count] of tf) {
    // Use raw TF / doc length (term frequency ratio); good in short docs.
    const tfNorm = count / totalTokens
    // Fallback IDF = 1 (seen in 0 corpus docs → log((N+1)/1)+1 ≈ log(N+1)+1).
    // Using 1 is the conservative choice when no corpus is available.
    const w = tfNorm * (idf.get(t) ?? 1)
    vec.set(t, w)
  }
  return vec
}

function cosineSim(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, normA = 0, normB = 0
  for (const v of a.values()) normA += v * v
  for (const v of b.values()) normB += v * v
  for (const [t, va] of a) {
    const vb = b.get(t)
    if (vb !== undefined) dot += va * vb
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// =============================================================================
// Matcher
// =============================================================================

/** Top-N most-IDF-weighted JD terms used for matched/missing keyword report. */
const TOP_N_JD_KEYWORDS = 20

export class TfidfMatcher {
  private constructor(private idfStats: IdfStats) {}

  /**
   * Default constructor — builds IDF from a single document (the JD).
   * Equivalent to plain TF since df = 1 for every term, but is provided
   * so production code can call `new TfidfMatcher()` without a corpus.
   * Thesis evaluation should use `fromCorpus` instead.
   */
  static empty(): TfidfMatcher {
    return new TfidfMatcher({ N: 0, idf: new Map() })
  }

  /** Build IDF stats from a corpus of JDs (or any docs). */
  static fromCorpus(corpus: string[]): TfidfMatcher {
    return new TfidfMatcher(buildIdf(corpus))
  }

  /** Reconstruct from previously serialized IdfStats (for evaluation reuse). */
  static fromIdfStats(stats: IdfStats): TfidfMatcher {
    return new TfidfMatcher(stats)
  }

  /** Serialize IDF stats so they can be cached on disk during eval. */
  toJSON(): { N: number; idf: Record<string, number> } {
    return { N: this.idfStats.N, idf: Object.fromEntries(this.idfStats.idf) }
  }

  /** UI/debug helper: return the tokenized form of cv + jd (post-stopword filter). */
  getTokens(cvText: string, jdText: string): { cv: string[]; jd: string[] } {
    return { cv: tokenize(cvText), jd: tokenize(jdText) }
  }

  /**
   * UI/debug helper: return the top-K JD terms by TF-IDF weight, plus
   * whether each one is present in CV. Useful for the "what the algorithm
   * looked at" panel.
   */
  getTopJdTerms(jdText: string, cvText: string, k = 15): { term: string; weight: number; inCV: boolean }[] {
    const jdTokens = tokenize(jdText)
    const cvTokenSet = new Set(tokenize(cvText))
    const jdVec = tfidfVector(jdTokens, this.idfStats.idf)
    return [...jdVec.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([term, weight]) => ({ term, weight: +weight.toFixed(4), inCV: cvTokenSet.has(term) }))
  }

  static fromJSON(j: { N: number; idf: Record<string, number> }): TfidfMatcher {
    return new TfidfMatcher({ N: j.N, idf: new Map(Object.entries(j.idf)) })
  }

  /**
   * Score a (CV, JD) pair. Returns a normalized 0–100 score plus
   * the matched/missing top-N JD keywords for explanation.
   */
  score(cvText: string, jdText: string): MatchResult {
    const start = Date.now()

    const cvTokens = tokenize(cvText)
    const jdTokens = tokenize(jdText)
    const idf = this.idfStats.idf

    const cvVec = tfidfVector(cvTokens, idf)
    const jdVec = tfidfVector(jdTokens, idf)
    const sim = cosineSim(cvVec, jdVec)             // 0–1
    const score = Math.round(sim * 10000) / 100     // 0–100, 2dp

    // Build matched/missing report from the JD's top-N IDF-weighted terms.
    const jdRanked = [...jdVec.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N_JD_KEYWORDS)
      .map(([t]) => t)

    const cvTokenSet = new Set(cvTokens)
    const matchedKeywords: string[] = []
    const missingKeywords: string[] = []
    for (const kw of jdRanked) {
      if (cvTokenSet.has(kw)) matchedKeywords.push(kw)
      else missingKeywords.push(kw)
    }

    return {
      method: 'tfidf',
      score,
      matchedKeywords,
      missingKeywords,
      latencyMs: Date.now() - start,
      costUsd: 0, // TF-IDF is free, no API calls
      cached: false,
      computedAt: new Date().toISOString(),
      extras: {
        cosineSimilarity: sim,
        cvTokenCount: cvTokens.length,
        jdTokenCount: jdTokens.length,
        corpusSize: this.idfStats.N,
      },
    }
  }
}

// Convenience: re-export pricing in case eval scripts need it from one place.
export { OPENAI_PRICING_USD }
