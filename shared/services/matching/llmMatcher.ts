/**
 * LLM matcher — reasoning-based scoring for thesis comparison.
 *
 * Wraps OpenAI gpt-4o-mini with a slim prompt focused on a single task:
 * produce a 0–100 relevance score plus matched/missing keyword arrays
 * for a (CV, JD) pair.
 *
 * Differs from app/api/cv/jd-analyze/route.ts which generates rewrite
 * suggestions — that route's payload is ~3000 tokens of output per call
 * and would blow the eval budget. This matcher caps output at ~400 tokens.
 *
 * Usage:
 *   const m = new LLMMatcher()
 *   const r = await m.score(cvText, jdText)
 */

import { MatchResult, LLM_PRICING_USD } from './types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'

export interface LLMMatcherOptions {
  apiKey?: string                  // defaults to env OPENAI_API_KEY
  model?: string                   // defaults to gpt-4o-mini
  timeoutMs?: number               // default 30s
  language?: 'en' | 'vi'           // prompt language; default 'en' for Kaggle data
  /** Optional cache keyed by sha256(cv + '\0' + jd). Eval harness wires a disk-backed one. */
  cache?: Map<string, MatchResult>
}

interface LLMScorePayload {
  overallScore: number
  matchedKeywords?: string[]
  missingKeywords?: string[]
  reasoning?: string
}

const SYSTEM_PROMPT_EN = `You are an experienced technical recruiter. Score how well a candidate's CV matches a job description on a 0-100 scale where:
- 90-100: Strong match (most required skills + relevant experience present)
- 70-89: Good match (core skills present, some gaps)
- 40-69: Partial match (some overlap, significant gaps)
- 0-39: Poor match (different domain or insufficient experience)

Return ONLY valid JSON. No prose outside the JSON.`

const USER_PROMPT_TEMPLATE_EN = (cvText: string, jdText: string) => `=== JOB DESCRIPTION ===
${jdText}

=== CANDIDATE CV ===
${cvText}

Return JSON with this exact shape:
{
  "overallScore": <integer 0-100>,
  "matchedKeywords": ["<up to 10 skills/keywords present in BOTH>"],
  "missingKeywords": ["<up to 10 important JD keywords MISSING from CV>"],
  "reasoning": "<one-sentence justification>"
}`

const SYSTEM_PROMPT_VI = `Bạn là một nhà tuyển dụng kỹ thuật giàu kinh nghiệm. Hãy đánh giá mức độ phù hợp giữa CV ứng viên và mô tả công việc trên thang 0-100:
- 90-100: Rất phù hợp (đa số kỹ năng yêu cầu + kinh nghiệm liên quan đều có)
- 70-89: Khá phù hợp (đủ kỹ năng cốt lõi, còn một vài khoảng trống)
- 40-69: Phù hợp một phần (có giao thoa, nhưng còn nhiều thiếu sót)
- 0-39: Không phù hợp (khác lĩnh vực hoặc thiếu kinh nghiệm)

CHỈ trả về JSON hợp lệ. Không viết gì ngoài JSON. Toàn bộ matchedKeywords, missingKeywords và reasoning hãy viết bằng tiếng Việt.`

const USER_PROMPT_TEMPLATE_VI = (cvText: string, jdText: string) => `=== MÔ TẢ CÔNG VIỆC ===
${jdText}

=== CV ỨNG VIÊN ===
${cvText}

Trả về JSON đúng cấu trúc sau:
{
  "overallScore": <số nguyên 0-100>,
  "matchedKeywords": ["<tối đa 10 kỹ năng/từ khoá xuất hiện ở CẢ HAI bên>"],
  "missingKeywords": ["<tối đa 10 từ khoá quan trọng trong JD nhưng THIẾU trong CV>"],
  "reasoning": "<một câu giải thích ngắn gọn tại sao cho điểm như vậy>"
}`

