'use client'

import { useState, useEffect } from 'react'
import { getTexts } from '../../config/texts/index'

interface UserSession {
  id: string
  email: string
  name: string
  provider: string
  role?: 'admin' | 'user'
}

interface UserDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: UserSession | null
  currentLanguage?: 'vi' | 'en'
  onLanguageChange?: (language: 'vi' | 'en') => void
}

export const UserDrawer: React.FC<UserDrawerProps> = ({
  isOpen,
  onClose,
  user,
  currentLanguage = 'vi',
  onLanguageChange
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [userDrawer, setUserDrawer] = useState<any>(null)

  // Load texts when language changes
  useEffect(() => {
    const loadTexts = async () => {
      try {
        const texts = await getTexts('userDrawer', currentLanguage)
        setUserDrawer(texts)
      } catch (error) {
        console.error('Failed to load userDrawer texts:', error)
        // Fallback to Vietnamese
        const fallbackTexts = await getTexts('userDrawer', 'vi')
        setUserDrawer(fallbackTexts)
      }
    }
    
    loadTexts()
  }, [currentLanguage])

  // Close drawer when clicking outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleSignOut = async () => {
    if (!showSignOutConfirm) {
      setShowSignOutConfirm(true)
      return
    }

    try {
      setIsSigningOut(true)
      
      // Call logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        // Redirect to landing page after successful logout
        window.location.href = '/'
      } else {
        console.error('Logout failed')
        alert(userDrawer?.errors?.logoutFailed || 'Logout failed. Please try again.')
      }
    } catch (error) {
      console.error('Logout error:', error)
      alert(userDrawer?.errors?.logoutError || 'An error occurred during logout. Please try again.')
    } finally {
      setIsSigningOut(false)
      setShowSignOutConfirm(false)
    }
  }

  const handleLanguageToggle = () => {
    const newLanguage = currentLanguage === 'vi' ? 'en' : 'vi'
    if (onLanguageChange) {
      onLanguageChange(newLanguage)
    }
    // For now, just store in localStorage
    localStorage.setItem('okbuddy_language', newLanguage)
            alert(userDrawer?.confirmations?.languageChange || 'Language will be changed after page reload')
  }

  const getUserInitial = () => {
    if (!user) return 'U'
    return user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
  }

  const isAdmin = user?.role === 'admin'

  if (!isOpen) return null
  
  // Don't render until texts are loaded
  if (!userDrawer) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50"
      onClick={onClose}
    >
      {/* Drawer Panel */}
      <div 
        className="bg-white h-full w-80 shadow-xl flex flex-col animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {userDrawer.userInfo.welcome}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            aria-label={currentLanguage === 'en' ? 'Close' : 'Đóng'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info Section */}
        {user && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                {getUserInitial()}
              </div>
              
              {/* User Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {user.name || user.email.split('@')[0]}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {user.email}
                </p>
                {isAdmin && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-600 mt-1">
                    {userDrawer.userInfo.role.admin}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="space-y-2">
            {/* CV Workspace */}
            <button
              onClick={() => window.location.href = '/cv-workspace'}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {userDrawer.navigation.workspace}
              </span>
            </button>

            {/* Admin Dashboard - Only show for admin users */}
            {isAdmin && (
              <button
                onClick={() => window.location.href = '/admin'}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {userDrawer.actions.admin}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Sign Out Section */}
        <div className="p-6 mt-auto">
          {!showSignOutConfirm ? (
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">
                {isSigningOut ? userDrawer.status.signingOut : userDrawer.actions.signOut}
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                {userDrawer.confirmations.signOut}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {userDrawer?.confirmations?.cancel || 'Cancel'}
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSigningOut ? userDrawer?.status?.signingOut || 'Signing out...' : userDrawer?.actions?.signOut || 'Sign Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 