/**
 * POST /api/cv/embed
 *
 * Computes a 1024-dim Voyage AI embedding for a CV or JD text and returns it.
 * Caches by sha256(text) into the appropriate table:
 *   - kind='cv'  → cv_workflow.cv_embedding (when cvId provided)
 *   - kind='jd'  → jd_targets.jd_embedding (when jdTargetId provided)
 *
 * If neither id is provided, the vector is returned without persistence
 * (useful for one-off comparisons / the thesis evaluation harness).
 *
 * Request body:
 *   {
 *     text: string,                    // required
 *     kind: 'cv' | 'jd',               // required
 *     cvId?: string,                   // persist into cv_workflow row
 *     jdTargetId?: string,             // persist into jd_targets row
 *   }
 *
 * Response (200):
 *   {
 *     success: true,
 *     embedding: number[],             // length 1536
 *     hash: string,                    // sha256 hex of the text
 *     cached: boolean,                 // true if served from row hash match
 *     model: 'voyage-3-lite',
 *     latencyMs: number,
 *     costUsd: number,
 *     tokensUsed: number,
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { EmbeddingMatcher, EMBED_DIM, hashText } from '@/shared/services/matching/embeddingMatcher'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase service-role env not configured')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })
}

interface ReqBody {
  text?: string
  kind?: 'cv' | 'jd'
  cvId?: string
  jdTargetId?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: ReqBody = await req.json()
    const text = body.text?.trim()
    const kind = body.kind

    if (!text) {
      return NextResponse.json({ success: false, error: 'Missing text' }, { status: 400 })
    }
    if (kind !== 'cv' && kind !== 'jd') {
      return NextResponse.json({ success: false, error: 'kind must be "cv" or "jd"' }, { status: 400 })
    }
    if (!process.env.VOYAGE_API_KEY) {
      return NextResponse.json({ success: false, error: 'VOYAGE_API_KEY not configured' }, { status: 500 })
    }

    const hash = hashText(text)

    // ---------------------------------------------------------------
    // 1) Cache lookup — if the row already has this hash, reuse vector
    // ---------------------------------------------------------------
    let cachedVec: number[] | null = null
    if (kind === 'cv' && body.cvId) {
      const sb = getServiceClient()
      const { data } = await sb
        .from('cv_workflow')
        .select('cv_embedding, cv_embedding_hash')
        .eq('id', body.cvId)
        .maybeSingle()
      if (data?.cv_embedding_hash === hash && data.cv_embedding) {
        cachedVec = parseVec(data.cv_embedding)
      }
    } else if (kind === 'jd' && body.jdTargetId) {
      const sb = getServiceClient()
      const { data } = await sb
        .from('jd_targets')
        .select('jd_embedding, jd_embedding_hash')
        .eq('id', body.jdTargetId)
        .maybeSingle()
      if (data?.jd_embedding_hash === hash && data.jd_embedding) {
        cachedVec = parseVec(data.jd_embedding)
      }
    }

    if (cachedVec && cachedVec.length === EMBED_DIM) {
      return NextResponse.json({
        success: true,
        embedding: cachedVec,
        hash,
        cached: true,
        model: 'voyage-3-lite',
        latencyMs: 0,
        costUsd: 0,
        tokensUsed: 0,
      })
    }

    // ---------------------------------------------------------------
    // 2) Cache miss — call OpenAI
    // ---------------------------------------------------------------
    const matcher = new EmbeddingMatcher()
    const r = await matcher.embed(text)

    // ---------------------------------------------------------------
    // 3) Persist if id provided
    // ---------------------------------------------------------------
    if (kind === 'cv' && body.cvId) {
      const sb = getServiceClient()
      await sb
        .from('cv_workflow')
        .update({
          cv_embedding: toPgVector(r.vec),
          cv_embedding_hash: r.hash,
          cv_embedding_updated_at: new Date().toISOString(),
        })
        .eq('id', body.cvId)
    } else if (kind === 'jd' && body.jdTargetId) {
      const sb = getServiceClient()
      await sb
        .from('jd_targets')
        .update({
          jd_embedding: toPgVector(r.vec),
          jd_embedding_hash: r.hash,
          jd_embedding_updated_at: new Date().toISOString(),
        })
        .eq('id', body.jdTargetId)
    }

    return NextResponse.json({
      success: true,
      embedding: r.vec,
      hash: r.hash,
      cached: false,
      model: 'voyage-3-lite',
      latencyMs: r.latencyMs,
      costUsd: r.costUsd,
      tokensUsed: r.tokensUsed,
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}

// pgvector returns vectors as either a string "[0.1,0.2,...]" or an array
// depending on the client serialization. Normalize to number[].
function parseVec(raw: unknown): number[] | null {
  if (Array.isArray(raw)) return raw as number[]
  if (typeof raw === 'string') {
    try {
      // Supabase returns "[1,2,3]" — JSON.parse handles it.
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

// pgvector accepts the PostgreSQL textual format "[0.1,0.2,...]".
function toPgVector(vec: number[]): string {
  return `[${vec.join(',')}]`
}
