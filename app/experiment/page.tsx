'use client'

import { useState } from 'react'

interface PairScore {
  score: number
  latencyMs: number
  costUsd: number
}

interface ExperimentPair {
  pairId: string
  label: 0 | 1
  resumeCategory: string
  jdCategory: string
  resumeText: string
  jdText: string
  scores: {
    tfidf: PairScore
    embedding: PairScore
    llm: PairScore
  }
  liveScores?: {
    tfidf?: number
    embedding?: number
    llm?: number
    llmExplanation?: string
  }
  isRunning?: boolean
}

const SAMPLE_PAIRS: ExperimentPair[] = [
  {
    pairId: 'p-0', label: 1,
    resumeCategory: 'ACCOUNTANT', jdCategory: 'ACCOUNTANT',
    resumeText: 'SENIOR ACCOUNTANT. Prepare quarterly and annual financial statements for 17 multi-family communities. Reconcile and account for all activity on the income statement and balance sheet including cash, fixed assets. Review accounts payable invoices for proper coding and approval. Prepare monthly bank reconciliations. Skills: QuickBooks, Excel, GAAP, financial reporting, tax preparation.',
    jdText: 'We are looking for a Senior Accountant to join our team. Responsibilities: prepare financial statements, manage accounts payable and receivable, perform month-end close procedures, ensure compliance with GAAP. Requirements: CPA preferred, 5+ years experience, proficiency in QuickBooks and Excel.',
    scores: { tfidf: { score: 4.1, latencyMs: 1, costUsd: 0 }, embedding: { score: 45.5, latencyMs: 0, costUsd: 0 }, llm: { score: 70, latencyMs: 4975, costUsd: 0.00026 } }
  },
  {
    pairId: 'p-1', label: 1,
    resumeCategory: 'TEACHER', jdCategory: 'TEACHER',
    resumeText: 'HIGH SCHOOL TEACHER. 8 years teaching Mathematics and Science grades 9-12. Developed curriculum aligned with Common Core standards. Managed classroom of 30 students. Coordinated after-school tutoring program. Skills: curriculum development, classroom management, student assessment, differentiated instruction, Google Classroom.',
    jdText: 'Secondary School Teacher needed for Mathematics. Responsibilities: teach algebra and geometry to grades 9-12, develop lesson plans, assess student performance, communicate with parents. Requirements: Teaching credential required, experience with differentiated instruction preferred.',
    scores: { tfidf: { score: 3.0, latencyMs: 1, costUsd: 0 }, embedding: { score: 34.8, latencyMs: 0, costUsd: 0 }, llm: { score: 20, latencyMs: 3200, costUsd: 0.00024 } }
  },
  {
    pairId: 'p-2', label: 1,
    resumeCategory: 'CONSTRUCTION', jdCategory: 'CONSTRUCTION',
    resumeText: 'CONSTRUCTION PROJECT MANAGER. Managed commercial construction projects valued up to $15M. Supervised teams of 20+ subcontractors. Ensured compliance with OSHA safety regulations. Coordinated with architects and engineers. Experience: concrete, steel framing, MEP systems. Skills: AutoCAD, MS Project, Procore, blueprint reading.',
    jdText: 'Construction Project Manager for commercial projects. Oversee all phases of construction from groundbreaking to completion. Manage subcontractors, budgets, and schedules. Ensure safety compliance. Requirements: 5+ years commercial construction experience, PMP certification preferred, proficiency in Procore.',
    scores: { tfidf: { score: 6.9, latencyMs: 1, costUsd: 0 }, embedding: { score: 34.5, latencyMs: 0, costUsd: 0 }, llm: { score: 20, latencyMs: 2800, costUsd: 0.00022 } }
  },
  {
    pairId: 'p-3', label: 1,
    resumeCategory: 'AGRICULTURE', jdCategory: 'AGRICULTURE',
    resumeText: 'FARM MANAGER. 10 years managing 500-acre crop farm. Oversaw planting, irrigation, and harvest of corn and soybeans. Managed team of 15 seasonal workers. Implemented precision agriculture techniques using GPS and drone technology. Maintained farm equipment. Knowledge of pesticide application and soil management.',
    jdText: 'Farm Operations Manager. Manage day-to-day agricultural operations including crop planning, irrigation systems, and harvest scheduling. Supervise farmworkers. Maintain equipment. Knowledge of sustainable farming practices required. Experience with precision agriculture technology preferred.',
    scores: { tfidf: { score: 6.0, latencyMs: 1, costUsd: 0 }, embedding: { score: 42.6, latencyMs: 0, costUsd: 0 }, llm: { score: 10, latencyMs: 3100, costUsd: 0.00023 } }
  },
  {
    pairId: 'p-5', label: 1,
    resumeCategory: 'HR', jdCategory: 'HR',
    resumeText: 'HR MANAGER. 7 years in human resources at Fortune 500 companies. Managed full-cycle recruitment for 200+ positions annually. Designed and implemented onboarding programs. Administered benefits and compensation programs. Handled employee relations issues and performance management. SHRM-CP certified. Skills: Workday, ADP, talent acquisition, HRIS.',
    jdText: 'Human Resources Manager. Lead HR operations including recruitment, employee relations, benefits administration, and compliance. Partner with leadership on workforce planning. Requirements: SHRM certification preferred, 5+ years HR experience, experience with HRIS systems, strong knowledge of employment law.',
    scores: { tfidf: { score: 15.8, latencyMs: 1, costUsd: 0 }, embedding: { score: 58.2, latencyMs: 0, costUsd: 0 }, llm: { score: 75, latencyMs: 5200, costUsd: 0.00028 } }
  },
  {
    pairId: 'p-6', label: 0,
    resumeCategory: 'CONSTRUCTION', jdCategory: 'CONSULTANT',
    resumeText: 'CONSTRUCTION PROJECT MANAGER. Managed commercial construction projects valued up to $15M. Supervised teams of 20+ subcontractors. Ensured compliance with OSHA safety regulations. Coordinated with architects and engineers. Experience: concrete, steel framing, MEP systems. Skills: AutoCAD, MS Project, Procore, blueprint reading.',
    jdText: 'Management Consultant. Provide strategic advisory services to Fortune 500 clients across industries. Analyze business processes, identify improvement opportunities, develop implementation roadmaps. Requirements: MBA preferred, 3+ years consulting experience, strong analytical and presentation skills, proficiency in PowerPoint and Excel.',
    scores: { tfidf: { score: 5.7, latencyMs: 1, costUsd: 0 }, embedding: { score: 39.9, latencyMs: 0, costUsd: 0 }, llm: { score: 20, latencyMs: 2900, costUsd: 0.00021 } }
  },
  {
    pairId: 'p-8', label: 0,
    resumeCategory: 'FITNESS', jdCategory: 'APPAREL',
    resumeText: 'PERSONAL TRAINER & FITNESS COACH. Certified personal trainer with 6 years experience. Designed customized workout programs for 50+ clients. Taught group fitness classes including HIIT, yoga, and cycling. Nutritional coaching and meal planning. Managed gym floor operations. Skills: CPR certified, NASM-CPT, fitness assessment.',
    jdText: 'Apparel Merchandising Manager. Develop and execute merchandising strategies for women\'s clothing line. Manage product assortment planning, inventory allocation, and vendor relationships. Analyze sales trends and customer data. Requirements: fashion merchandising degree, 4+ years retail experience, strong Excel and analytical skills.',
    scores: { tfidf: { score: 2.1, latencyMs: 1, costUsd: 0 }, embedding: { score: 34.0, latencyMs: 0, costUsd: 0 }, llm: { score: 40, latencyMs: 3400, costUsd: 0.00025 } }
  },
  {
    pairId: 'p-13', label: 0,
    resumeCategory: 'ADVOCATE', jdCategory: 'BUSINESS-DEVELOPMENT',
    resumeText: 'ATTORNEY / LEGAL ADVOCATE. Licensed attorney with 9 years litigation experience. Represented clients in civil and criminal matters. Drafted legal briefs, motions, and contracts. Conducted depositions and trial proceedings. Specialized in employment law and contract disputes. Bar admissions: NY, NJ. Skills: legal research, Westlaw, negotiation.',
    jdText: 'Business Development Manager. Drive revenue growth by identifying and pursuing new business opportunities. Build relationships with enterprise clients. Develop go-to-market strategies and sales pipelines. Negotiate contracts and close deals. Requirements: 5+ years B2B sales experience, CRM proficiency, strong negotiation skills.',
    scores: { tfidf: { score: 16.9, latencyMs: 1, costUsd: 0 }, embedding: { score: 46.3, latencyMs: 0, costUsd: 0 }, llm: { score: 60, latencyMs: 4800, costUsd: 0.00027 } }
  },
  {
    pairId: 'p-14', label: 0,
    resumeCategory: 'DIGITAL-MEDIA', jdCategory: 'BANKING',
    resumeText: 'DIGITAL MEDIA MANAGER. 5 years managing social media and digital content for brands. Grew Instagram following from 10K to 500K. Managed $2M annual digital advertising budget across Meta, Google, TikTok. Created video content and graphic design. Analytics: Google Analytics, Meta Ads Manager. Skills: SEO, content strategy, video editing.',
    jdText: 'Retail Banking Branch Manager. Oversee daily branch operations, manage teller staff, ensure regulatory compliance. Drive deposit growth and loan origination targets. Build customer relationships. Requirements: 5+ years banking experience, Series 6/63 licenses preferred, strong knowledge of banking regulations.',
    scores: { tfidf: { score: 3.2, latencyMs: 1, costUsd: 0 }, embedding: { score: 35.5, latencyMs: 0, costUsd: 0 }, llm: { score: 20, latencyMs: 3600, costUsd: 0.00024 } }
  },
  {
    pairId: 'p-16', label: 0,
    resumeCategory: 'CONSULTANT', jdCategory: 'HEALTHCARE',
    resumeText: 'MANAGEMENT CONSULTANT. 8 years at Big 4 consulting firm. Led digital transformation projects for retail and manufacturing clients. Managed teams of 10 consultants. Delivered $50M in cost savings for clients. Expertise in process optimization, change management, and ERP implementation. Skills: SAP, PowerBI, Six Sigma Black Belt.',
    jdText: 'Registered Nurse - ICU. Provide critical care to patients in intensive care unit. Administer medications, monitor vital signs, operate life-support equipment. Collaborate with physicians and care teams. Requirements: RN license required, BSN preferred, 2+ years ICU experience, BLS and ACLS certification.',
    scores: { tfidf: { score: 3.2, latencyMs: 1, costUsd: 0 }, embedding: { score: 35.8, latencyMs: 0, costUsd: 0 }, llm: { score: 0, latencyMs: 2700, costUsd: 0.00020 } }
  },
]

