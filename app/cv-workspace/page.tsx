'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HeaderMinimal from '@/components/HeaderMinimal'
import CVCard from '@/components/CVCard'
import { workspace } from '@/config/texts/index'
import { fetchUserCVs, createNewCV, deleteCV, CVData } from '@/lib/supabase'

interface User {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
}

export default function WorkspacePage() {
  const [cvs, setCvs] = useState<CVData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      console.log('🔧 CV Workspace: Starting authentication check...')
      setIsLoading(true)
      const mockUser: User = {
        id: 'user-123',
        fullName: 'Người dùng Demo',
        email: 'demo@okbuddy.ai',
        emailVerified: true
      }
      
      console.log('🔧 CV Workspace: Mock user created:', mockUser)
      
      // Create mock session cookie for development
      if (typeof window !== 'undefined') {
        const mockSession = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.fullName,
          provider: 'mock'
        }
        
        // Set session cookie for middleware
        document.cookie = `user_session=${JSON.stringify(mockSession)}; path=/; max-age=86400`
        console.log('🔧 Mock session cookie created for development')
      }
      
      console.log('🔧 CV Workspace: Setting user state...')
      setUser(mockUser)
      
      console.log('🔧 CV Workspace: Loading user CVs...')
      await loadUserCVs(mockUser.id)
      console.log('🔧 CV Workspace: CVs loaded successfully')
    } catch (error) {
      console.error('Authentication failed:', error)
      router.push('/login?redirect=/cv-workspace')
    } finally {
      console.log('🔧 CV Workspace: Setting loading to false')
      setIsLoading(false)
    }
  }

  const loadUserCVs = async (userId: string) => {
    try {
      console.log('🔧 CV Workspace: Fetching CVs for user:', userId)
      const userCVs = await fetchUserCVs(userId)
      console.log('🔧 CV Workspace: Fetched CVs:', userCVs)
      setCvs(userCVs)
      console.log('🔧 CV Workspace: CVs state updated, count:', userCVs.length)
    } catch (error) {
      console.error('Failed to load CVs:', error)
      setCvs([])
    }
  }

  const handleCreateNew = async () => {
    if (!user || isCreating) return

    try {
      setIsCreating(true)
      
      // Navigate directly to CV Upload page so users can upload existing CV or create from scratch
      router.push('/cv-upload')
    } catch (error) {
      console.error('Failed to navigate to CV upload:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleContinue = async (cvId: string) => {
    if (!user) return
    
    console.log('Continue CV:', cvId)
    // Navigate to editor with CV data
    router.push(`/cv-guided-editing/${cvId}`)
  }

  const handleEdit = async (cvId: string) => {
    if (!user) return
    
    console.log('Edit CV:', cvId)
    // Navigate to editor with CV data
    router.push(`/cv-guided-editing/${cvId}`)
  }

  const handleDownload = (cvId: string) => {
    console.log('Download CV:', cvId)
    // Implement download functionality
  }

  const handleDeleteClick = (cvId: string) => {
    setShowDeleteModal(cvId)
  }

  const handleDeleteConfirm = async () => {
    if (!showDeleteModal) return
    
    try {
      await deleteCV(showDeleteModal)
      setCvs(prev => prev.filter(cv => cv.id !== showDeleteModal))
    } catch (error) {
      console.error('Error deleting CV:', error)
    } finally {
      setShowDeleteModal(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(null)
  }

  // Temporary: Remove SSR loading to debug client-side mounting
  // if (isLoading) {
  //   return (
  //     <div style={{
  //       display: 'flex',
  //       flexDirection: 'column',
  //       justifyContent: 'center',
  //       alignItems: 'center',
  //       minHeight: '100vh',
  //       background: '#E0F7FA',
  //       gap: '20px'
  //     }}>
  //       <div style={{
  //         fontFamily: 'Inter',
  //         fontSize: '16px',
  //         color: '#6B7280',
  //       }}>
  //         Đang tải...
  //       </div>
  //       <div style={{
  //         fontFamily: 'Inter',
  //         fontSize: '12px',
  //         color: '#9CA3AF',
  //       }}>
  //         Debug: Loading state = {isLoading.toString()}
  //       </div>
  //       <div style={{
  //         fontFamily: 'Inter',
  //         fontSize: '12px',
  //         color: '#9CA3AF',
  //       }}>
  //         User: {user ? 'Set' : 'Not set'}
  //       </div>
  //       <button 
  //         onClick={() => {
  //           console.log('🔧 Force reload clicked')
  //           setIsLoading(false)
  //         }}
  //         style={{
  //           padding: '10px 20px',
  //           background: '#0288D1',
  //           color: 'white',
  //           border: 'none',
  //           borderRadius: '5px',
  //           cursor: 'pointer',
  //           fontFamily: 'Inter'
  //         }}
  //       >
  //         Force Continue (Debug)
  //       </button>
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen" style={{ background: '#E0F7FA' }}>
      {/* Keep the current header untouched */}
      <HeaderMinimal />
      
      {/* Main Container - Responsive with legacy layout */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Content - Responsive */}
        <div className="mt-6 space-y-5">
          {/* Page Header - Responsive with legacy layout */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-4">
            {/* Title Section - Left Aligned */}
            <div className="flex-1">
              {/* Page Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 font-inter">
                {workspace.page.title}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-gray-600 font-inter">
                {workspace.page.subtitle}
              </p>
            </div>

            {/* Create Button - Right Aligned with legacy styling */}
            <button
              onClick={handleCreateNew}
              disabled={isCreating}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base transition-colors w-full sm:w-auto font-inter ${
                isCreating 
                  ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                  : 'bg-cyan-600 hover:bg-cyan-700 cursor-pointer'
              }`}
            >
              {/* Plus Icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M10 4.16666V15.8333"
                  stroke="#FFFFFF"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.16667 10H15.8333"
                  stroke="#FFFFFF"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Button Text */}
              <span className="text-white">
                {isCreating ? 'Đang tạo...' : workspace.page.createButton}
              </span>
            </button>
          </div>

          {/* CV Grid or Empty State - Responsive with legacy layout */}
          {cvs.length === 0 ? (
            /* Empty State - Responsive with legacy styling */
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 bg-white rounded-xl border border-gray-200 min-h-[400px] text-center shadow-sm">
              <div className="max-w-md space-y-4">
                {/* Empty State Icon */}
                <div className="text-cyan-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 font-inter">
                  {workspace.empty.title}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 font-inter">
                  {workspace.empty.subtitle}
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                disabled={isCreating}
                className={`mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-base transition-colors w-full sm:w-auto font-inter ${
                  isCreating 
                    ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                    : 'bg-cyan-600 hover:bg-cyan-700 cursor-pointer'
                }`}
              >
                <span className="text-white">
                  {isCreating ? 'Đang tạo...' : workspace.empty.cta}
                </span>
              </button>
            </div>
          ) : (
            /* CV Grid - Legacy list style layout */
            <div className="space-y-4 sm:space-y-5">
              {cvs.map((cv) => (
                <CVCard
                  key={cv.id}
                  cv={cv}
                  onContinue={handleContinue}
                  onEdit={handleEdit}
                  onDownload={handleDownload}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal - Legacy styling */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-inter">
                {workspace.modals.deleteConfirm.title}
              </h3>
              <p className="text-gray-600 mb-6 font-inter">
                {workspace.modals.deleteConfirm.message}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors font-inter"
                >
                  {workspace.modals.deleteConfirm.cancel}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors font-inter"
                >
                  {workspace.modals.deleteConfirm.confirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 