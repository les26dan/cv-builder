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
    // Use actual workflow step if available, otherwise fall back to status-based mapping
    const workflowStep = cv.workflowStep || cv.status
    const stepsCompleted = cv.workflowStepsCompleted || []
    
    // Calculate current step number based on workflow
    const getStepNumber = () => {
      if (cv.status === 'completed') return '4/4'
      if (workflowStep === 'analysis' || workflowStep === 'analyzing') return '2/4'
      if (workflowStep === 'editing') return '3/4'
      return '1/4' // upload or new
    }
    
    const stepNumber = getStepNumber()
    
    const steps = {
      en: {
        upload: `Step ${stepNumber}: Upload Resume & Job Description`,
        analysis: `Step ${stepNumber}: Resume Analysis`,
        analyzing: `Step ${stepNumber}: Resume Analysis`,
        editing: `Step ${stepNumber}: Resume Editing`,
        completed: 'Step 4/4: Complete!',
      },
      vi: {
        upload: `Bước ${stepNumber}: Upload CV & Mô tả công việc`,
        analysis: `Bước ${stepNumber}: Phân tích CV`,
        analyzing: `Bước ${stepNumber}: Phân tích CV`,
        editing: `Bước ${stepNumber}: Chỉnh sửa CV`,
        completed: 'Bước 4/4: Hoàn tất!',
      }
    }
    
    // First try to get text by workflow step, then by status
    const langSteps = steps[currentLanguage]
    const stepText = (langSteps as any)?.[workflowStep] || 
                    (langSteps as any)?.[cv.status] || 
                    langSteps?.upload
                    
    return stepText || steps.en.upload
  }

  // Handle card click - navigate to editing based on resume status
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }

    // Navigate based on resume status
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
      className="flex flex-row items-start p-5 gap-4 w-full max-w-[1152px] h-[180px] bg-white rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 font-inter"
      style={{
        border: cardBorder,
      }}
    >
      {/* Resume Preview */}
      <div className="flex flex-row justify-center items-center w-20 h-[100px] bg-slate-50 border border-gray-200 rounded-lg flex-none">
        {/* File Icon */}
        <div className="w-8 h-8 flex-none relative">
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

      {/* Resume Details */}
      <div className="flex flex-col items-start gap-3 flex-1 h-[140px]">
        {/* Resume Header */}
        <div className="flex flex-row justify-between items-start gap-2 w-full h-[46px] flex-none self-stretch">
          {/* Resume Info */}
          <div className="flex flex-col items-start gap-1 w-full h-[46px] flex-none">
            {/* Title Row */}
            <div className="flex flex-row items-center justify-between w-full h-[26px] flex-none self-stretch">
              {/* Resume Title */}
              <div className="h-[26px] font-inter font-semibold text-xl leading-[26px] text-gray-900 flex-none overflow-hidden text-ellipsis whitespace-nowrap flex-1 mr-2">
                {cv.title.replace(/^CV\s+/i, '')}
              </div>

              {/* Score */}
              <div className={`font-inter font-semibold text-lg leading-6 flex-none ${
                isHighScore ? 'text-green-500' : cv.score >= 70 ? 'text-amber-500' : 'text-gray-500'
              }`}>
                {workspace.cvCard.score(cv.score)}
              </div>
            </div>

            {/* Resume Subtitle */}
            <div className="w-full h-[20px] font-inter font-normal text-base leading-[20px] text-gray-500 flex-none self-stretch">
              {workspace.cvCard.lastUpdated.prefix} {formatTimeAgo(cv.lastUpdated, currentLanguage)}
            </div>
          </div>
        </div>

        {/* Progress Info */}
        <div 
          className="flex flex-col items-start px-3 py-2 gap-1 w-full min-h-[30px] rounded-md flex-none self-stretch"
          style={{ backgroundColor: progressBgColor }}
        >
          <div 
            className="w-full font-inter font-normal text-sm leading-[16px] flex-none self-stretch whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ color: progressTextColor }}
          >
            {getProgressText()}
          </div>
        </div>

        {/* Resume Actions */}
        <div className="flex flex-row items-center gap-2 w-full h-9 flex-none self-stretch">
          {/* Primary Action Button */}
          {isCompleted ? (
            /* Edit Button for completed resumes */
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
              <span className="font-inter font-medium text-base leading-[19px] text-[#0277BD] whitespace-nowrap">
                {workspace.cvCard.actions.edit}
              </span>
            </button>
          ) : (
            /* Continue Button for in-progress resumes - Main CTA Style */
            <button
              onClick={(e) => handleActionClick(e, () => onContinue?.(cv.id))}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '12px 16px',
                width: '110px',
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
              <span className="font-inter font-medium text-base leading-[19px] text-white whitespace-nowrap">
                {workspace.cvCard.actions.continue}
              </span>
            </button>
          )}

          {/* Download Button - Apply Sub CTA style for incomplete CVs */}
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
              background: isCompleted ? '#4CAF50' : '#FFFFFF',
              borderRadius: '6px',
              border: isCompleted ? 'none' : '1px solid #0277BD',
              cursor: 'pointer',
              flex: 'none',
              order: 1,
              flexGrow: 0,
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => {
              if (isCompleted) {
                e.currentTarget.style.background = '#45A049'
              } else {
                e.currentTarget.style.background = '#F8FAFC'
              }
            }}
            onMouseLeave={(e) => {
              if (isCompleted) {
                e.currentTarget.style.background = '#4CAF50'
              } else {
                e.currentTarget.style.background = '#FFFFFF'
              }
            }}
          >
            <span className={`font-inter font-medium text-base leading-[19px] whitespace-nowrap ${
              isCompleted ? 'text-white' : 'text-[#0277BD]'
            }`}>
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