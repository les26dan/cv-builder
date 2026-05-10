/**
 * EmbeddingPanel — explain Embedding method: model, vectors, cosine.
 */
'use client'

import type { MatchResult } from '@/shared/services/matching/types'

interface EmbeddingDetails {
  model: string
  dim: number
  cvVectorPreview: number[]
  jdVectorPreview: number[]
  cosineSimilarity: number
  inputTokens: number
}

interface Props {
  result?: MatchResult
  details?: EmbeddingDetails
  error?: string
  isWinner?: boolean
}

function fmtVec(v: number[]): string {
  return '[' + v.map(x => x.toFixed(4)).join(', ') + ', …]'
}

export default function EmbeddingPanel({ result, details, error, isWinner }: Props) {
  return (
    <div className={`border rounded-lg overflow-hidden ${isWinner ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200'}`}>
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">② Embedding (Semantic)</h3>
            <p className="text-xs text-blue-800 mt-0.5">Vector ngữ nghĩa do mô hình neural sinh ra</p>
          </div>
          {isWinner && <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">cao nhất</span>}
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-700 space-y-1">
        <p><strong>Cách hoạt động:</strong></p>
        <ol className="list-decimal list-inside space-y-0.5 ml-1">
          <li>Gửi CV và JD lên OpenAI <code className="bg-gray-200 px-1 rounded">text-embedding-3-small</code></li>
          <li>API trả về mỗi văn bản 1 <em>vector 1536 chiều</em> biểu diễn ngữ nghĩa</li>
          <li>Vector học từ hàng tỷ văn bản → các đoạn nghĩa giống nhau có vector gần nhau</li>
          <li>Tính cosine similarity giữa 2 vector → score 0-100</li>
        </ol>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-rose-700 bg-rose-50">{error}</div>
      )}

      {result && details && !error && (
        <div className="px-4 py-3 space-y-3 text-sm">
          {/* INPUT */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Input (CV và JD nguyên văn, không tokenize)
            </p>
            <div className="bg-gray-50 rounded p-2 text-xs">
              <div className="text-gray-500">
                Mô hình: <code className="bg-white px-1 rounded">{details.model}</code> ·
                Chiều: <strong>{details.dim}</strong> ·
                Tokens dùng: <strong>{details.inputTokens}</strong>
              </div>
            </div>
          </div>

          {/* INTERMEDIATE — vectors */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Vector trung gian (preview 8/{details.dim} chiều đầu)
            </p>
            <div className="bg-gray-50 rounded p-2 text-xs font-mono space-y-1 overflow-x-auto">
              <div><span className="text-gray-500">CV:</span> {fmtVec(details.cvVectorPreview)}</div>
              <div><span className="text-gray-500">JD:</span> {fmtVec(details.jdVectorPreview)}</div>
            </div>
          </div>

          {/* OUTPUT */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Output</p>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-blue-700">
                {result.score.toFixed(1)}<span className="text-base font-normal text-gray-400">/100</span>
              </div>
              <div className="text-xs text-gray-600">
                <div>cosine = <strong>{details.cosineSimilarity.toFixed(4)}</strong></div>
                <div>⏱ {result.latencyMs}ms · 💰 ${result.costUsd.toFixed(7)}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 italic">
              Lưu ý: Embedding KHÔNG cho biết "từ khoá nào khớp" — chỉ số tổng.
              Đây là <em>hạn chế quan trọng</em> mà phương pháp LLM bên cạnh khắc phục.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
