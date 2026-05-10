/**
 * /cv-match/[cvId] — JD Match Workflow page.
 *
 * Per-method panels (TF-IDF, Embedding, LLM) each show: how the method
 * works → input → output. A bottom comparison bar visualizes the cost-
 * quality trade-off (RQ2 narrative). Designed so an advisor reading this
 * page understands what each method actually did, not just the score.
 */
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TfidfPanel from '@/components/match/TfidfPanel'
import EmbeddingPanel from '@/components/match/EmbeddingPanel'
import LLMPanel from '@/components/match/LLMPanel'
import ComparisonBars from '@/components/match/ComparisonBars'
import JDInputPanel from '@/components/match/JDInputPanel'
import type { MatchResult, MethodName } from '@/shared/services/matching/types'
import { loadCVTextFromLocalStorage } from '@/utils/cvDataToText'

interface MatchResponse {
  results: Partial<Record<MethodName, MatchResult>>
  details: Partial<Record<MethodName, unknown>>
  errors?: Partial<Record<MethodName, string>>
  comparison: { winner: MethodName | null; deltaScores: Record<string, number> }
  totalLatencyMs: number
  totalCostUsd: number
  language: 'en' | 'vi'
}

export default function CVMatchPage() {
  const params = useParams<{ cvId: string }>()
  const cvId = params?.cvId
  const [cvText, setCvText] = useState('')
  const [jdText, setJdText] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [response, setResponse] = useState<MatchResponse | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [cvLoaded, setCvLoaded] = useState(false)

  // Hydrate cvText from the user's saved CV (cv_workflow_{cvId}) on mount.
  // Runs once: if user explicitly clears the textarea or pastes their own
  // text, we don't overwrite it.
  useEffect(() => {
    if (!cvId || cvLoaded) return
    const text = loadCVTextFromLocalStorage(cvId)
    if (text) {
      setCvText(text)
      setCvLoaded(true)
    }
  }, [cvId, cvLoaded])

  function reloadCVFromEditor() {
    if (!cvId) return
    const text = loadCVTextFromLocalStorage(cvId)
    if (text) setCvText(text)
  }

  async function runMatch() {
    setIsRunning(true)
    setResponse(null)
    setNetworkError(null)
    try {
      const r = await fetch('/api/cv/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, jdText }),
      })
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        throw new Error(e.error || `HTTP ${r.status}`)
      }
      const data = await r.json() as MatchResponse
      setResponse(data)
    } catch (e: any) {
      setNetworkError(e?.message ?? String(e))
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">
          So khớp CV với Mô tả công việc — So sánh 3 phương pháp
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Mỗi phương pháp được trình bày <em>tách biệt</em> để dễ so sánh:
          cách hoạt động · input · output thực tế.
          Mục đích thí nghiệm cho khoá luận Chương 4 §4.7 + Chương 5 đánh giá.
        </p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-amber-500" />
            TF-IDF — Lexical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-blue-500" />
            Embedding — Semantic
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-purple-500" />
            LLM — Reasoning
          </span>
        </div>
      </header>

      {/* INPUT — chung cho cả 3 phương pháp */}
      <section className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">📥 Input chung (CV + JD)</h2>
        {cvLoaded && (
          <div className="mb-3 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded p-3 text-sm">
            <span className="text-emerald-800">
              ✅ Đã tự động tải CV của bạn từ trang chỉnh sửa ({cvText.length} ký tự).
              Bạn có thể chỉnh sửa thêm trong ô bên dưới.
            </span>
            <button
              type="button"
              onClick={reloadCVFromEditor}
              className="text-xs px-3 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-100"
            >
              ⟳ Tải lại từ editor
            </button>
          </div>
        )}
        <JDInputPanel
          cvText={cvText}
          jdText={jdText}
          setCvText={setCvText}
          setJdText={setJdText}
          onRun={runMatch}
          isRunning={isRunning}
        />
      </section>

      {networkError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded p-4 text-sm">
          <strong>Lỗi khi so khớp:</strong> {networkError}
        </div>
      )}

      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded p-4 text-sm">
          ⏳ Đang chạy 3 phương pháp song song… TF-IDF ~1ms, Embedding ~200ms, LLM ~2-3s
        </div>
      )}

      {response && (
        <>
          {/* 3 PANEL TÁCH BIỆT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TfidfPanel
              result={response.results.tfidf}
              details={response.details.tfidf as any}
              error={response.errors?.tfidf}
              isWinner={response.comparison.winner === 'tfidf'}
            />
            <EmbeddingPanel
              result={response.results.embedding}
              details={response.details.embedding as any}
              error={response.errors?.embedding}
              isWinner={response.comparison.winner === 'embedding'}
            />
            <LLMPanel
              result={response.results.llm}
              details={response.details.llm as any}
              error={response.errors?.llm}
              isWinner={response.comparison.winner === 'llm'}
            />
          </div>

          {/* SO SÁNH TRỰC QUAN */}
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📊 So sánh trực quan 3 phương pháp (cost-quality trade-off)
            </h2>
            <ComparisonBars results={response.results} />

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-600">
              <span>Tổng độ trễ: <strong>{response.totalLatencyMs}ms</strong></span>
              <span>Tổng chi phí: <strong>${response.totalCostUsd.toFixed(6)}</strong></span>
              <span>Ngôn ngữ phát hiện: <strong>{response.language === 'vi' ? 'tiếng Việt' : 'English'}</strong></span>
              {response.comparison.winner && (
                <span>
                  Phương pháp cao nhất:{' '}
                  <strong className="text-emerald-700">
                    {response.comparison.winner === 'tfidf' && 'TF-IDF'}
                    {response.comparison.winner === 'embedding' && 'Embedding'}
                    {response.comparison.winner === 'llm' && 'LLM'}
                  </strong>
                </span>
              )}
            </div>
          </section>
        </>
      )}

      {!response && !networkError && !isRunning && (
        <p className="text-sm text-gray-500 italic text-center py-8">
          Dán JD vào ô bên phải rồi nhấn "So khớp" để xem cả 3 phương pháp chạy.
        </p>
      )}
    </div>
  )
}
