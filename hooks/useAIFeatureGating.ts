/**
 * ===================================================================
 * AI FEATURE GATING HOOK
 * ===================================================================
 * 
 * MISSION CRITICAL: This hook implements the core AI monetization logic
 * 
 * Features:
 * - Check if user can use AI features (login + credits)
 * - Show login modal for guest users
 * - Show paywall modal for users with no credits
 * - Handle credit deduction after successful AI operations
 * 
 * Usage in AI feature components:
 * ```tsx
 * const { checkAIAccess, executeAIFeature } = useAIFeatureGating()
 * 
 * const handleAIFeature = async () => {
 *   const accessResult = await checkAIAccess()
 *   if (!accessResult.canProceed) return
 *   
 *   // Execute AI feature
 *   const result = await executeAIFeature(AIFeature.SUMMARY_IMPROVE, async () => {
 *     return await myAIFunction()
 *   })
 * }
 * ```
 * ===================================================================
 */

import { useState, useCallback } from 'react'
import { aiCreditsService, AIFeature, executeAIFeatureWithCredits } from '../shared/services/aiCreditsService'
import { useRouter } from 'next/navigation'

interface AIAccessResult {
  canProceed: boolean
  reason?: 'login_required' | 'insufficient_credits' | 'unknown_error'
  currentBalance?: number
  isGuest?: boolean
}

interface ExecuteAIResult<T> {
  success: boolean
  data?: T
  error?: string
  needsPayment?: boolean
  needsLogin?: boolean
}

interface AIFeatureGatingState {
  isCheckingAccess: boolean
  showLoginModal: boolean
  showPaywallModal: boolean
  lastError?: string
}

