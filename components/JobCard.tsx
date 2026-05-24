'use client'

import { useState } from 'react'

interface JobCardProps {
  job: {
    id: string
    title: string
    category: string
    source?: string
    sourceUrl?: string | null
    jdPreview: string
    jdFull?: string
    hybridScore: number
    structuralScore: number
    llmScore: number
    finalScore: number
    reason: string
    rank: number
  }
}

function ScoreBar({ label, score, description }: { label: string; score: number; description: string }) {
  const barColor =
    score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-gray-300'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-400">{description}</span>
        <span className="text-gray-800 font-semibold ml-2">{score}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function JobCard({ job }: JobCardProps) {
  const [jdExpanded, setJdExpanded] = useState(false)
  const [showScores, setShowScores] = useState(false)

  const scoreColor =
    job.finalScore >= 70 ? 'text-green-600' :
    job.finalScore >= 50 ? 'text-yellow-500' : 'text-gray-400'

  const scoreBg =
    job.finalScore >= 70 ? 'bg-green-50 border-green-200' :
    job.finalScore >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'

  const jdText = job.jdFull || job.jdPreview || ''
  const linkedInSearch = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}`
  const googleSearch = `https://www.google.com/search?q=${encodeURIComponent(job.title + ' tuyển dụng')}`

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden font-inter">
      <div className="p-5">
        {/* Top row: rank + title + score */}
        <div className="flex items-start gap-3">
          <span className="flex-none inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
            #{job.rank}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-gray-900 leading-snug">{job.title}</h3>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              {job.category}
            </span>
          </div>
          <div className={`flex-none text-center px-3 py-1.5 rounded-lg border ${scoreBg}`}>
            <span className={`text-xl font-bold ${scoreColor}`}>{Math.round(job.finalScore)}%</span>
            <p className="text-xs text-gray-400 leading-none mt-0.5">phù hợp</p>
          </div>
        </div>

        {/* AI reason */}
        <p className="mt-3 text-sm italic text-gray-600 leading-relaxed border-l-2 border-blue-200 pl-3">
          {job.reason}
        </p>

        {/* JD section — always visible, expandable */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Mô tả công việc</span>
            <button
              onClick={() => setJdExpanded(v => !v)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {jdExpanded ? (
                <>Thu gọn <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg></>
              ) : (
                <>Xem đầy đủ <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg></>
              )}
            </button>
          </div>

          {!jdExpanded ? (
            <div className="relative">
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{jdText}</p>
              <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-lg bg-gray-50 border border-gray-100 p-3">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{jdText}</p>
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-3">
          {/* Apply buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Ứng tuyển:</span>
            {job.sourceUrl ? (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Xem trên VietnamWorks
              </a>
            ) : null}
            <a
              href={linkedInSearch}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
            <a
              href={googleSearch}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-xs font-medium rounded-lg transition-colors bg-white hover:bg-gray-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Google
            </a>
          </div>

          {/* Score toggle */}
          <button
            onClick={() => setShowScores(v => !v)}
            className="self-start text-xs text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {showScores ? 'Ẩn điểm chi tiết' : 'Xem điểm chi tiết'}
          </button>
        </div>
      </div>

      {/* Score breakdown */}
      {showScores && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 flex flex-col gap-3">
          <ScoreBar label="Hybrid" score={Math.round(job.hybridScore)} description="TF-IDF + Embedding" />
          <ScoreBar label="Structural" score={job.structuralScore} description="Kỹ năng / Kinh nghiệm / Học vấn" />
          <ScoreBar label="LLM" score={job.llmScore} description="Đánh giá tổng thể AI" />
        </div>
      )}
    </div>
  )
}