function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
        <div className={`h-full rounded transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono w-10 text-right">{score.toFixed(0)}</span>
    </div>
  )
}

function MethodCorrect({ score, label, method }: { score: number; label: 0 | 1; method: string }) {
  // threshold: tfidf>5, embedding>40, llm>50
  const thresholds: Record<string, number> = { tfidf: 5, embedding: 40, llm: 50 }
  const predicted = score >= thresholds[method] ? 1 : 0
  const correct = predicted === label
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {correct ? '✓ đúng' : '✗ sai'}
    </span>
  )
}

export default function ExperimentPage() {
  const [pairs, setPairs] = useState<ExperimentPair[]>(SAMPLE_PAIRS)
  const [expandedPair, setExpandedPair] = useState<string | null>(null)
  const [runningAll, setRunningAll] = useState(false)
  const [liveResults, setLiveResults] = useState<Record<string, ExperimentPair['liveScores']>>({})

  async function runPair(pair: ExperimentPair) {
    setPairs(prev => prev.map(p => p.pairId === pair.pairId ? { ...p, isRunning: true } : p))
    try {
      const res = await fetch('/api/cv/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: pair.resumeText, jdText: pair.jdText })
      })
      const data = await res.json()
      const live: ExperimentPair['liveScores'] = {
        tfidf: data.results?.tfidf?.score,
        embedding: data.results?.embedding?.score,
        llm: data.results?.llm?.score,
        llmExplanation: data.details?.llm?.explanation || data.results?.llm?.explanation,
      }
      setLiveResults(prev => ({ ...prev, [pair.pairId]: live }))
    } catch (e) {
      console.error(e)
    }
    setPairs(prev => prev.map(p => p.pairId === pair.pairId ? { ...p, isRunning: false } : p))
  }

  async function runAll() {
    setRunningAll(true)
    for (const pair of pairs) {
      await runPair(pair)
    }
    setRunningAll(false)
  }

  const positivePairs = pairs.filter(p => p.label === 1)
  const negativePairs = pairs.filter(p => p.label === 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Thí nghiệm: So sánh 3 phương pháp đo độ phù hợp CV–JD</h1>
          <p className="text-gray-600 mt-1">
            10 cặp mẫu từ bộ dữ liệu 400 cặp Kaggle · 5 cặp <span className="text-green-700 font-medium">phù hợp (positive)</span> · 5 cặp <span className="text-red-700 font-medium">không phù hợp (negative)</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Kết quả hiển thị từ thí nghiệm đã chạy. Nhấn "Chạy lại" để gọi API thật và so sánh với kết quả gốc.
          </p>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg border p-4 mb-6 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Thang điểm:</span>
            <span className="ml-2 text-gray-600">TF-IDF: 0–100 · Embedding: 0–100 (cosine ×100) · LLM: 0–100</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Ngưỡng phân loại:</span>
            <span className="ml-2 text-gray-600">TF-IDF ≥ 5 · Embedding ≥ 40 · LLM ≥ 50</span>
          </div>
        </div>

        {/* Run all button */}
        <div className="mb-6">
          <button
            onClick={runAll}
            disabled={runningAll}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {runningAll ? (
              <><span className="animate-spin">⟳</span> Đang chạy API thật cho tất cả cặp…</>
            ) : (
              '▶ Chạy lại tất cả 10 cặp qua API'
            )}
          </button>
        </div>

        {/* Positive pairs */}
        <h2 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-sm">POSITIVE</span>
          Cặp phù hợp — CV và JD cùng ngành
        </h2>
        <div className="space-y-3 mb-8">
          {positivePairs.map(pair => (
            <PairCard
              key={pair.pairId}
              pair={pair}
              liveScore={liveResults[pair.pairId]}
              expanded={expandedPair === pair.pairId}
              onToggle={() => setExpandedPair(expandedPair === pair.pairId ? null : pair.pairId)}
              onRun={() => runPair(pair)}
            />
          ))}
        </div>

        {/* Negative pairs */}
        <h2 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-sm">NEGATIVE</span>
          Cặp không phù hợp — CV và JD khác ngành
        </h2>
        <div className="space-y-3 mb-8">
          {negativePairs.map(pair => (
            <PairCard
              key={pair.pairId}
              pair={pair}
              liveScore={liveResults[pair.pairId]}
              expanded={expandedPair === pair.pairId}
              onToggle={() => setExpandedPair(expandedPair === pair.pairId ? null : pair.pairId)}
              onRun={() => runPair(pair)}
            />
          ))}
        </div>

        {/* Summary */}
        <SummaryTable pairs={pairs} liveResults={liveResults} />
      </div>
    </div>
  )
}

function PairCard({
  pair, liveScore, expanded, onToggle, onRun
}: {
  pair: ExperimentPair
  liveScore?: ExperimentPair['liveScores']
  expanded: boolean
  onToggle: () => void
  onRun: () => void
}) {
  const isPositive = pair.label === 1
  const borderColor = isPositive ? 'border-green-200' : 'border-red-200'
  const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50'
  const tagColor = isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'

  return (
    <div className={`bg-white rounded-lg border ${borderColor} shadow-sm overflow-hidden`}>
      {/* Header row */}
      <div
        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${bgColor}`}
        onClick={onToggle}
      >
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${tagColor}`}>
          {isPositive ? '✓ PHÙHỢP' : '✗ KHÔNG PHÙ HỢP'}
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-800 text-sm">
            CV: <span className="text-blue-700">{pair.resumeCategory}</span>
            <span className="text-gray-400 mx-2">→</span>
            JD: <span className="text-purple-700">{pair.jdCategory}</span>
          </span>
        </div>
        {/* Mini scores */}
        <div className="flex gap-4 text-xs font-mono text-gray-600">
          <span title="TF-IDF">TF: <b>{pair.scores.tfidf.score.toFixed(1)}</b></span>
          <span title="Embedding">Emb: <b>{pair.scores.embedding.score.toFixed(1)}</b></span>
          <span title="LLM">LLM: <b>{pair.scores.llm.score.toFixed(0)}</b></span>
        </div>
        {liveScore && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">Live ✓</span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onRun() }}
          disabled={pair.isRunning}
          className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {pair.isRunning ? '⟳' : 'Chạy lại'}
        </button>
        <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="p-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">CV ({pair.resumeCategory})</p>
              <p className="text-xs text-gray-700 bg-gray-50 rounded p-2 leading-relaxed line-clamp-6">{pair.resumeText}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">JD ({pair.jdCategory})</p>
              <p className="text-xs text-gray-700 bg-gray-50 rounded p-2 leading-relaxed line-clamp-6">{pair.jdText}</p>
            </div>
          </div>

          {/* Score comparison */}
          <div className="grid grid-cols-3 gap-4">
            {/* TF-IDF */}
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Đếm trùng từ (TF-IDF)</p>
              <ScoreBar score={pair.scores.tfidf.score} max={30} color="bg-gray-400" />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <MethodCorrect score={pair.scores.tfidf.score} label={pair.label} method="tfidf" />
                <span>{pair.scores.tfidf.latencyMs} ms · $0</span>
              </div>
              {liveScore?.tfidf !== undefined && (
                <p className="text-xs mt-1 text-yellow-700">Live: <b>{liveScore.tfidf?.toFixed(1)}</b></p>
              )}
            </div>

            {/* Embedding */}
            <div className="bg-blue-50 rounded p-3">
              <p className="text-xs font-semibold text-blue-700 mb-2">So sánh nghĩa (Embedding)</p>
              <ScoreBar score={pair.scores.embedding.score} max={100} color="bg-blue-400" />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <MethodCorrect score={pair.scores.embedding.score} label={pair.label} method="embedding" />
                <span>~0 ms · $0</span>
              </div>
              {liveScore?.embedding !== undefined && (
                <p className="text-xs mt-1 text-yellow-700">Live: <b>{liveScore.embedding?.toFixed(1)}</b></p>
              )}
            </div>

            {/* LLM */}
            <div className="bg-purple-50 rounded p-3">
              <p className="text-xs font-semibold text-purple-700 mb-2">Nhờ LLM chấm điểm</p>
              <ScoreBar score={pair.scores.llm.score} max={100} color="bg-purple-400" />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <MethodCorrect score={pair.scores.llm.score} label={pair.label} method="llm" />
                <span>~{(pair.scores.llm.latencyMs / 1000).toFixed(1)}s · ${pair.scores.llm.costUsd.toFixed(4)}</span>
              </div>
              {liveScore?.llm !== undefined && (
                <p className="text-xs mt-1 text-yellow-700">Live: <b>{liveScore.llm}</b></p>
              )}
              {liveScore?.llmExplanation && (
                <p className="text-xs mt-2 text-purple-800 bg-purple-100 rounded p-2 italic">
                  "{liveScore.llmExplanation}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryTable({ pairs, liveResults }: { pairs: ExperimentPair[], liveResults: Record<string, ExperimentPair['liveScores']> }) {
  const thresholds: Record<string, number> = { tfidf: 5, embedding: 40, llm: 50 }

  let tfidfCorrect = 0, embCorrect = 0, llmCorrect = 0
  for (const p of pairs) {
    if ((p.scores.tfidf.score >= thresholds.tfidf ? 1 : 0) === p.label) tfidfCorrect++
    if ((p.scores.embedding.score >= thresholds.embedding ? 1 : 0) === p.label) embCorrect++
    if ((p.scores.llm.score >= thresholds.llm ? 1 : 0) === p.label) llmCorrect++
  }

  return (
    <div className="space-y-6">
      {/* 10-pair summary */}
      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Tổng kết trên 10 cặp mẫu</h3>
        <p className="text-xs text-gray-400 mb-3">Kết quả từ 10 cặp hiển thị ở trên</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 text-gray-600 font-medium">Phương pháp</th>
              <th className="text-center py-2 text-gray-600 font-medium">Phân loại đúng / 10</th>
              <th className="text-center py-2 text-gray-600 font-medium">Tốc độ</th>
              <th className="text-center py-2 text-gray-600 font-medium">Chi phí / 1.000 cặp</th>
              <th className="text-center py-2 text-gray-600 font-medium">Giải thích?</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-medium">Đếm trùng từ (TF-IDF)</td>
              <td className="text-center py-2">{tfidfCorrect}/10</td>
              <td className="text-center py-2">~1 ms</td>
              <td className="text-center py-2">$0</td>
              <td className="text-center py-2 text-red-500">✗</td>
            </tr>
            <tr className="border-b bg-blue-50">
              <td className="py-2 font-medium text-blue-700">So sánh nghĩa (Embedding)</td>
              <td className="text-center py-2 font-bold">{embCorrect}/10</td>
              <td className="text-center py-2">~0 ms (cache)</td>
              <td className="text-center py-2">$0</td>
              <td className="text-center py-2 text-red-500">✗</td>
            </tr>
            <tr className="bg-purple-50">
              <td className="py-2 font-medium text-purple-700">Nhờ LLM chấm điểm</td>
              <td className="text-center py-2">{llmCorrect}/10</td>
              <td className="text-center py-2">~3–5 s</td>
              <td className="text-center py-2">$0.28</td>
              <td className="text-center py-2 text-green-600 font-bold">✓ Chi tiết</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Full 400-pair results */}
      <div className="bg-white rounded-lg border border-indigo-200 p-5">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-semibold text-gray-800">Kết quả đầy đủ — toàn bộ 400 cặp</h3>
          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded">200 positive · 200 negative</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Kiểm định thống kê Wilcoxon signed-rank test · p &lt; 0,05 = sự khác biệt có ý nghĩa</p>

        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-2 px-2 text-gray-600 font-medium">Phương pháp</th>
              <th className="text-center py-2 px-2 text-gray-600 font-medium">ROC-AUC<br/><span className="font-normal text-xs">(cao hơn = tốt hơn)</span></th>
              <th className="text-center py-2 px-2 text-gray-600 font-medium">F1<br/><span className="font-normal text-xs">(phân loại đúng)</span></th>
              <th className="text-center py-2 px-2 text-gray-600 font-medium">Tốc độ p50</th>
              <th className="text-center py-2 px-2 text-gray-600 font-medium">Chi phí / 1.000 cặp</th>
              <th className="text-center py-2 px-2 text-gray-600 font-medium">Giải thích?</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3 px-2 font-medium">Đếm trùng từ (TF-IDF)</td>
              <td className="text-center py-3 px-2 font-mono">0,755</td>
              <td className="text-center py-3 px-2 font-mono">0,695</td>
              <td className="text-center py-3 px-2">1 ms</td>
              <td className="text-center py-3 px-2">$0</td>
              <td className="text-center py-3 px-2 text-red-500">✗</td>
            </tr>
            <tr className="border-b bg-blue-50">
              <td className="py-3 px-2 font-medium text-blue-700">
                So sánh nghĩa (Embedding)
                <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">★ ROC-AUC cao nhất</span>
              </td>
              <td className="text-center py-3 px-2 font-mono font-bold text-blue-700">0,766</td>
              <td className="text-center py-3 px-2 font-mono">0,695</td>
              <td className="text-center py-3 px-2">~0 ms</td>
              <td className="text-center py-3 px-2">$0</td>
              <td className="text-center py-3 px-2 text-red-500">✗</td>
            </tr>
            <tr className="bg-purple-50">
              <td className="py-3 px-2 font-medium text-purple-700">
                Nhờ LLM chấm điểm
                <span className="ml-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded">★ F1 cao nhất</span>
              </td>
              <td className="text-center py-3 px-2 font-mono">0,755</td>
              <td className="text-center py-3 px-2 font-mono font-bold text-purple-700">0,717</td>
              <td className="text-center py-3 px-2">2.527 ms</td>
              <td className="text-center py-3 px-2">$0,28</td>
              <td className="text-center py-3 px-2 text-green-600 font-bold">✓ Chi tiết</td>
            </tr>
          </tbody>
        </table>


      </div>
    </div>
  )
}
