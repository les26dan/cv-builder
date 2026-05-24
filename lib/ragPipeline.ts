/**
 * RAG pipeline for job search.
 *
 * 2-step retrieval:
 *   Step 1 — Hybrid retrieve: TF-IDF + embedding cosine → top-20 candidates
 *   Step 2a — Structural score: skill coverage against JD keywords
 *   Step 2b — LLM batch rank: gpt-4o-mini ranks all top-20 at once
 *   Merge: finalScore = 0.3 * structural + 0.7 * llm
 *   Return top 5 sorted by finalScore desc.
 */

import { TfidfMatcher } from '@/shared/services/matching/tfidfMatcher'
import { EmbeddingMatcher, hashText } from '@/shared/services/matching/embeddingMatcher'
import { cvDataToText } from '@/utils/cvDataToText'
import { getServiceRoleSupabaseClient } from '@/lib/supabase'

// =============================================================================
// Types
// =============================================================================

interface JobPosting {
  id: string
  title: string
  category: string
  jd_text: string
  jd_embedding: number[] | null
  source: string
  source_url: string | null
}

export interface JobSearchResult {
  id: string
  title: string
  category: string
  source: string
  sourceUrl: string | null
  jdPreview: string       // first 200 chars of jd_text
  jdFull: string          // full jd_text
  hybridScore: number     // 0-100, step 1
  structuralScore: number // 0-100, step 2a
  llmScore: number        // 0-100, step 2b
  finalScore: number      // 0.3*structural + 0.7*llm
  reason: string
  rank: number
}

export interface SearchMeta {
  step1Ms: number
  step2Ms: number
  totalMs: number
  llmCostUsd: number
  top20Count: number
}

// =============================================================================
// Helpers
// =============================================================================

// pgvector returns vectors as "[0.1,0.2,...]" string or number[] depending on client.
function parseVec(raw: unknown): number[] | null {
  if (Array.isArray(raw)) return raw as number[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

// =============================================================================
// Step 1: Hybrid retrieval
// =============================================================================

interface JobWithHybrid extends JobPosting {
  hybridScore: number
}

function hybridRetrieve(
  cvEmbedding: number[],
  cvText: string,
  jobs: JobPosting[],
  alpha = 0.4,
  topK = 20,
): JobWithHybrid[] {
  const embeddingMatcher = new EmbeddingMatcher()

  // Build TF-IDF corpus once across all JDs for proper IDF weights.
  const tfidfMatcher = TfidfMatcher.fromCorpus(jobs.map(j => j.jd_text))

  const scored = jobs.map(job => {
    // Embedding score — skip if embedding is missing (treat as 0).
    let embScore = 0
    const jdVec = parseVec(job.jd_embedding)
    if (jdVec && jdVec.length === 1536) {
      const result = embeddingMatcher.scoreFromVectors(cvEmbedding, jdVec)
      embScore = result.score
    }

    // TF-IDF score.
    const tfidfResult = tfidfMatcher.score(cvText, job.jd_text)
    const tfidfScore = tfidfResult.score

    // Hybrid blend: alpha * tfidf + (1-alpha) * embedding
    const hybridScore = alpha * tfidfScore + (1 - alpha) * embScore

    return { ...job, hybridScore }
  })

  // Sort descending by hybrid score, return topK.
  scored.sort((a, b) => b.hybridScore - a.hybridScore)
  return scored.slice(0, topK)
}

// =============================================================================
// Step 2a: Structural score
// =============================================================================

const STOP_WORDS_SIMPLE = new Set([
  'the', 'and', 'or', 'of', 'to', 'with', 'in', 'for', 'a', 'an', 'be',
  'is', 'are', 'will', 'have', 'has', 'on', 'at', 'by', 'from', 'as',
  'this', 'that', 'we', 'you', 'they', 'it',
  'và', 'hoặc', 'của', 'để', 'với', 'trong', 'các', 'có', 'là', 'được',
  'cho', 'về', 'từ', 'một', 'những', 'này', 'đó', 'không', 'sẽ', 'đã',
])

function extractJdKeywords(jdText: string, topN = 20): string[] {
  const tokens = jdText
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 2 && !STOP_WORDS_SIMPLE.has(t))

  const freq = new Map<string, number>()
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1)

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([t]) => t)
}

// Degree hierarchy: higher index = higher degree
const DEGREE_RANK: Record<string, number> = {
  'high school': 0, 'trung cấp': 0, 'cao đẳng': 1,
  'associate': 1, 'bachelor': 2, 'đại học': 2, 'cử nhân': 2,
  'master': 3, 'thạc sĩ': 3, 'mba': 3,
  'phd': 4, 'tiến sĩ': 4, 'doctorate': 4,
}

function parseDegreeRank(text: string): number {
  const lower = text.toLowerCase()
  for (const [key, rank] of Object.entries(DEGREE_RANK)) {
    if (lower.includes(key)) return rank
  }
  return -1 // unknown
}

function extractYearsRequired(jdText: string): number | null {
  const m = jdText.match(/(\d+)\+?\s*(?:year|năm)/i)
  return m ? parseInt(m[1], 10) : null
}