export class LLMMatcher {
  private apiKey: string
  private model: string
  private timeoutMs: number
  private language: 'en' | 'vi'
  private cache?: Map<string, MatchResult>

  /** UI/debug helper: the exact system prompt this matcher sends. */
  getSystemPrompt(): string {
    return this.language === 'vi' ? SYSTEM_PROMPT_VI : SYSTEM_PROMPT_EN
  }

  /** UI/debug helper: the exact user prompt this matcher would send for a pair. */
  getUserPrompt(cvText: string, jdText: string): string {
    return this.language === 'vi'
      ? USER_PROMPT_TEMPLATE_VI(cvText, jdText)
      : USER_PROMPT_TEMPLATE_EN(cvText, jdText)
  }


  constructor(opts: LLMMatcherOptions = {}) {
    this.apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY ?? ''
    this.model = opts.model ?? DEFAULT_MODEL
    this.timeoutMs = opts.timeoutMs ?? 30_000
    this.language = opts.language ?? 'en'
    this.cache = opts.cache
  }

  async score(cvText: string, jdText: string): Promise<MatchResult> {
    if (this.cache) {
      const key = cacheKey(cvText, jdText)
      const hit = this.cache.get(key)
      if (hit) {
        return { ...hit, cached: true, latencyMs: 0, costUsd: 0 }
      }
    }

    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY missing — required for LLM matcher')
    }

    const start = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    let resp: Response
    try {
      resp = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: this.language === 'vi' ? SYSTEM_PROMPT_VI : SYSTEM_PROMPT_EN },
            { role: 'user', content: this.language === 'vi' ? USER_PROMPT_TEMPLATE_VI(cvText, jdText) : USER_PROMPT_TEMPLATE_EN(cvText, jdText) },
          ],
          max_tokens: 400,
          temperature: 0,                                  // deterministic for eval
          response_format: { type: 'json_object' },
          seed: 42,                                        // OpenAI best-effort determinism
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({} as any))
      throw new Error(
        `OpenAI error ${resp.status}: ${err?.error?.message || resp.statusText}`
      )
    }

    const data = await resp.json() as {
      choices: { message: { content: string } }[]
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
      model: string
    }

    const raw = data.choices?.[0]?.message?.content ?? ''
    let parsed: LLMScorePayload
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error(`LLM returned non-JSON response: ${raw.slice(0, 200)}`)
    }

    const score = clampInt(parsed.overallScore, 0, 100)
    const inputTokens = data.usage?.prompt_tokens ?? 0
    const outputTokens = data.usage?.completion_tokens ?? 0
    const costUsd =
      inputTokens * LLM_PRICING_USD.llmInputPerToken +
      outputTokens * LLM_PRICING_USD.llmOutputPerToken

    const result: MatchResult = {
      method: 'llm',
      score,
      matchedKeywords: Array.isArray(parsed.matchedKeywords)
        ? parsed.matchedKeywords.slice(0, 10)
        : undefined,
      missingKeywords: Array.isArray(parsed.missingKeywords)
        ? parsed.missingKeywords.slice(0, 10)
        : undefined,
      latencyMs: Date.now() - start,
      costUsd,
      tokensUsed: data.usage?.total_tokens ?? 0,
      cached: false,
      computedAt: new Date().toISOString(),
      extras: {
        model: data.model || this.model,
        reasoning: parsed.reasoning,
        inputTokens,
        outputTokens,
      },
    }

    if (this.cache) {
      this.cache.set(cacheKey(cvText, jdText), result)
    }

    return result
  }
}

function clampInt(x: unknown, lo: number, hi: number): number {
  const n = typeof x === 'number' ? x : Number(x)
  if (!Number.isFinite(n)) return 0
  return Math.max(lo, Math.min(hi, Math.round(n)))
}

function cacheKey(cv: string, jd: string): string {
  return `${cv.length}:${jd.length}:${cv.slice(0, 64)}::${jd.slice(0, 64)}`
}
