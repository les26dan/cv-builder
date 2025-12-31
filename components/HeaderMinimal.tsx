'use client'

import { workspace } from '../config/texts/vi/workspace'
import { AutosaveStatus } from '../lib/hooks/useAutosave'

interface HeaderMinimalProps {
  showAutosave?: boolean
  userInitial?: string
  autosaveStatus?: AutosaveStatus
}

export default function HeaderMinimal({ 
  showAutosave = true, 
  userInitial = 'N',
  autosaveStatus = 'saved'
}: HeaderMinimalProps) {
  // Determine autosave display properties based on status
  const getAutosaveDisplay = () => {
    switch (autosaveStatus) {
      case 'saving':
        return {
          text: workspace.header.autosave.saving,
          iconColor: '#F59E0B', // Orange for saving
          textColor: '#F59E0B',
          showSpinner: true,
        }
      case 'saved':
        return {
          text: workspace.header.autosave.saved,
          iconColor: '#4CAF50', // Green for saved
          textColor: '#4CAF50',
          showSpinner: false,
        }
      case 'error':
        return {
          text: 'Lỗi lưu tự động',
          iconColor: '#EF4444', // Red for error
          textColor: '#EF4444',
          showSpinner: false,
        }
      case 'idle':
      default:
        return {
          text: workspace.header.autosave.saved,
          iconColor: '#6B7280', // Gray for idle
          textColor: '#6B7280',
          showSpinner: false,
        }
    }
  }

  const autosaveDisplay = getAutosaveDisplay()

  return (
    <header style={{
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      gap: '16px',
      width: '100%',
      maxWidth: '1152px',
      height: '64px',
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      flex: 'none',
      order: 0,
      alignSelf: 'stretch',
      flexGrow: 0,
    }}>
      {/* Logo Section - Far Left */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0px',
        gap: '12px',
        width: '109px',
        height: '29px',
        borderRadius: '0px',
        flex: 'none',
        order: 0,
        flexGrow: 0,
      }}>
        <button
          onClick={() => {
            // Since we're already in workspace, just refresh the page
            window.location.reload();
          }}
          style={{
            width: '109px',
            height: '29px',
            fontFamily: 'Inter',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '24px',
            lineHeight: '29px',
            color: '#0288D1',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#0277BD';
            e.currentTarget.style.backgroundColor = 'rgba(2, 136, 209, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#0288D1';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(2, 136, 209, 0.5)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
          title="Trang chủ CV Workspace"
          aria-label="Trang chủ CV Workspace"
        >
          {workspace.header.logo}
        </button>
      </div>

      {/* User Actions - Far Right */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Auto Save Status */}
        {showAutosave && (
          <div style={{
            padding: '4px 12px',
            backgroundColor: '#F0FDF4',
            color: '#22C55E',
            fontSize: '14px',
            borderRadius: '9999px',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            fontFamily: 'Inter'
          }}>
            ✓ {autosaveDisplay.text}
          </div>
        )}

        {/* User Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#3B82F6',
          borderRadius: '50%',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {userInitial}
        </div>
      </div>
    </header>
  )
} 