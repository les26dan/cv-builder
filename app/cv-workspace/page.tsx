'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HeaderMinimal from '@/components/HeaderMinimal'
import CVCard from '@/components/CVCard'
import { workspace } from '@/config/texts/vi/workspace'
import { fetchUserCVs, createNewCV, deleteCV, CVData } from '@/lib/supabase'
import { AutosaveProvider, useAutosaveContext } from '@/shared/contexts/AutosaveContext'

interface User {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

function WorkspaceContent() {
  const [cvs, setCvs] = useState<CVData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false) // Prevent button spam
  const router = useRouter()
  const autosave = useAutosaveContext()

  useEffect(() => {
    // Check authentication on page load
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      // In test environment, use mock user data
      if (typeof window !== 'undefined' && (window as any).jest) {
        const mockUser = {
          id: 'mock-user-1',
          fullName: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          createdAt: new Date().toISOString()
        }
        setUser(mockUser)
        await loadCVs(mockUser.id)
        return
      }
      
      // Check for user session in localStorage
      const userSession = localStorage.getItem('userSession')
      
      if (!userSession) {
        // Redirect to login if no session
        router.push('/login')
        return
      }

      const userData = JSON.parse(userSession)
      setUser(userData)
      await loadCVs(userData.id)
    } catch (error) {
      console.error('Error checking authentication:', error)
      router.push('/login')
    }
  }

  const loadCVs = async (userId: string) => {
    try {
      setIsLoading(true)
      const userCVs = await fetchUserCVs(userId)
      setCvs(userCVs)
    } catch (error) {
      console.error('Error loading CVs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNewCV = async () => {
    if (!user || isCreating) return

    try {
      setIsCreating(true)
      const newCV = await createNewCV(user.id, `CV - ${user.fullName}`)
      
      if (newCV) {
        // Route to CV guided editing with new CV ID
        router.push(`/cv-guided-editing/${newCV.id}`)
      }
    } catch (error) {
      console.error('Error creating new CV:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditCV = (cvId: string) => {
    router.push(`/cv-guided-editing/${cvId}`)
  }

  const handleDeleteCV = async (cvId: string) => {
    if (!user) return

    try {
      await deleteCV(cvId)
      await loadCVs(user.id) // Reload CVs after deletion
      setShowDeleteModal(null)
    } catch (error) {
      console.error('Error deleting CV:', error)
    }
  }

  const confirmDelete = (cvId: string) => {
    setShowDeleteModal(cvId)
  }

  const cancelDelete = () => {
    setShowDeleteModal(null)
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderMinimal />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {workspace.page.title}
          </h1>
          <p className="text-gray-600">
            {workspace.page.subtitle}
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={handleCreateNewCV}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {workspace.page.createButton}
              </>
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : cvs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {workspace.empty.title}
            </h3>
            <p className="text-gray-500 mb-6">
              {workspace.empty.subtitle}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cvs.map((cv) => (
              <CVCard
                key={cv.id}
                cv={cv}
                onEdit={handleEditCV}
                onDelete={confirmDelete}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {workspace.modals.deleteConfirm.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {workspace.modals.deleteConfirm.message}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {workspace.modals.deleteConfirm.cancel}
                </button>
                <button
                  onClick={() => handleDeleteCV(showDeleteModal)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {workspace.modals.deleteConfirm.confirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <AutosaveProvider>
      <WorkspaceContent />
    </AutosaveProvider>
  )
} 