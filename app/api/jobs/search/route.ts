/**
 * POST /api/jobs/search
 *
 * 2-step RAG pipeline: hybrid retrieval (TF-IDF + embedding) → LLM batch rank.
 *
 * Body:  { cvId: string, query?: string }
 *   - query: optional keyword to filter job corpus before RAG
 * Returns: { results: JobSearchResult[], meta: SearchMeta }
 */
import { NextRequest, NextResponse } from 'next/server'
import { ragSearch } from '@/lib/ragPipeline'

export async function POST(req: NextRequest) {
  let cvId: string
  let query: string | undefined
  try {
    const body = await req.json()
    cvId = body?.cvId
    query = typeof body?.query === 'string' ? body.query.trim() || undefined : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!cvId) return NextResponse.json({ error: 'cvId required' }, { status: 400 })

  try {
    const result = await ragSearch(cvId, query)
    return NextResponse.json(result)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
