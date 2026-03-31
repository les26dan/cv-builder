/**
 * ===================================================================
 * AI CREDITS COUNTER COMPONENT
 * ===================================================================
 * 
 * MISSION CRITICAL: Displays AI credits balance in header for all users
 * 
 * Features:
 * - Shows 5 credits for guest users (login required for usage)
 * - Shows real balance for authenticated users
 * - Color coding: green (10+), orange (3-9), red (0-2)
 * - Real-time updates after credit usage
 * - Click to show paywall when credits low/zero
 * - Responsive design for all screen sizes
 * ===================================================================
 */

'use client'

import { useState, useEffect } from 'react'
import { AICreditsService, getCreditsDisplayData } from '../shared/services/aiCreditsService'

interface AICreditsCounterProps {
  userId?: string
  variant?: 'header' | 'standalone'
  showLabel?: boolean
  onClick?: () => void
  className?: string
}

interface CreditsDisplay {
  balance: number
  isGuest: boolean
  isLoading: boolean
  error?: string
}

export default function AICreditsCounter({
  userId,
  variant = 'header',
  showLabel = true,
  onClick,
  className = ''
}: AICreditsCounterProps) {
  const [creditsDisplay, setCreditsDisplay] = useState<CreditsDisplay>({
    balance: 5,
    isGuest: true,
    isLoading: true
  })

  // Load credits data
  useEffect(() => {
    loadCreditsData()
  }, [userId])

  const loadCreditsData = async () => {
    try {
      setCreditsDisplay(prev => ({ ...prev, isLoading: true, error: undefined }))

      const creditsData = await getCreditsDisplayData(userId)

      if (creditsData.success) {
        setCreditsDisplay({
          balance: creditsData.balance || 0,
          isGuest: !userId || userId.startsWith('guest-'),
          isLoading: false
        })
      } else {
        console.error('Failed to load credits:', creditsData.error)
        // For admin/authenticated users, try to provide default credits
        const isAdmin = userId && (userId.includes('admin') || userId.includes('okbuddy'))
        const defaultBalance = isAdmin ? 5 : (userId && !userId.startsWith('guest-') ? 0 : 5)
        
        setCreditsDisplay({
          balance: defaultBalance,
          isGuest: !userId || userId.startsWith('guest-'),
          isLoading: false,
          error: creditsData.error
        })
      }
    } catch (error) {
      console.error('Error loading credits:', error)
      setCreditsDisplay({
        balance: userId && !userId.startsWith('guest-') ? 0 : 5,
        isGuest: !userId || userId.startsWith('guest-'),
        isLoading: false,
        error: 'Failed to load credits'
      })
    }
  }

  // Refresh credits data (for external updates)
  const refreshCredits = () => {
    loadCreditsData()
  }

  // Expose refresh function globally for other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshAICredits = refreshCredits
    }
  }, [])

  const getBalanceColorClass = (): string => {
    if (creditsDisplay.isLoading) return 'text-gray-500'
    if (creditsDisplay.error) return 'text-red-500'
    
    try {
      const service = AICreditsService.getInstance()
      return service.getBalanceColorClass(creditsDisplay.balance)
    } catch (error) {
      console.error('Error getting balance color class:', error)
      // Fallback color logic
      const balance = creditsDisplay.balance
      if (balance >= 10) return 'text-green-600'
      if (balance >= 3) return 'text-orange-600'
      return 'text-red-600'
    }
  }

  const getBackgroundColorClass = (): string => {
    if (creditsDisplay.isLoading) return 'bg-gray-50'
    if (creditsDisplay.error) return 'bg-red-50'
    
    try {
      const service = AICreditsService.getInstance()
      return service.getBalanceBackgroundClass(creditsDisplay.balance)
    } catch (error) {
      console.error('Error getting background color class:', error)
      // Fallback background logic
      const balance = creditsDisplay.balance
      if (balance >= 10) return 'bg-green-50'
      if (balance >= 3) return 'bg-orange-50'
      return 'bg-red-50'
    }
  }

  const getBorderColorClass = (): string => {
    if (creditsDisplay.isLoading) return 'border-gray-200'
    if (creditsDisplay.error) return 'border-red-200'
    
    const balance = creditsDisplay.balance
    if (balance >= 10) return 'border-green-200'
    if (balance >= 3) return 'border-orange-200'
    return 'border-red-200'
  }

  const getCreditsText = (): string => {
    if (creditsDisplay.isLoading) return '...'
    if (creditsDisplay.error) {
      // Show balance if available, otherwise show helpful error
      if (creditsDisplay.balance !== undefined) {
        const balance = creditsDisplay.balance
        return `${balance} credit${balance !== 1 ? 's' : ''}`
      }
      return 'Reload'
    }
    
    try {
      const service = AICreditsService.getInstance()
      return service.formatCreditsDisplay(creditsDisplay.balance)
    } catch (error) {
      console.error('Error formatting credits display:', error)
      // Fallback formatting logic
      const balance = creditsDisplay.balance
      return `${balance} credit${balance !== 1 ? 's' : ''}`
    }
  }

  const getTooltipText = (): string => {
    if (creditsDisplay.isLoading) return 'Loading AI credits...'
    if (creditsDisplay.error) {
      if (creditsDisplay.balance !== undefined) {
        return `Credits: ${creditsDisplay.balance} (Click to refresh)`
      }
      return 'Failed to load credits. Click to retry.'
    }
    
    if (creditsDisplay.isGuest) {
      return 'You have 5 free AI credits. Login to use AI features.'
    }
    
    const balance = creditsDisplay.balance
    if (balance === 0) {
      return 'No AI credits remaining. Click to purchase more credits.'
    }
    if (balance <= 2) {
      return `Low credits warning: ${balance} remaining. Click to purchase more.`
    }
    
    return `AI credits available: ${balance}. Each AI feature costs 1 credit.`
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (creditsDisplay.error) {
      // Retry loading credits when there's an error
      console.log('AICreditsCounter: Retrying credits load...')
      loadCreditsData()
    } else if (creditsDisplay.balance <= 2 || creditsDisplay.isGuest) {
      // Default behavior: show paywall or login
      console.log('AICreditsCounter: Should show paywall/login')
      // This will be implemented when paywall component is ready
    }
  }

  const shouldShowClickable = (): boolean => {
    return creditsDisplay.isGuest || creditsDisplay.balance <= 2 || !!onClick || !!creditsDisplay.error
  }

  // Variant-specific styling
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'header':
        return 'px-3 py-1.5 text-sm font-medium'
      case 'standalone':
        return 'px-4 py-2 text-base font-semibold'
      default:
        return 'px-3 py-1.5 text-sm font-medium'
    }
  }

  const baseClasses = `
    flex items-center gap-2 rounded-full border transition-all duration-200
    ${getVariantClasses()}
    ${getBackgroundColorClass()}
    ${getBalanceColorClass()}
    ${getBorderColorClass()}
    ${shouldShowClickable() ? 'cursor-pointer hover:shadow-sm active:scale-95' : 'cursor-default'}
    ${className}
  `.trim()

  return (
    <div
      className={baseClasses}
      onClick={shouldShowClickable() ? handleClick : undefined}
      title={getTooltipText()}
      role={shouldShowClickable() ? 'button' : 'status'}
      aria-label={getTooltipText()}
      tabIndex={shouldShowClickable() ? 0 : -1}
      onKeyDown={(e) => {
        if (shouldShowClickable() && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* AI Sparkle Icon */}
      <div className="flex-shrink-0">
        {creditsDisplay.isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : creditsDisplay.error ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
      </div>

      {/* Credits Text */}
      {showLabel && (
        <span className="font-medium whitespace-nowrap">
          {getCreditsText()}
        </span>
      )}

      {/* Guest Badge */}
      {creditsDisplay.isGuest && !creditsDisplay.isLoading && (
        <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
          Guest
        </span>
      )}

      {/* Low Credits Warning */}
      {!creditsDisplay.isGuest && !creditsDisplay.isLoading && creditsDisplay.balance <= 2 && creditsDisplay.balance > 0 && (
        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
          Low
        </span>
      )}

      {/* Zero Credits Warning */}
      {!creditsDisplay.isGuest && !creditsDisplay.isLoading && creditsDisplay.balance === 0 && (
        <span className="text-xs px-1.5 py-0.5 bg-red-500 text-white rounded-full font-medium">
          Empty
        </span>
      )}
    </div>
  )
}

/**
 * Hook for components to refresh credits counter
 */
export function useRefreshAICredits() {
  return () => {
    if (typeof window !== 'undefined' && (window as any).refreshAICredits) {
      (window as any).refreshAICredits()
    }
  }
}

/**
 * Utility function to trigger credits refresh from anywhere
 */
export function refreshAICreditsGlobally() {
  if (typeof window !== 'undefined' && (window as any).refreshAICredits) {
    (window as any).refreshAICredits()
  }
}
