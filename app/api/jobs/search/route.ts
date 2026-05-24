/**
 * POST /api/jobs/search
 *
 * 2-step RAG pipeline: hybrid retrieval (TF-IDF + embedding) → LLM batch rank.
 *
 * Body:  { cvId: string }
 * Returns: { jobs: JobSearchResult[], meta: SearchMeta }
 */
import { NextRequest, NextResponse } from 'next/server'
import { ragSearch } from '@/lib/ragPipeline'

export async function POST(req: NextRequest) {
  let cvId: string
  try {
    const body = await req.json()
    cvId = body?.cvId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!cvId) return NextResponse.json({ error: 'cvId required' }, { status: 400 })

  try {
    const result = await ragSearch(cvId)
    return NextResponse.json(result)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