function extractDegreeRequired(jdText: string): number {
  return parseDegreeRank(jdText)
}

function structuralScore(cvData: Record<string, unknown>, jdText: string): number {
  // --- Tiêu chí 1: Kỹ năng (w = 0.40) ---
  const skillsSection = cvData.skills as { items?: unknown[] } | undefined
  const rawSkills: unknown[] = skillsSection?.items ?? []
  const cvSkills = new Set(
    rawSkills
      .map(s => {
        if (typeof s === 'string') return s.toLowerCase()
        if (s && typeof s === 'object') {
          const obj = s as Record<string, unknown>
          return String(obj.name ?? obj.label ?? '').toLowerCase()
        }
        return ''
      })
      .filter(Boolean),
  )
  const jdKeywords = extractJdKeywords(jdText, 20)
  const matched = jdKeywords.length > 0
    ? jdKeywords.filter(kw => cvSkills.has(kw)).length / jdKeywords.length
    : 0
  const r = matched // skill coverage ratio [0,1]

  // --- Tiêu chí 2: Kinh nghiệm (w = 0.35) ---
  const expItems = (cvData.experience as { items?: unknown[] } | undefined)?.items ?? []
  let totalYears = 0
  for (const item of expItems) {
    if (!item || typeof item !== 'object') continue
    const e = item as Record<string, unknown>
    const start = String(e.startDate ?? e.start ?? '')
    const end = String(e.endDate ?? e.end ?? 'present')
    const startYear = parseInt(start.slice(0, 4), 10)
    const endYear = /present|now|hiện/i.test(end)
      ? new Date().getFullYear()
      : parseInt(end.slice(0, 4), 10)
    if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
      totalYears += endYear - startYear
    }
  }
  const yearsRequired = extractYearsRequired(jdText)
  const e = (yearsRequired === null || totalYears >= yearsRequired) ? 1 : 0

  // --- Tiêu chí 3: Bằng cấp (w = 0.25) ---
  const eduItems = (cvData.education as { items?: unknown[] } | undefined)?.items ?? []
  let cvDegreeRank = -1
  for (const item of eduItems) {
    if (!item || typeof item !== 'object') continue
    const edu = item as Record<string, unknown>
    const degreeText = String(edu.degree ?? edu.level ?? edu.title ?? '')
    const rank = parseDegreeRank(degreeText)
    if (rank > cvDegreeRank) cvDegreeRank = rank
  }
  const jdDegreeRank = extractDegreeRequired(jdText)
  const d = (jdDegreeRank === -1 || cvDegreeRank === -1 || cvDegreeRank >= jdDegreeRank) ? 1 : 0

  // --- Tổng hợp: s = 0.35*e + 0.25*d + 0.40*r ---
  const score = 0.35 * e + 0.25 * d + 0.40 * r
  return Math.min(100, Math.max(0, Math.round(score * 100)))
}

// =============================================================================
// Step 2b: LLM batch ranking
// =============================================================================

interface LLMRanking {
  jobId: string
  score: number
  reason: string
}

interface LLMBatchResult {
  rankings: LLMRanking[]
  costUsd: number
}

async function llmBatchRank(
  cvText: string,
  top20Jobs: JobWithHybrid[],
): Promise<LLMBatchResult> {
  const truncatedCv = cvText.slice(0, 800)

  const jobSummaries = top20Jobs.map(j => ({
    id: j.id,
    title: j.title,
    jdSnippet: j.jd_text.slice(0, 200),
  }))

  const n = top20Jobs.length

  const systemPrompt =
    'You are a recruiter. Rank the following job postings by fit for this candidate. Return ONLY valid JSON array.'

  const userPrompt = `=== CANDIDATE CV (summary) ===
${truncatedCv}

=== JOB POSTINGS TO RANK ===
${JSON.stringify(jobSummaries)}

Return JSON array (rank all ${n} jobs):
[{"rank": 1, "jobId": "uuid", "score": 85, "reason": "one sentence why"}]`

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return fallbackRankings(top20Jobs)
  }

  let response: Response
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          max_tokens: 1500,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch {
    return fallbackRankings(top20Jobs)
  }

  if (!response.ok) {
    return fallbackRankings(top20Jobs)
  }

  let data: {
    choices: { message: { content: string } }[]
    usage?: { prompt_tokens: number; completion_tokens: number }
  }
  try {
    data = await response.json()
  } catch {
    return fallbackRankings(top20Jobs)
  }

  const raw = data.choices?.[0]?.message?.content ?? ''
  const inputTokens = data.usage?.prompt_tokens ?? 0
  const outputTokens = data.usage?.completion_tokens ?? 0
  // gpt-4o-mini pricing: $0.15/1M input, $0.60/1M output
  const costUsd = inputTokens * 0.15 / 1_000_000 + outputTokens * 0.6 / 1_000_000

  let parsed: { rank: number; jobId: string; score: number; reason: string }[]
  try {
    // Strip markdown fences if present.
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) throw new Error('Not an array')
  } catch {
    return fallbackRankings(top20Jobs)
  }

  const rankings: LLMRanking[] = parsed.map(item => ({
    jobId: String(item.jobId ?? ''),
    score: Number(item.score ?? 0),
    reason: String(item.reason ?? ''),
  }))

  return { rankings, costUsd }
}

