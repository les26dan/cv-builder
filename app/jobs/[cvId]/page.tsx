'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import SharedHeader from '@/components/SharedHeader'
import JobCard from '@/components/JobCard'

interface Job {
  id: string
  title: string
  category: string
  source: string
  sourceUrl: string | null
  jdPreview: string
  jdFull: string
  hybridScore: number
  structuralScore: number
  llmScore: number
  finalScore: number
  reason: string
  rank: number
}

interface SearchMeta {
  step1Ms: number
  step2Ms: number
  totalMs: number
  llmCostUsd: number
  top20Count: number
}

interface SearchResults {
  results: Job[]
  meta: SearchMeta
}

export default function JobSearchPage() {
  const params = useParams()
  const cvId = params.cvId as string

  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  const isGuestOrTemplate =
    cvId?.startsWith('template-') || cvId?.startsWith('guest-')

  const fetchResults = useCallback(async (query?: string) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvId, query }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Lỗi ${res.status}`)
      }

      const data = await res.json()
      if (!data || !Array.isArray(data.results)) {
        throw new Error(data?.error || 'Phản hồi không hợp lệ từ máy chủ')
      }
      setResults(data as SearchResults)
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [cvId])

  useEffect(() => {
    if (!isGuestOrTemplate) {
      fetchResults(undefined)
    } else {
      setLoading(false)
    }
  }, [cvId, isGuestOrTemplate, fetchResults])

  const handleSearch = () => {
    const q = searchInput.trim() || undefined
    setActiveQuery(q)
    fetchResults(q)
  }

  const handleClear = () => {
    setSearchInput('')
    setActiveQuery(undefined)
    fetchResults(undefined)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="min-h-screen" style={{ background: '#E0F7FA' }}>
      <SharedHeader
        variant="app"
        showFeedback={false}
        showBackButton={true}
        backButtonTitle="Quay lại"
      />

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Guest / template guard */}
        {isGuestOrTemplate && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-700 text-base font-inter">
              Vui lòng đăng nhập để sử dụng tính năng tìm JD
            </p>
            <a
              href="/login"
              className="mt-4 inline-block px-6 py-2 bg-[#0277BD] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors font-inter"
            >
              Đăng nhập
            </a>
          </div>
        )}

        {!isGuestOrTemplate && (
          <div className="flex flex-col gap-5">
            {/* Page title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-inter">
                Tìm việc phù hợp
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-inter">
                AI phân tích CV và tìm top 5 vị trí phù hợp nhất
              </p>
            </div>

            {/* Search bar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tìm theo tên vị trí, kỹ năng... (Enter để tìm)"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm font-inter focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
                  />
                  {searchInput && (
                    <button
                      onClick={handleClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2.5 bg-[#0277BD] text-white rounded-lg text-sm font-medium font-inter hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Tìm kiếm'
                  )}
                </button>
              </div>

              {/* Active query indicator */}
              {activeQuery && !loading && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-inter">Đang lọc:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium font-inter">
                    {activeQuery}
                    <button onClick={handleClear} className="hover:text-blue-900">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0277BD]" />
                <p className="text-gray-600 font-inter text-base">
                  {activeQuery
                    ? `Đang tìm "${activeQuery}"...`
                    : 'Đang phân tích CV và tìm JD phù hợp... (~5 giây)'}
                </p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
                <p className="text-red-600 font-inter mb-4">{error}</p>
                <button
                  onClick={() => fetchResults(activeQuery)}
                  className="px-5 py-2 bg-[#0277BD] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors font-inter"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Results */}
            {!loading && results && (
              <div className="flex flex-col gap-4">
                {/* Results header */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 font-inter">
                    {results.meta?.top20Count ?? 0} JD được lọc &rarr;{' '}
                    <span className="font-medium text-gray-700">{results.results.length} kết quả</span>
                    {' '}&bull; {results.meta?.totalMs ?? 0}ms
                  </p>
                  <button
                    onClick={() => fetchResults(activeQuery)}
                    className="text-sm text-[#0277BD] hover:underline font-inter"
                  >
                    Tìm lại
                  </button>
                </div>

                {/* No results */}
                {results.results.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <p className="text-gray-500 font-inter">
                      Không tìm thấy kết quả{activeQuery ? ` cho "${activeQuery}"` : ''}.
                    </p>
                    {activeQuery && (
                      <button
                        onClick={handleClear}
                        className="mt-3 text-sm text-[#0277BD] hover:underline font-inter"
                      >
                        Xóa bộ lọc và tìm tất cả
                      </button>
                    )}
                  </div>
                )}

                {/* Job cards */}
                {results.results.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
