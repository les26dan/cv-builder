'use client'

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
  // Inline workspace text to avoid import issues
  const workspaceText = {
    logo: 'OkBuddy',
    autosave: {
      saving: 'Đang lưu...',
      saved: 'Đã lưu tự động',
    }
  }

  // Determine autosave display properties based on status
  const getAutosaveDisplay = () => {
    switch (autosaveStatus) {
      case 'saving':
        return {
          text: workspaceText.autosave.saving,
          statusClass: 'bg-orange-50 text-orange-600 border-orange-200',
          showSpinner: true,
        }
      case 'saved':
        return {
          text: workspaceText.autosave.saved,
          statusClass: 'bg-green-50 text-green-600 border-green-200',
          showSpinner: false,
        }
      case 'error':
        return {
          text: 'Lỗi lưu tự động',
          statusClass: 'bg-red-50 text-red-600 border-red-200',
          showSpinner: false,
        }
      case 'idle':
      default:
        return {
          text: workspaceText.autosave.saved,
          statusClass: 'bg-gray-50 text-gray-600 border-gray-200',
          showSpinner: false,
        }
    }
  }

  const autosaveDisplay = getAutosaveDisplay()

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
          {workspaceText.logo}
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
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm hover:bg-primary-600 transition-colors cursor-pointer">
          {userInitial}
        </div>
      </div>
    </header>
  )
} 