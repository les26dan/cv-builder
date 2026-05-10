/**
 * ComparisonBars — visualize score / latency / cost across the 3 methods.
 *
 * The advisor's "Pareto trade-off" view: a quick glance shows which method
 * wins quality, which wins speed, which wins cost. Matches the thesis RQ2
 * narrative.
 */
'use client'

import type { MatchResult, MethodName } from '@/shared/services/matching/types'

const COLORS: Record<MethodName, string> = {
  tfidf: 'bg-amber-500',
  embedding: 'bg-blue-500',
  llm: 'bg-purple-500',
}

const LABELS: Record<MethodName, string> = {
  tfidf: 'TF-IDF',
  embedding: 'Embedding',
  llm: 'LLM',
}

interface Props {
  results: Partial<Record<MethodName, MatchResult>>
}

function Bar({ method, value, max, fmt }: { method: MethodName; value: number; max: number; fmt: (v: number) => string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-gray-700">{LABELS[method]}</span>
      <div className="flex-1 bg-gray-100 rounded h-5 relative overflow-hidden">
        <div className={`h-full ${COLORS[method]} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-24 text-right font-mono text-gray-600">{fmt(value)}</span>
    </div>
  )
}

export default function ComparisonBars({ results }: Props) {
  const methods = (['tfidf', 'embedding', 'llm'] as MethodName[]).filter(m => results[m])
  const maxScore = Math.max(...methods.map(m => results[m]!.score), 1)
  const maxLatency = Math.max(...methods.map(m => results[m]!.latencyMs), 1)
  const maxCost = Math.max(...methods.map(m => results[m]!.costUsd), 0.0000001)

  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">📊 Score (cao = phù hợp)</h4>
        <div className="space-y-1">
          {methods.map(m => (
            <Bar key={m} method={m} value={results[m]!.score} max={maxScore} fmt={v => `${v.toFixed(1)}/100`} />
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">⏱ Độ trễ (thấp = nhanh)</h4>
        <div className="space-y-1">
          {methods.map(m => (
            <Bar key={m} method={m} value={results[m]!.latencyMs} max={maxLatency} fmt={v => v < 5 ? '<5ms' : v < 1000 ? `${v.toFixed(0)}ms` : `${(v / 1000).toFixed(1)}s`} />
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-gray-800 mb-2">💰 Chi phí mỗi lượt (thấp = rẻ)</h4>
        <div className="space-y-1">
          {methods.map(m => (
            <Bar key={m} method={m} value={results[m]!.costUsd} max={maxCost} fmt={v => v === 0 ? '$0 (free)' : `$${v.toFixed(7)}`} />
          ))}
        </div>
      </section>

      <p className="text-xs text-gray-500 italic mt-4">
        Đây là minh hoạ trade-off cost-quality (Câu hỏi nghiên cứu RQ2 của khoá luận):
        TF-IDF rẻ nhưng kém ngữ nghĩa · Embedding cân bằng tốt · LLM chất lượng cao nhưng chậm và đắt.
      </p>
    </div>
  )
}
