'use client'

import { useState, useEffect } from 'react'
import { getTexts } from '@/config/texts/index'
import { formatTimeAgo } from '@/lib/timeUtils'
import { CVData } from '@/lib/supabase'

interface CVCardProps {
  cv: CVData
  onContinue?: (cvId: string) => void | Promise<void>
  onEdit?: (cvId: string) => void | Promise<void>
  onDownload?: (cvId: string) => void
  onDelete?: (cvId: string) => void
}

export default function CVCard({ 
  cv, 
  onContinue, 
  onEdit, 
  onDownload, 
  onDelete 
}: CVCardProps) {
  const [workspace, setWorkspace] = useState<any>(null)
  const [currentLanguage, setCurrentLanguage] = useState<'vi' | 'en'>('en')
  
  useEffect(() => {
    loadTexts()
  }, [])

  const loadTexts = async () => {
    try {
      // Check for saved language preference
      const savedLanguage = localStorage.getItem('okbuddy_language') as 'vi' | 'en' || 'en'
      setCurrentLanguage(savedLanguage)
      
      const workspaceTexts = await getTexts('workspace', savedLanguage)
      setWorkspace(workspaceTexts)
    } catch (error) {
      console.error('Failed to load texts:', error)
      // Fallback to English
      const workspaceTexts = await getTexts('workspace', 'en')
      setWorkspace(workspaceTexts)
    }
  }

  // Don't render until texts are loaded
  if (!workspace) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  const isHighScore = cv.score >= 90
  const isCompleted = cv.status === 'completed'

  // Score-based styling for progress section
  const getProgressBgColor = () => {
    if (cv.score >= 90) return '#E6F4EA'  // Green for high scores (>=90%)
    if (cv.score > 60) return '#FFF3E0'   // Orange for medium scores (>60% but <90%)
    return '#F8FAFC'                      // Gray for low scores (<=60%)
  }
  
  const getProgressTextColor = () => {
    if (cv.score >= 90) return '#4CAF50'  // Green text for high scores
    if (cv.score > 60) return '#F57C00'   // Orange text for medium scores  
    return '#6B7280'                      // Gray text for low scores
  }

  const progressBgColor = getProgressBgColor()
  const progressTextColor = getProgressTextColor()
  const fileIconColor = isHighScore ? '#4CAF50' : '#9CA3AF'
  const cardBorder = isHighScore ? '2px solid #4CAF50' : '1px solid #E5E7EB'

  const getProgressText = () => {
    const steps = {
      en: {
        new: 'Step 1/4: Upload CV & Job Description',
        in_progress: 'Step 2/4: CV Analysis',
        completed: 'Step 4/4: Complete!',
      },
      vi: {
        new: 'Bước 1/4: Upload CV & Mô tả công việc',
        in_progress: 'Bước 2/4: Phân tích CV',
        completed: 'Bước 4/4: Hoàn tất!',
      }
    }
    
    const statusText = steps[currentLanguage]?.[cv.status] || steps[currentLanguage]?.new
    return statusText || steps.en.new
  }

  // Handle card click - navigate to editing based on CV status
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }

    // Navigate based on CV status
    if (isCompleted) {
      onEdit?.(cv.id)
    } else {
      onContinue?.(cv.id)
    }
  }

  // Handle action button clicks with event propagation prevention
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  return (
    <div 
      onClick={handleCardClick}
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: '20px',
        gap: '16px',
        width: '100%',
        maxWidth: '1152px',
        height: '173px',
        background: '#FFFFFF',
        border: cardBorder,
        borderRadius: '12px',
        flex: 'none',
        order: 0,
        alignSelf: 'stretch',
        flexGrow: 0,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* CV Preview */}
      <div style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0px',
        width: '80px',
        height: '100px',
        background: '#F8FAFC',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        flex: 'none',
        order: 0,
        flexGrow: 0,
      }}>
        {/* File Icon */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '0px',
          flex: 'none',
          order: 0,
          flexGrow: 0,
          position: 'relative',
        }}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.33333 2.66666H18.6667L26.6667 10.6667V29.3333H5.33333V2.66666Z"
              stroke={fileIconColor}
              strokeWidth="2.66667"
              strokeLinejoin="round"
            />
            <path
              d="M18.6667 2.66666V10.6667H26.6667"
              stroke={fileIconColor}
              strokeWidth="2.66667"
              strokeLinejoin="round"
            />
            {isHighScore && (
              <>
                <path
                  d="M10.6667 20H21.3333"
                  stroke={fileIconColor}
                  strokeWidth="2.66667"
                  strokeLinecap="round"
                />
                <path
                  d="M10.6667 17.3333H21.3333"
                  stroke={fileIconColor}
                  strokeWidth="2.66667"
                  strokeLinecap="round"
                />
                <path
                  d="M10.6667 22.6667H21.3333"
                  stroke={fileIconColor}
                  strokeWidth="2.66667"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* CV Details */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '0px',
        gap: '12px',
        width: 'calc(100% - 96px)',
        height: '133px',
        borderRadius: '0px',
        flex: 'none',
        order: 1,
        flexGrow: 0,
        maxWidth: 'calc(100% - 96px)',
      }}>
        {/* CV Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '8px',
          width: '100%',
          height: '43px',
          borderRadius: '0px',
          flex: 'none',
          order: 0,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}>
          {/* CV Info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '4px',
            width: '100%',
            height: '43px',
            borderRadius: '0px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}>
            {/* Title Row */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '0px',
              gap: '8px',
              width: '100%',
              height: '22px',
              borderRadius: '0px',
              flex: 'none',
              order: 0,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              {/* CV Title */}
              <div style={{
                height: '22px',
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: '22px',
                color: '#111827',
                flex: 'none',
                order: 0,
                flexGrow: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {cv.title}
              </div>

              {/* Score */}
              <div style={{
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '20px',
                color: isHighScore ? '#4CAF50' : cv.score >= 70 ? '#F59E0B' : '#6B7280',
                flex: 'none',
                marginRight: '0px',
                minWidth: 'fit-content',
              }}>
                {workspace.cvCard.score(cv.score)}
              </div>
            </div>

            {/* CV Subtitle */}
            <div style={{
              width: '100%',
              height: '17px',
              fontFamily: 'Inter',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '17px',
              color: '#6B7280',
              flex: 'none',
              order: 1,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              Cập nhật lần cuối: {formatTimeAgo(cv.lastUpdated)}
            </div>
          </div>
        </div>

        {/* Progress Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '8px 12px',
          gap: '4px',
          width: '100%',
          minHeight: '30px',
          background: progressBgColor,
          borderRadius: '6px',
          flex: 'none',
          order: 1,
          alignSelf: 'stretch',
          flexGrow: 0,
          boxSizing: 'border-box',
        }}>
          <div style={{
            width: '100%',
            fontFamily: 'Inter',
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '11px',
            lineHeight: '14px',
            color: progressTextColor,
            flex: 'none',
            order: 0,
            alignSelf: 'stretch',
            flexGrow: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {getProgressText()}
          </div>
        </div>

        {/* CV Actions */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0px',
          gap: '8px',
          width: '100%',
          height: '36px',
          borderRadius: '0px',
          flex: 'none',
          order: 2,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}>
          {/* Primary Action Button */}
          {isCompleted ? (
            /* Edit Button for completed CVs */
            <button
              onClick={(e) => handleActionClick(e, () => onEdit?.(cv.id))}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '12px 16px',
                width: '100px',
                height: '36px',
                background: '#E3F2FD',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                flex: 'none',
                order: 0,
                flexGrow: 0,
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#BBDEFB'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#E3F2FD'
              }}
            >
              <span style={{
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '17px',
                color: '#0277BD',
                whiteSpace: 'nowrap',
              }}>
                {workspace.cvCard.actions.edit}
              </span>
            </button>
          ) : (
            /* Continue Button for in-progress CVs */
            <button
              onClick={(e) => handleActionClick(e, () => onContinue?.(cv.id))}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '12px 16px',
                width: '87px',
                height: '36px',
                background: '#0277BD',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                flex: 'none',
                order: 0,
                flexGrow: 0,
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#025596'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0277BD'
              }}
            >
              <span style={{
                fontFamily: 'Inter',
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '17px',
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
              }}>
                {workspace.cvCard.actions.continue}
              </span>
            </button>
          )}

          {/* Download Button */}
          <button
            onClick={(e) => handleActionClick(e, () => onDownload?.(cv.id))}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '12px 16px',
              width: '110px',
              height: '36px',
              background: isCompleted ? '#4CAF50' : '#F8FAFC',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              flex: 'none',
              order: 1,
              flexGrow: 0,
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isCompleted ? '#45A049' : '#F1F5F9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isCompleted ? '#4CAF50' : '#F8FAFC'
            }}
          >
            <span style={{
              fontFamily: 'Inter',
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: '14px',
              lineHeight: '17px',
              color: isCompleted ? '#FFFFFF' : '#6B7280',
              whiteSpace: 'nowrap',
            }}>
              {workspace.cvCard.actions.download}
            </span>
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => handleActionClick(e, () => onDelete?.(cv.id))}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px',
              width: '36px',
              height: '36px',
              background: '#F8FAFC',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              flex: 'none',
              order: 2,
              flexGrow: 0,
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FEF2F2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8FAFC'
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4H14"
                stroke="#EF4444"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.33333 4V13.3333C3.33333 14 4 14.6667 4.66667 14.6667H11.3333C12 14.6667 12.6667 14 12.6667 13.3333V4"
                stroke="#EF4444"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.33333 1.33333H10.6667V4H5.33333V1.33333Z"
                stroke="#EF4444"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.66667 7.33333V11.3333"
                stroke="#EF4444"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.33333 7.33333V11.3333"
                stroke="#EF4444"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
} 