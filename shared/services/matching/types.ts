/**
 * JD-CV Matching Engine — shared types
 *
 * Three matching methods compared in this thesis:
 *  - 'tfidf':     lexical baseline (corpus-IDF + cosine on TF vectors)
 *  - 'embedding': dense semantic (OpenAI text-embedding-3-small + cosine)
 *  - 'llm':       reasoning (gpt-4o-mini structured output)
 *
 * All methods produce a normalized score in [0, 100] so they're directly
 * comparable in the thesis evaluation.
 */

export type MethodName = 'tfidf' | 'embedding' | 'llm'

export const ALL_METHODS: MethodName[] = ['tfidf', 'embedding', 'llm']

/**
 * Per-method matching result. Method-specific extras live in `extras`
 * (kept loose on purpose so the thesis evaluation harness can dump
 * everything to CSV without losing data).
 */
export interface MatchResult {
  method: MethodName
  /** Normalized 0–100 score, comparable across methods. */
  score: number

  /** Keywords that overlap between CV and JD (TF-IDF + LLM populate this). */
  matchedKeywords?: string[]
  /** Keywords from JD that don't appear in CV. */
  missingKeywords?: string[]

  /** Per-section breakdown (embedding method populates this). */
  sectionScores?: {
    skills?: number
    experience?: number
    summary?: number
    education?: number
  }

  /** Method-specific raw output (LLM full analysis, embedding vectors, etc.). */
  extras?: Record<string, unknown>

  latencyMs: number
  costUsd: number
  tokensUsed?: number

  /** True if served from match_runs cache instead of recomputed. */
  cached: boolean

  /** ISO timestamp when this result was generated (or originally cached). */
  computedAt: string
}

/**
 * Aggregate response from /api/cv/match — runs ≥1 method and returns
 * comparison metadata for thesis demo and the multi-JD UI.
 */
export interface MatchComparisonResponse {
  cvId: string
  jdTargetId: string | null   // null when called with raw jdText
  jdLabel?: string

  results: Partial<Record<MethodName, MatchResult>>

  comparison: {
    /** Which method assigned the highest score for this (CV, JD) pair. */
    winner: MethodName | null
    /** Pairwise score deltas. */
    deltaScores: Record<string, number>
    /**
     * Pairwise rank-agreement (0–1). Computed across the matched-keyword
     * sets for TF-IDF/LLM, and across section embeddings for embedding/LLM.
     */
    agreementMatrix?: Record<string, number>
  }

  totalLatencyMs: number
  totalCostUsd: number
}

/**
 * Persisted Job Description targeted by a CV. Mirrors the `jd_targets`
 * table created in scripts/migrations/2026-add-matching-engine.sql.
 */
export interface JDTarget {
  id: string
  cvId: string
  userId: string
  label: string
  jdText: string
  jdUrl?: string
  jdKeywords?: string[]
  /** Vector stored in DB but not usually shipped to the client (1536 floats = 6KB). */
  jdEmbedding?: number[]
  jdEmbeddingHash?: string
  createdAt: string
  updatedAt: string
}

/**
 * Single row in `match_runs` table — used both as a cache and as an
 * append-only audit log for thesis evaluation runs.
 */
export interface MatchRun {
  id: string
  cvId: string
  jdTargetId: string | null
  method: MethodName
  score: number
  matchedKeywords?: string[]
  missingKeywords?: string[]
  sectionScores?: Record<string, number>
  rawPayload?: Record<string, unknown>
  latencyMs: number
  costUsd: number
  tokensUsed?: number
  /** Set during evaluation runs (e.g. "kaggle-2026-05-04-seed42"); NULL for production traffic. */
  evalRunId?: string | null
  /** Ground-truth label (0–1) for evaluation rows; NULL otherwise. */
  groundTruthLabel?: number | null
  createdAt: string
}

/**
 * Public-facing request body for POST /api/cv/match.
 * Either `jdTargetId` (saved JD) or `jdText` (one-off) must be provided.
 */
export interface MatchRequest {
  cvId: string
  jdTargetId?: string
  jdText?: string
  methods?: MethodName[]
  /** When true (default), return cached match_runs if a fresh row exists. */
  useCache?: boolean
}

/**
 * Pricing constants for OpenAI models used in this thesis.
 * Source: https://openai.com/api/pricing/ (accessed 2026-05).
 *
 * Treat these as best-effort — actual cost is read from OpenAI usage logs
 * when running the evaluation harness. These constants are for live
 * UI cost-badge display and rough budgeting.
 */
export const OPENAI_PRICING_USD = {
  // text-embedding-3-small: $0.02 / 1M input tokens
  embeddingPerToken: 0.02 / 1_000_000,
  // gpt-4o-mini: $0.15 / 1M input, $0.60 / 1M output
  llmInputPerToken: 0.15 / 1_000_000,
  llmOutputPerToken: 0.60 / 1_000_000,
} as const