function fallbackRankings(jobs: JobWithHybrid[]): LLMBatchResult {
  const rankings: LLMRanking[] = jobs.map((j, i) => ({
    jobId: j.id,
    score: Math.max(0, 80 - i * 2), // gentle decay from hybrid order
    reason: 'Xếp hạng theo điểm tương đồng',
  }))
  return { rankings, costUsd: 0 }
}

// =============================================================================
// Main: ragSearch
// =============================================================================

export async function ragSearch(
  cvId: string,
  query?: string,
): Promise<{ results: JobSearchResult[]; meta: SearchMeta }> {
  const totalStart = Date.now()

  // Load CV from DB.
  const db = getServiceRoleSupabaseClient()
  if (!db) throw new Error('Database not available — check SUPABASE_SERVICE_ROLE_KEY')

  const { data: cvRow, error: cvError } = await db
    .from('cv_workflow')
    .select('cv_data, cv_embedding')
    .eq('id', cvId)
    .single()

  if (cvError || !cvRow) {
    throw new Error(`CV not found: ${cvId}`)
  }

  let cvEmbedding = parseVec(cvRow.cv_embedding)

  // If embedding missing, compute it now and save back to DB.
  if (!cvEmbedding || cvEmbedding.length !== 1536) {
    const cvData0 = (cvRow.cv_data ?? {}) as Record<string, unknown>
    const cvTextForEmbed = cvDataToText(cvData0)
    const matcher = new EmbeddingMatcher()
    const r = await matcher.embed(cvTextForEmbed)
    cvEmbedding = r.vec
    // Persist so next call is instant.
    await db
      .from('cv_workflow')
      .update({
        cv_embedding: `[${r.vec.join(',')}]`,
        cv_embedding_hash: hashText(cvTextForEmbed),
        cv_embedding_updated_at: new Date().toISOString(),
      })
      .eq('id', cvId)
  }

  // Load job postings — filter by query keyword if provided.
  let jobQuery = db
    .from('job_postings')
    .select('id, title, category, jd_text, jd_embedding, source, source_url')

  if (query) {
    // Filter by title or category containing query (case-insensitive)
    jobQuery = jobQuery.or(
      `title.ilike.%${query}%,category.ilike.%${query}%,jd_text.ilike.%${query}%`
    )
  }

  const { data: jobRows, error: jobsError } = await jobQuery

  if (jobsError) throw new Error(`Failed to load job postings: ${jobsError.message}`)

  const jobs: JobPosting[] = (jobRows ?? []) as JobPosting[]
  if (jobs.length === 0) {
    return {
      results: [],
      meta: { step1Ms: 0, step2Ms: 0, totalMs: Date.now() - totalStart, llmCostUsd: 0, top20Count: 0 },
    }
  }

  const cvData = (cvRow.cv_data ?? {}) as Record<string, unknown>
  const cvText = cvDataToText(cvData)

  // Step 1: Hybrid retrieve → top 20.
  const step1Start = Date.now()
  const top20 = hybridRetrieve(cvEmbedding, cvText, jobs)
  const step1Ms = Date.now() - step1Start

  // Step 2: Structural + LLM in parallel.
  const step2Start = Date.now()
  const [llmResult, structuralScores] = await Promise.all([
    llmBatchRank(cvText, top20),
    Promise.resolve(top20.map(job => structuralScore(cvData, job.jd_text))),
  ])
  const step2Ms = Date.now() - step2Start

  // Build a lookup for LLM scores by jobId.
  const llmScoreMap = new Map<string, LLMRanking>()
  for (const r of llmResult.rankings) {
    llmScoreMap.set(r.jobId, r)
  }

  // Merge: finalScore = 0.3 * structural + 0.7 * llm
  const merged = top20.map((job, i) => {
    const sScore = structuralScores[i]
    const llmEntry = llmScoreMap.get(job.id)
    const lScore = llmEntry?.score ?? 0
    const finalScore = 0.3 * sScore + 0.7 * lScore

    return {
      id: job.id,
      title: job.title,
      category: job.category,
      source: job.source,
      sourceUrl: job.source_url ?? null,
      jdPreview: job.jd_text.slice(0, 200),
      jdFull: job.jd_text,
      hybridScore: Math.round(job.hybridScore * 10) / 10,
      structuralScore: sScore,
      llmScore: lScore,
      finalScore: Math.round(finalScore * 100) / 100,
      reason: llmEntry?.reason ?? 'Xếp hạng theo điểm tương đồng',
    }
  })

  // Sort by finalScore desc, take top 5, assign ranks.
  merged.sort((a, b) => b.finalScore - a.finalScore)
  const top5: JobSearchResult[] = merged.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }))

  const meta: SearchMeta = {
    step1Ms,
    step2Ms,
    totalMs: Date.now() - totalStart,
    llmCostUsd: llmResult.costUsd,
    top20Count: top20.length,
  }

  return { results: top5, meta }
}
