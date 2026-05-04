import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import type { CVFeedbackResult, SectionFeedback } from '../../types/cvFeedback'

interface CVFeedbackPanelProps {
  cvData: any
  language?: 'vi' | 'en'
}

const SECTION_LABELS: Record<string, string> = {
  contact: 'Thông tin liên hệ',
  summary: 'Tóm tắt chuyên môn',
  experience: 'Kinh nghiệm làm việc',
  skills: 'Kỹ năng',
  education: 'Học vấn',
}

function gradeColor(grade: string) {
  switch (grade) {
    case 'A': return 'text-green-600 bg-green-50 border-green-200'
    case 'B': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'D': return 'text-orange-600 bg-orange-50 border-orange-200'
    default:  return 'text-red-600 bg-red-50 border-red-200'
  }
}

function scoreBarColor(score: number) {
  if (score >= 85) return 'bg-green-500'
  if (score >= 70) return 'bg-blue-500'
  if (score >= 55) return 'bg-yellow-400'
  if (score >= 40) return 'bg-orange-400'
  return 'bg-red-500'
}

function SectionCard({ sectionId, feedback }: { sectionId: string; feedback: SectionFeedback }) {
  const [expanded, setExpanded] = useState(false)
  const label = SECTION_LABELS[sectionId] || sectionId

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <span className={`text-sm font-bold px-2 py-0.5 rounded border ${gradeColor(feedback.grade)} min-w-[28px] text-center`}>
          {feedback.grade}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(feedback.score)}`}
              style={{ width: `${feedback.score}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-600 w-8 text-right">{feedback.score}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100 space-y-3">
          {feedback.quickFix && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-0.5">Làm ngay</p>
                <p className="text-xs text-blue-800">{feedback.quickFix}</p>
              </div>
            </div>
          )}

          {feedback.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Điểm mạnh</p>
              <ul className="space-y-1">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Cần cải thiện</p>
              <ul className="space-y-1">
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CVFeedbackPanel({ cvData, language = 'vi' }: CVFeedbackPanelProps) {
  console.log('✅ CVFeedbackPanel mounted, cvData:', !!cvData)
  const [feedback, setFeedback] = useState<CVFeedbackResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'ai' | 'fallback' | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setFeedback(null)

    try {
      const res = await fetch('/api/cv/score-feedback', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể phân tích CV')
      }

      setFeedback(json.data)
      setSource(json.source)
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const sectionOrder: Array<keyof CVFeedbackResult['sections']> = [
    'contact', 'summary', 'experience', 'skills', 'education',
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-xl">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Chấm điểm CV</h3>
              <p className="text-xs text-slate-500">
                {feedback ? 'Nhấn vào từng phần để xem gợi ý chi tiết' : 'AI đánh giá cấu trúc & độ đầy đủ của CV'}
              </p>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                {feedback ? 'Phân tích lại' : 'Chấm điểm ngay'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {feedback && (
        <div className="px-6 py-5 space-y-5">
          {/* Overall score */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
            <div className={`text-3xl font-bold px-4 py-2 rounded-xl border-2 ${gradeColor(feedback.overallGrade)}`}>
              {feedback.overallGrade}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-gray-800">{feedback.overallScore}</span>
                <span className="text-sm text-gray-500">/ 100</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(feedback.overallScore)}`}
                  style={{ width: `${feedback.overallScore}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">{feedback.overallSummary}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">ATS</p>
              <p className={`text-lg font-bold ${feedback.atsScore >= 70 ? 'text-green-600' : feedback.atsScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {feedback.atsScore}%
              </p>
            </div>
          </div>

          {/* Top priorities */}
          {feedback.topPriorities.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Ưu tiên hàng đầu</p>
              <ol className="space-y-1">
                {feedback.topPriorities.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-orange-800">
                    <span className="font-bold flex-shrink-0">{i + 1}.</span>
                    {p}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Section breakdown */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Chi tiết từng phần</p>
            <div className="space-y-2">
              {sectionOrder.map(sectionId => (
                <SectionCard
                  key={sectionId}
                  sectionId={sectionId}
                  feedback={feedback.sections[sectionId]}
                />
              ))}
            </div>
          </div>

          {/* ATS tips */}
          {feedback.atsTips.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Mẹo tương thích ATS</p>
              <ul className="space-y-1">
                {feedback.atsTips.map((t, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-blue-800">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {source === 'fallback' && (
            <p className="text-xs text-gray-400 text-center">* Phân tích cơ bản (AI không khả dụng)</p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!feedback && !loading && !error && (
        <div className="px-6 py-8 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium mb-1">Nhấn "Chấm điểm ngay"</p>
          <p className="text-xs">AI đánh giá cấu trúc CV và gợi ý bổ sung những phần còn thiếu</p>
        </div>
      )}
    </div>
  )
}
