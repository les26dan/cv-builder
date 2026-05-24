'use client'

import { useState } from 'react'

interface JobCardProps {
  job: {
    id: string
    title: string
    category: string
    jdPreview: string
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
    score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-gray-400'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500 text-xs">{description}</span>
        <span className="text-gray-800 font-semibold ml-2">{score}%</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export default function JobCard({ job }: JobCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  const scoreColor =
    job.finalScore >= 70
      ? 'text-green-600'
      : job.finalScore >= 50
      ? 'text-yellow-500'
      : 'text-gray-400'

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 font-inter">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Rank badge */}
          <span className="flex-none inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
            #{job.rank}
          </span>

          {/* Title + category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 leading-snug">
              {job.title}
            </h3>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              {job.category}
            </span>
          </div>
        </div>

        {/* Final score */}
        <span className={`flex-none text-2xl font-bold ${scoreColor}`}>
          {job.finalScore}%
        </span>
      </div>

      {/* Reason */}
      <p className="mt-2 text-sm italic text-gray-600 leading-relaxed">
        {job.reason}
      </p>

      {/* JD Preview */}
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
        {job.jdPreview}
      </p>

      {/* Score breakdown toggle */}
      <div className="mt-3">
        <button
          onClick={() => setShowBreakdown((prev) => !prev)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
        >
          {showBreakdown ? 'Thu gon' : 'Chi tiet diem so'}
        </button>

        {showBreakdown && (
          <div className="mt-3 flex flex-col gap-3 bg-gray-50 rounded-md p-3">
            <ScoreBar
              label="Hybrid"
              score={job.hybridScore}
              description="Tim kiem ngu nghia"
            />
            <ScoreBar
              label="Structural"
              score={job.structuralScore}
              description="Khop ky nang/kinh nghiem"
            />
            <ScoreBar
              label="LLM"
              score={job.llmScore}
              description="Danh gia tong the AI"
            />
          </div>
        )}
      </div>
    </div>
  )
}
