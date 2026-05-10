/**
 * TfidfPanel — explain TF-IDF method side-by-side: how, input, output.
 *
 * Designed for the thesis defense: an advisor reading this panel should
 * understand exactly what the algorithm did, not just "score = 30".
 */
'use client'

import type { MatchResult } from '@/shared/services/matching/types'

interface TfidfDetails {
  cvTokenSample: string[]
  jdTokenSample: string[]
  topJdTerms: { term: string; weight: number; inCV: boolean }[]
  cosineSimilarity: number
}

interface Props {
  result?: MatchResult
  details?: TfidfDetails
  error?: string
  isWinner?: boolean
}

export default function TfidfPanel({ result, details, error, isWinner }: Props) {
  return (
    <div className={`border rounded-lg overflow-hidden ${isWinner ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-semibold text-amber-900">① TF-IDF (Lexical)</h3>
            <p className="text-xs text-amber-800 mt-0.5">Khớp từ khoá theo tần suất + nghịch đảo tần suất tài liệu</p>
          </div>
          {isWinner && <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">cao nhất</span>}
        </div>
      </div>

      {/* How it works */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-700 space-y-1">
        <p><strong>Cách hoạt động:</strong></p>
        <ol className="list-decimal list-inside space-y-0.5 ml-1">
          <li>Tách CV và JD thành các <em>từ đơn</em> (tokens), loại bỏ stopwords</li>
          <li>Tính trọng số <em>TF × IDF</em> cho mỗi từ (từ hiếm → trọng số cao)</li>
          <li>Tạo vector 2 văn bản, tính <em>cosine similarity</em></li>
          <li>Nhân 100 → score 0-100</li>
        </ol>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50">{error}</div>
      )}

      {result && details && !error && (
        <div className="px-4 py-3 space-y-3 text-sm">
          {/* INPUT */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Input (sau tokenize)</p>
            <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
              <div>
                <span className="text-gray-500">CV ({details.cvTokenSample.length}+ tokens):</span>{' '}
                <span className="font-mono">{details.cvTokenSample.join(', ')}{details.cvTokenSample.length === 20 && '...'}</span>
              </div>
              <div>
                <span className="text-gray-500">JD ({details.jdTokenSample.length}+ tokens):</span>{' '}
                <span className="font-mono">{details.jdTokenSample.join(', ')}{details.jdTokenSample.length === 20 && '...'}</span>
              </div>
            </div>
          </div>

          {/* OUTPUT */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Output</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl font-bold text-amber-700">
                {result.score.toFixed(1)}<span className="text-base font-normal text-gray-400">/100</span>
              </div>
              <div className="text-xs text-gray-600">
                <div>cosine = <strong>{details.cosineSimilarity.toFixed(4)}</strong></div>
                <div>⏱ {result.latencyMs < 5 ? '<5ms' : `${result.latencyMs}ms`} · 💰 $0</div>
              </div>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                Top {details.topJdTerms.length} từ JD theo trọng số (xem cách TF-IDF chấm điểm)
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {details.topJdTerms.map(t => (
                  <div key={t.term} className={`px-2 py-0.5 rounded font-mono text-xs flex justify-between ${t.inCV ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
                    <span>{t.inCV ? '✓' : '✗'} {t.term}</span>
                    <span className="opacity-60">{t.weight.toFixed(3)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-gray-500">✓ = có trong CV, ✗ = thiếu (giải thích vì sao score thấp/cao)</p>
            </details>
          </div>
        </div>
      )}
    </div>
  )
}
