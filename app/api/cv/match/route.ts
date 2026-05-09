/**
 * POST /api/cv/match
 *
 * Run all 3 matching methods (TF-IDF, Embedding, LLM) against a (CV, JD) pair
 * in parallel and return a side-by-side comparison.
 *
 * Each method also returns `details` — the actual input/output of that method
 * (TF-IDF: top weighted tokens; Embedding: vector previews; LLM: full prompt
 * + raw JSON response) so the UI can show what each method actually did,
 * not just the final number. This is the "explain to advisor" view.
 *
 * Reuses the same matcher modules as scripts/evaluate-matching.ts so the
 * demo and the thesis evaluation stay in sync.
 */
import { NextRequest, NextResponse } from 'next/server'
import { TfidfMatcher } from '@/shared/services/matching/tfidfMatcher'
import { EmbeddingMatcher } from '@/shared/services/matching/embeddingMatcher'
import { LLMMatcher } from '@/shared/services/matching/llmMatcher'
import { MatchResult, MethodName, ALL_METHODS } from '@/shared/services/matching/types'

// Shared TF-IDF instance — built with no corpus so it falls back to uniform IDF.
let tfidfMatcher: TfidfMatcher | null = null
function getTfidfMatcher(): TfidfMatcher {
  if (!tfidfMatcher) tfidfMatcher = TfidfMatcher.empty()
  return tfidfMatcher
}

interface MatchRequestBody {
  cvText?: string
  jdText?: string
  methods?: MethodName[]
}

// =============================================================================
// Method-specific "details" payloads — surfaced to UI for explainability.
// =============================================================================

interface TfidfDetails {
  // The vocabulary actually used after tokenize + stopword removal
  cvTokenSample: string[]              // first 20 tokens
  jdTokenSample: string[]              // first 20 tokens
  topJdTerms: { term: string; weight: number; inCV: boolean }[]  // top 15 IDF-weighted
  cosineSimilarity: number             // 0-1
}

interface EmbeddingDetails {
  model: string
  dim: number
  cvVectorPreview: number[]            // first 8 floats
  jdVectorPreview: number[]            // first 8 floats
  cosineSimilarity: number             // 0-1
  inputTokens: number
}

interface LLMDetails {
  model: string
  language: 'en' | 'vi'
  systemPrompt: string
  userPrompt: string
  rawJsonResponse: {
    overallScore: number
    matchedKeywords?: string[]
    missingKeywords?: string[]
    reasoning?: string
  }
  inputTokens: number
  outputTokens: number
}

export async function POST(req: NextRequest) {
  let body: MatchRequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const cvText = (body.cvText ?? '').trim()
  const jdText = (body.jdText ?? '').trim()
  if (!cvText) return NextResponse.json({ error: 'Missing cvText' }, { status: 400 })
  if (!jdText) return NextResponse.json({ error: 'Missing jdText' }, { status: 400 })

  const methods = (body.methods?.length ? body.methods : ALL_METHODS)
    .filter(m => ALL_METHODS.includes(m))

  // Detect language once — both LLM and the response use it.
  const langSample = (cvText + ' ' + jdText).slice(0, 2000)
  const viChars = (langSample.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g) || []).length
  const language: 'en' | 'vi' = (viChars / langSample.length > 0.01) ? 'vi' : 'en'

  const start = Date.now()

  const settled = await Promise.allSettled(
    methods.map<Promise<{ method: MethodName; result: MatchResult; details: unknown }>>(async (method) => {
      if (method === 'tfidf') {
        const m = getTfidfMatcher()
        const result = m.score(cvText, jdText)
        const tokens = m.getTokens(cvText, jdText)
        const topJdTerms = m.getTopJdTerms(jdText, cvText, 15)
        const details: TfidfDetails = {
          cvTokenSample: tokens.cv.slice(0, 20),
          jdTokenSample: tokens.jd.slice(0, 20),
          topJdTerms,
          cosineSimilarity: (result.extras as { cosineSimilarity?: number })?.cosineSimilarity ?? 0,
        }
        return { method, result, details }
      }
      if (method === 'embedding') {
        const m = new EmbeddingMatcher()
        const cvE = await m.embed(cvText)
        const jdE = await m.embed(jdText)
        const result = m.scoreFromVectors(cvE.vec, jdE.vec)
        // Override aggregate cost/latency to reflect both embed calls
        result.costUsd = +(cvE.costUsd + jdE.costUsd).toFixed(8)
        result.tokensUsed = (cvE.tokensUsed ?? 0) + (jdE.tokensUsed ?? 0)
        result.cached = false
        const details: EmbeddingDetails = {
          model: 'text-embedding-3-small',
          dim: cvE.vec.length,
          cvVectorPreview: cvE.vec.slice(0, 8).map(x => +x.toFixed(5)),
          jdVectorPreview: jdE.vec.slice(0, 8).map(x => +x.toFixed(5)),
          cosineSimilarity: result.score / 100,
          inputTokens: result.tokensUsed!,
        }
        return { method, result, details }
      }
      // method === 'llm'
      const llm = new LLMMatcher({ language })
      const result = await llm.score(cvText, jdText)
      const extras = (result.extras ?? {}) as Record<string, unknown>
      const details: LLMDetails = {
        model: (extras.model as string) || 'gpt-4o-mini',
        language,
        systemPrompt: llm.getSystemPrompt(),
        userPrompt: llm.getUserPrompt(cvText, jdText),
        rawJsonResponse: {
          overallScore: result.score,
          matchedKeywords: result.matchedKeywords,
          missingKeywords: result.missingKeywords,
          reasoning: (extras.reasoning as string) || undefined,
        },
        inputTokens: (extras.inputTokens as number) || 0,
        outputTokens: (extras.outputTokens as number) || 0,
      }
      return { method, result, details }
    })
  )

  const results: Partial<Record<MethodName, MatchResult>> = {}
  const detailsAll: Partial<Record<MethodName, unknown>> = {}
  const errors: Partial<Record<MethodName, string>> = {}
  for (let i = 0; i < settled.length; i++) {
    const s = settled[i]
    const method = methods[i]
    if (s.status === 'fulfilled') {
      results[s.value.method] = s.value.result
      detailsAll[s.value.method] = s.value.details
    } else {
      errors[method] = (s.reason as Error)?.message ?? String(s.reason)
    }
  }

  const scores = Object.entries(results).map(([m, r]) => [m as MethodName, r!.score] as const)
  let winner: MethodName | null = null
  let topScore = -Infinity
  for (const [m, s] of scores) {
    if (s > topScore) { topScore = s; winner = m }
  }
  const deltaScores: Record<string, number> = {}
  for (const [a, sa] of scores) {
    for (const [b, sb] of scores) {
      if (a < b) deltaScores[`${a}_vs_${b}`] = +(sa - sb).toFixed(2)
    }
  }

  const totalCostUsd = +(Object.values(results).reduce((s, r) => s + (r?.costUsd ?? 0), 0)).toFixed(8)

  return NextResponse.json({
    results,
    details: detailsAll,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    comparison: { winner, deltaScores },
    totalLatencyMs: Date.now() - start,
    totalCostUsd,
    language,
  })
}
