'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import SharedHeader from '@/components/SharedHeader'
import JobCard from '@/components/JobCard'

interface Job {
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

  const isGuestOrTemplate =
    cvId?.startsWith('template-') || cvId?.startsWith('guest-')

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvId }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Loi ${res.status}`)
      }

      const data = await res.json()
      console.log('API response:', JSON.stringify(data).slice(0, 300))
      if (!data || !Array.isArray(data.results)) {
        throw new Error(data?.error || 'Phan hoi khong hop le tu may chu')
      }
      setResults(data as SearchResults)
    } catch (err: any) {
      setError(err?.message || 'Co loi xay ra. Vui long thu lai.')
    } finally {
      setLoading(false)
    }
  }, [cvId])

  useEffect(() => {
    if (!isGuestOrTemplate) {
      fetchResults()
    } else {
      setLoading(false)
    }
  }, [cvId, isGuestOrTemplate, fetchResults])

  return (
    <div className="min-h-screen" style={{ background: '#E0F7FA' }}>
      <SharedHeader
        variant="app"
        showFeedback={false}
        showBackButton={true}
        backButtonTitle="Quay lai"
      />

      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Guest / template guard */}
        {isGuestOrTemplate && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-700 text-base font-inter">
              Vui long dang nhap de su dung tinh nang tim JD
            </p>
            <a
              href="/login"
              className="mt-4 inline-block px-6 py-2 bg-[#0277BD] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors font-inter"
            >
              Dang nhap
            </a>
          </div>
        )}

        {/* Loading state */}
        {!isGuestOrTemplate && loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0277BD]" />
            <p className="text-gray-600 font-inter text-base">
              Dang tim JD phu hop voi CV cua ban... (~5 giay)
            </p>
          </div>
        )}

        {/* Error state */}
        {!isGuestOrTemplate && !loading && error && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
            <p className="text-red-600 font-inter mb-4">{error}</p>
            <button
              onClick={fetchResults}
              className="px-5 py-2 bg-[#0277BD] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors font-inter"
            >
              Thu lai
            </button>
          </div>
        )}

        {/* Results state */}
        {!isGuestOrTemplate && !loading && results && (
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-inter">
                Top 5 vị trí phù hợp với bạn
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-inter">
                {results.meta?.top20Count ?? 0} JD được lọc &rarr; 5 kết quả tốt nhất &bull;{' '}
                {results.meta?.totalMs ?? 0}ms
              </p>
            </div>

            {/* Job cards */}
            <div className="flex flex-col gap-4">
              {(results.results ?? []).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Re-search button */}
            <div className="pt-2 text-center">
              <button
                onClick={fetchResults}
                className="px-6 py-2.5 border border-[#0277BD] text-[#0277BD] rounded-lg font-medium hover:bg-blue-50 transition-colors font-inter"
              >
                Tim lai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
