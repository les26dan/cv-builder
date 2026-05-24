'use client'

import { useState, useEffect } from 'react'
import { UserDrawer } from './common/UserDrawer'
import { checkAuthentication } from '../lib/auth'
import { detectLanguage, type SupportedLanguage } from '../config/languageConfig'
import { getTexts } from '../config/texts/index'

interface UserSession {
  id: string
  email: string
  name: string
  provider: string
  role?: 'admin' | 'user'
}

interface HeaderMinimalProps {
  showAutosave?: boolean
  userInitial?: string
  autosaveStatus?: 'idle' | 'saving' | 'saved' | 'error'
}

export default function HeaderMinimal({ 
  showAutosave = true, 
  userInitial = 'N',
  autosaveStatus = 'saved'
}: HeaderMinimalProps) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [showUserDrawer, setShowUserDrawer] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('vi')
  const [workspaceTexts, setWorkspaceTexts] = useState<any>(null)

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuthStatus = async () => {
      try {
        const authResult = await checkAuthentication()
        if (authResult.isAuthenticated && authResult.user) {
          setUser(authResult.user)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }

    checkAuthStatus()

    // Initialize language configuration using the detection system
    const initLanguage = async () => {
      const savedLanguage = localStorage.getItem('okbuddy_language') as SupportedLanguage
      let language: SupportedLanguage
      
      if (savedLanguage && ['vi', 'en'].includes(savedLanguage)) {
        language = savedLanguage
      } else {
        language = 'vi'
        localStorage.setItem('okbuddy_language', language)
      }
      
      setCurrentLanguage(language)
      
      // Load workspace texts for the detected language
      try {
        const texts = await getTexts('workspace', language)
        setWorkspaceTexts(texts)
      } catch (error) {
        console.error('Failed to load workspace texts:', error)
        // Fallback to Vietnamese
        const fallbackTexts = await getTexts('workspace', 'vi')
        setWorkspaceTexts(fallbackTexts)
      }
    }
    
    initLanguage()
  }, [])

  // Determine autosave display properties based on status
  const getAutosaveDisplay = () => {
    // Use dynamic texts if available, otherwise fallback to English
    const autosaveTexts = workspaceTexts?.autosave || {
      saving: 'Saving...',
      saved: 'Auto-saved'
    }
    
    switch (autosaveStatus) {
      case 'saving':
        return {
          text: autosaveTexts.saving,
          statusClass: 'bg-orange-50 text-orange-600 border-orange-200',
          showSpinner: true,
        }
      case 'saved':
        return {
          text: `✓ ${autosaveTexts.saved}`,
          statusClass: 'bg-green-50 text-green-600 border-green-200',
          showSpinner: false,
        }
      case 'error':
        return {
          text: autosaveTexts.error || 'Save error',
          statusClass: 'bg-red-50 text-red-600 border-red-200',
          showSpinner: false,
        }
      case 'idle':
      default:
        return {
          text: `✓ ${autosaveTexts.saved}`,
          statusClass: 'bg-gray-50 text-gray-600 border-gray-200',
          showSpinner: false,
        }
    }
  }

  const autosaveDisplay = getAutosaveDisplay()

  const handleAvatarClick = () => {
    setShowUserDrawer(true)
  }

  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return userInitial
  }

  const handleLanguageChange = (language: 'vi' | 'en') => {
    setCurrentLanguage(language)
    localStorage.setItem('okbuddy_language', language)
  }

  return (
    <header className="w-full h-16 sm:h-20 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-10 border-b border-gray-100 shadow-sm">
      {/* Logo Section */}
      <div className="flex items-center">
        <button
          onClick={() => {
            // Navigate back to workspace home
            window.location.href = '/cv-workspace';
          }}
          className="text-xl sm:text-2xl font-bold text-primary hover:text-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md px-2 py-1"
          title="Trang chủ CV Workspace"
          aria-label="Trang chủ CV Workspace"
        >
          CV Builder
        </button>
      </div>

      {/* User Actions Section */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Auto Save Status */}
        {showAutosave && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border ${autosaveDisplay.statusClass}`}>
            {autosaveDisplay.showSpinner && (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            )}
            {!autosaveDisplay.showSpinner && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {autosaveDisplay.text}
          </div>
        )}

        {/* User Avatar */}
        <button
          onClick={handleAvatarClick}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          title={user ? `${user.name || user.email} - Nhấn để mở menu` : 'Mở menu người dùng'}
          aria-label="Mở menu người dùng"
        >
          {getUserInitial()}
        </button>
      </div>

      {/* User Drawer */}
      <UserDrawer
        isOpen={showUserDrawer}
        onClose={() => setShowUserDrawer(false)}
        user={user}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
    </header>
  )
} 