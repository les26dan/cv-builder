/**
 * MatchScoreCard — single method's score in the side-by-side comparison.
 *
 * Renders the score (0-100), latency badge, cost badge, and (for LLM)
 * the reasoning sentence + matched/missing keyword pills.
 */
'use client'

import { MatchResult, MethodName } from '@/shared/services/matching/types'

const METHOD_LABELS: Record<MethodName, { name: string; subtitle: string }> = {
  tfidf:     { name: 'TF-IDF',    subtitle: 'Khớp từ khoá (lexical)' },
  embedding: { name: 'Embedding', subtitle: 'Tương đồng ngữ nghĩa (OpenAI)' },
  llm:       { name: 'LLM',       subtitle: 'Suy luận (gpt-4o-mini)' },
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-rose-700 bg-rose-50 border-rose-200'
}

interface Props {
  method: MethodName
  result?: MatchResult
  error?: string
  isWinner?: boolean
}

export default function MatchScoreCard({ method, result, error, isWinner }: Props) {
  const label = METHOD_LABELS[method]

  return (
    <div className={`border rounded-lg p-4 ${isWinner ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200'}`}>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{label.name}</h3>
          <p className="text-xs text-gray-500">{label.subtitle}</p>
        </div>
        {isWinner && (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">cao nhất</span>
        )}
      </div>

      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded p-2">
          {error}
        </div>
      )}

      {result && !error && (
        <>
          <div className={`inline-block text-3xl font-bold px-3 py-1 rounded border ${scoreColor(result.score)}`}>
            {result.score.toFixed(0)}
            <span className="text-base font-normal ml-1">/100</span>
          </div>

          <div className="flex gap-3 mt-3 text-xs text-gray-600">
            <span>⏱ {result.latencyMs < 10 ? '<10ms' : `${result.latencyMs}ms`}</span>
            <span>💰 ${result.costUsd < 0.0001 ? '<0.0001' : result.costUsd.toFixed(4)}</span>
            {result.tokensUsed != null && result.tokensUsed > 0 && (
              <span>🔤 {result.tokensUsed} tok</span>
            )}
          </div>

          {/* LLM reasoning */}
          {result.extras && typeof (result.extras as { reasoning?: string }).reasoning === 'string' && (
            <p className="mt-3 text-sm text-gray-700 italic border-l-2 border-gray-200 pl-3">
              {String((result.extras as { reasoning: string }).reasoning)}
            </p>
          )}
        </>
      )}
    </div>
  )
}