export function useAIFeatureGating(userId?: string) {
  const router = useRouter()
  const [state, setState] = useState<AIFeatureGatingState>({
    isCheckingAccess: false,
    showLoginModal: false,
    showPaywallModal: false
  })

  /**
   * Check if user can access AI features
   * Returns immediately for quick UI feedback
   */
  const checkAIAccess = useCallback(async (): Promise<AIAccessResult> => {
    setState(prev => ({ ...prev, isCheckingAccess: true, lastError: undefined }))

    try {
      // Check if user is logged in
      if (!userId || userId.startsWith('guest-')) {
        setState(prev => ({ 
          ...prev, 
          isCheckingAccess: false, 
          showLoginModal: true 
        }))
        
        return {
          canProceed: false,
          reason: 'login_required',
          isGuest: true
        }
      }

      // Check if user has credits
      const creditsData = await aiCreditsService.getCreditsBalance(userId)
      
      if (!creditsData.success) {
        setState(prev => ({ 
          ...prev, 
          isCheckingAccess: false,
          lastError: 'Failed to check credits'
        }))
        
        return {
          canProceed: false,
          reason: 'unknown_error'
        }
      }

      const balance = creditsData.balance || 0

      if (balance < 1) {
        setState(prev => ({ 
          ...prev, 
          isCheckingAccess: false, 
          showPaywallModal: true 
        }))
        
        return {
          canProceed: false,
          reason: 'insufficient_credits',
          currentBalance: balance,
          isGuest: false
        }
      }

      setState(prev => ({ ...prev, isCheckingAccess: false }))
      
      return {
        canProceed: true,
        currentBalance: balance,
        isGuest: false
      }

    } catch (error) {
      console.error('❌ AI access check failed:', error)
      
      setState(prev => ({ 
        ...prev, 
        isCheckingAccess: false,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }))
      
      return {
        canProceed: false,
        reason: 'unknown_error'
      }
    }
  }, [userId])

  /**
   * Execute AI feature with automatic credit deduction
   * Only deducts credits on successful AI operation
   */
  const executeAIFeature = useCallback(async <T>(
    feature: AIFeature,
    aiFunction: () => Promise<T>,
    sessionId?: string
  ): Promise<ExecuteAIResult<T>> => {
    try {
      // Check access first
      const accessResult = await checkAIAccess()
      
      if (!accessResult.canProceed) {
        return {
          success: false,
          error: accessResult.reason === 'login_required' 
            ? 'Login required for AI features' 
            : 'Insufficient credits',
          needsLogin: accessResult.reason === 'login_required',
          needsPayment: accessResult.reason === 'insufficient_credits'
        }
      }

      if (!userId || userId.startsWith('guest-')) {
        return {
          success: false,
          error: 'Login required for AI features',
          needsLogin: true
        }
      }

      // Execute AI feature with credit deduction
      const result = await executeAIFeatureWithCredits(
        userId,
        feature,
        aiFunction,
        sessionId
      )

      // Refresh credits counter after successful usage
      if (result.success && typeof window !== 'undefined' && (window as any).refreshAICredits) {
        (window as any).refreshAICredits()
      }

      return result

    } catch (error) {
      console.error('❌ AI feature execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI feature failed'
      }
    }
  }, [userId, checkAIAccess])

  /**
   * Handle login requirement - redirect to login with return URL
   */
  const handleLoginRequired = useCallback(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`
    
    if (typeof window !== 'undefined') {
      window.location.href = loginUrl
    } else {
      router.push(loginUrl)
    }
  }, [router])

  /**
   * Handle insufficient credits - show paywall
   */
  const handleInsufficientCredits = useCallback(() => {
    setState(prev => ({ ...prev, showPaywallModal: true }))
  }, [])

  /**
   * Close login modal
   */
  const closeLoginModal = useCallback(() => {
    setState(prev => ({ ...prev, showLoginModal: false }))
  }, [])

  /**
   * Close paywall modal
   */
  const closePaywallModal = useCallback(() => {
    setState(prev => ({ ...prev, showPaywallModal: false }))
  }, [])

  /**
   * Quick check if user is guest (for UI state)
   */
  const isGuest = !userId || userId.startsWith('guest-')

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = (reason?: string): string => {
    switch (reason) {
      case 'login_required':
        return 'Please login to use AI features'
      case 'insufficient_credits':
        return 'You need more AI credits to use this feature'
      case 'unknown_error':
        return 'Unable to check AI access. Please try again.'
      default:
        return 'Unknown error occurred'
    }
  }

  return {
    // State
    isCheckingAccess: state.isCheckingAccess,
    showLoginModal: state.showLoginModal,
    showPaywallModal: state.showPaywallModal,
    lastError: state.lastError,
    isGuest,

    // Functions
    checkAIAccess,
    executeAIFeature,
    handleLoginRequired,
    handleInsufficientCredits,
    closeLoginModal,
    closePaywallModal,
    getErrorMessage
  }
}

/**
 * Simplified hook for components that just need to check if AI is available
 */
export function useCanUseAI(userId?: string) {
  const { checkAIAccess, isGuest } = useAIFeatureGating(userId)

  const checkAIAvailable = useCallback(async (): Promise<boolean> => {
    const result = await checkAIAccess()
    return result.canProceed
  }, [checkAIAccess])

  return {
    checkAIAvailable,
    isGuest,
    requiresLogin: isGuest
  }
}

/**
 * Hook for button components to show appropriate AI feature state
 */
export function useAIButtonState(userId?: string) {
  const { isGuest } = useAIFeatureGating(userId)

  const getAIButtonConfig = useCallback((hasCredits: boolean = true) => {
    if (isGuest) {
      return {
        disabled: false, // Allow click to show login
        text: 'AI Feature (Login Required)',
        variant: 'secondary' as const,
        showLoginIcon: true,
        tooltip: 'Login required to use AI features'
      }
    }

    if (!hasCredits) {
      return {
        disabled: false, // Allow click to show paywall
        text: 'AI Feature (Purchase Credits)',
        variant: 'secondary' as const,
        showCreditIcon: true,
        tooltip: 'Purchase credits to use AI features'
      }
    }

    return {
      disabled: false,
      text: 'AI Feature (1 Credit)',
      variant: 'primary' as const,
      showAIIcon: true,
      tooltip: 'Use 1 AI credit for this feature'
    }
  }, [isGuest])

  return {
    getAIButtonConfig,
    isGuest,
    showLoginBadge: isGuest
  }
}
