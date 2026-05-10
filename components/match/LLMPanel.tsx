/**
 * LLMPanel — explain LLM method: full prompt + raw JSON response.
 */
'use client'

import type { MatchResult } from '@/shared/services/matching/types'

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

interface Props {
  result?: MatchResult
  details?: LLMDetails
  error?: string
  isWinner?: boolean
}

export default function LLMPanel({ result, details, error, isWinner }: Props) {
  return (
    <div className={`border rounded-lg overflow-hidden ${isWinner ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200'}`}>
      <div className="bg-purple-50 border-b border-purple-200 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-semibold text-purple-900">③ LLM (Reasoning)</h3>
            <p className="text-xs text-purple-800 mt-0.5">AI đọc hiểu CV + JD, tự chấm và giải thích</p>
          </div>
          {isWinner && <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">cao nhất</span>}
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-700 space-y-1">
        <p><strong>Cách hoạt động:</strong></p>
        <ol className="list-decimal list-inside space-y-0.5 ml-1">
          <li>Gửi prompt có cấu trúc đến OpenAI <code className="bg-gray-200 px-1 rounded">gpt-4o-mini</code></li>
          <li>Prompt gồm: system instruction + CV + JD + yêu cầu trả JSON</li>
          <li>GPT đọc hiểu <em>toàn bộ ngữ cảnh</em> — không chỉ từ khoá</li>
          <li>Trả về JSON: score, matchedKeywords, missingKeywords, reasoning</li>
        </ol>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50">{error}</div>
      )}

      {result && details && !error && (
        <div className="px-4 py-3 space-y-3 text-sm">
          {/* INPUT — prompt */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Input (prompt gửi đến GPT, ngôn ngữ: <strong>{details.language === 'vi' ? 'tiếng Việt' : 'English'}</strong>)
            </p>
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900 bg-gray-50 px-2 py-1 rounded">
                System prompt ({details.systemPrompt.length} chars) — click để xem
              </summary>
              <pre className="mt-1 bg-gray-50 rounded p-2 whitespace-pre-wrap text-xs font-mono max-h-32 overflow-y-auto">{details.systemPrompt}</pre>
            </details>
            <details className="text-xs mt-1">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900 bg-gray-50 px-2 py-1 rounded">
                User prompt ({details.userPrompt.length} chars) — click để xem
              </summary>
              <pre className="mt-1 bg-gray-50 rounded p-2 whitespace-pre-wrap text-xs font-mono max-h-48 overflow-y-auto">{details.userPrompt}</pre>
            </details>
            <div className="text-xs text-gray-500 mt-1">
              Mô hình: <code className="bg-gray-100 px-1 rounded">{details.model}</code> ·
              Input tokens: <strong>{details.inputTokens}</strong> ·
              Output tokens: <strong>{details.outputTokens}</strong>
            </div>
          </div>

          {/* OUTPUT — raw JSON */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Output (JSON GPT trả về)
            </p>
            <pre className="bg-gray-900 text-gray-100 rounded p-2 text-xs font-mono overflow-x-auto">
{JSON.stringify(details.rawJsonResponse, null, 2)}
            </pre>
          </div>

          {/* Score summary */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tóm tắt</p>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-purple-700">
                {result.score.toFixed(0)}<span className="text-base font-normal text-gray-400">/100</span>
              </div>
              <div className="text-xs text-gray-600">
                <div>⏱ {result.latencyMs}ms · 💰 ${result.costUsd.toFixed(6)}</div>
                <div>{details.inputTokens + details.outputTokens} tokens tổng cộng</div>
              </div>
            </div>
            {details.rawJsonResponse.reasoning && (
              <p className="mt-2 text-sm text-gray-700 italic border-l-2 border-purple-300 pl-3">
                {details.rawJsonResponse.reasoning}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
