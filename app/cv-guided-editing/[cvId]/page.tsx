'use client'

import React, { Suspense, Component, ErrorInfo, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { CVWorkflowProvider } from '@/shared/contexts/CVWorkflowContext'
import { MobileBlockingOverlay } from '@/components/MobileBlockingOverlay'
import { useMobileDetection } from '@/utils/useMobileDetection'

// Dynamically import heavy components to reduce initial bundle size
const CVEditor = dynamic(() => import('@/components/CVEditor').then(mod => ({ default: mod.CVEditor })), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải trình chỉnh sửa CV...</p>
      </div>
    </div>
  ),
  ssr: false
})

// Error Boundary Class Component
class CVEditorErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 CVEditor Error Boundary caught error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 CVEditor componentDidCatch:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">🚨 Có lỗi xảy ra</h1>
            <p className="text-gray-600 mb-4">
              Trình chỉnh sửa CV gặp sự cố. Vui lòng thử lại sau.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <strong className="block text-red-800 mb-2">Chi tiết lỗi:</strong>
              <pre className="text-sm text-red-700 overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Tải lại trang
              </button>
              <button 
                onClick={() => window.history.back()}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function CVGuidedEditingPage() {
  const params = useParams()
  const router = useRouter()
  const cvId = params.cvId as string
  const mobileDetection = useMobileDetection()

  const handleBackToWorkspace = () => {
    router.push('/cv-workspace')
  }

  // Handle mobile blocking - use CSS classes for responsive behavior instead
  if (mobileDetection.isMobile) {
    return (
      <MobileBlockingOverlay 
        detection={mobileDetection}
        onBackToWorkspace={handleBackToWorkspace}
      />
    )
  }

  return (
    <CVWorkflowProvider>
      <CVEditorErrorBoundary>
        <Suspense fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải trình chỉnh sửa CV...</p>
            </div>
          </div>
        }>
          <CVEditor />
        </Suspense>
      </CVEditorErrorBoundary>
    </CVWorkflowProvider>
  )
} 