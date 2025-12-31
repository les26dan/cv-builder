/**
 * Workflow Transition Service
 * Handles seamless data handoff between CV JD Upload and CV Guided Editing
 * Following OkBuddy tenets: modular, data persistence, smooth UX
 */

import type { CVAnalysisResult, JobAnalysisResult, CVJDMatchResult } from '../types/analysis'

// Environment configuration for cross-app navigation
const GUIDED_EDITING_URL = process.env.NEXT_PUBLIC_GUIDED_EDITING_URL || 'http://localhost:5173'

export interface WorkflowTransitionData {
  analysisId: string
  userId: string
  cvAnalysis: CVAnalysisResult
  jobAnalysis?: JobAnalysisResult
  matching?: CVJDMatchResult
  cvTitle?: string
  originalFile?: {
    name: string
    size: number
    type: string
  }
  jobDescription?: string
}

export interface TransitionResult {
  success: boolean
  redirectUrl?: string
  error?: string
}

/**
 * Prepare analysis data for CV Guided Editing handoff
 * Transforms AI analysis results into format expected by guided editing
 */
export function prepareWorkflowData(
  analysisId: string,
  userId: string,
  cvAnalysis: CVAnalysisResult,
  jobAnalysis?: JobAnalysisResult,
  matching?: CVJDMatchResult,
  metadata?: {
    cvTitle?: string
    originalFile?: { name: string; size: number; type: string }
    jobDescription?: string
  }
): WorkflowTransitionData {
  return {
    analysisId,
    userId,
    cvAnalysis,
    jobAnalysis,
    matching,
    cvTitle: metadata?.cvTitle || `CV-${Date.now()}`,
    originalFile: metadata?.originalFile,
    jobDescription: metadata?.jobDescription
  }
}

/**
 * Store transition data in sessionStorage for cross-app access
 * Uses temporary storage with TTL for security
 */
export function storeTransitionData(
  transitionData: WorkflowTransitionData,
  ttlMinutes: number = 30
): string {
  const storageKey = `okbuddy_workflow_${transitionData.analysisId}`
  const expirationTime = Date.now() + (ttlMinutes * 60 * 1000)
  
  const storedData = {
    ...transitionData,
    expiresAt: expirationTime,
    timestamp: Date.now()
  }

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(storedData))
    console.log('Transition data stored:', storageKey, {
      analysisId: transitionData.analysisId,
      cvTitle: transitionData.cvTitle,
      expiresAt: new Date(expirationTime).toISOString()
    })
    return storageKey
  } catch (error) {
    console.error('Failed to store transition data:', error)
    throw new Error('Failed to prepare data for guided editing')
  }
}

/**
 * Generate guided editing URL with analysis parameters
 * Creates URL that CV Guided Editing can use to load analysis data
 */
export function generateGuidedEditingUrl(
  analysisId: string,
  storageKey?: string
): string {
  const params = new URLSearchParams({
    analysisId,
    source: 'upload',
    timestamp: Date.now().toString()
  })

  if (storageKey) {
    params.set('dataKey', storageKey)
  }

  return `${GUIDED_EDITING_URL}?${params.toString()}`
}

/**
 * Complete workflow transition to CV Guided Editing
 * Main function to call when analysis is complete and user should proceed
 */
export async function transitionToGuidedEditing(
  transitionData: WorkflowTransitionData
): Promise<TransitionResult> {
  try {
    // Store data for cross-app access
    const storageKey = storeTransitionData(transitionData)
    
    // Generate redirect URL
    const redirectUrl = generateGuidedEditingUrl(
      transitionData.analysisId,
      storageKey
    )

    console.log('Workflow transition prepared:', {
      analysisId: transitionData.analysisId,
      redirectUrl,
      cvTitle: transitionData.cvTitle,
      hasJobAnalysis: !!transitionData.jobAnalysis,
      hasMatching: !!transitionData.matching
    })

    return {
      success: true,
      redirectUrl
    }

  } catch (error: any) {
    console.error('Workflow transition failed:', error)
    
    return {
      success: false,
      error: error.message || 'Failed to transition to guided editing'
    }
  }
}

/**
 * Retrieve transition data from sessionStorage
 * Used by CV Guided Editing to load analysis results
 */
export function retrieveTransitionData(
  analysisId: string,
  storageKey?: string
): WorkflowTransitionData | null {
  try {
    const key = storageKey || `okbuddy_workflow_${analysisId}`
    const storedDataStr = sessionStorage.getItem(key)
    
    if (!storedDataStr) {
      console.warn('No transition data found for:', analysisId)
      return null
    }

    const storedData = JSON.parse(storedDataStr)
    
    // Check expiration
    if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
      console.warn('Transition data expired for:', analysisId)
      sessionStorage.removeItem(key)
      return null
    }

    console.log('Transition data retrieved:', {
      analysisId: storedData.analysisId,
      cvTitle: storedData.cvTitle,
      age: Date.now() - storedData.timestamp
    })

    return storedData as WorkflowTransitionData

  } catch (error) {
    console.error('Failed to retrieve transition data:', error)
    return null
  }
}

/**
 * Clean up expired transition data
 * Should be called periodically to prevent storage bloat
 */
export function cleanupExpiredTransitionData(): number {
  let cleanedCount = 0
  
  try {
    const keys = Object.keys(sessionStorage)
    const workflowKeys = keys.filter(key => key.startsWith('okbuddy_workflow_'))
    
    for (const key of workflowKeys) {
      try {
        const dataStr = sessionStorage.getItem(key)
        if (dataStr) {
          const data = JSON.parse(dataStr)
          if (data.expiresAt && Date.now() > data.expiresAt) {
            sessionStorage.removeItem(key)
            cleanedCount++
          }
        }
      } catch (error) {
        // Remove corrupted data
        sessionStorage.removeItem(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired workflow data entries`)
    }
    
  } catch (error) {
    console.error('Failed to cleanup transition data:', error)
  }
  
  return cleanedCount
}

/**
 * Get workflow transition statistics
 * Useful for monitoring and debugging
 */
export function getTransitionStats(): {
  totalEntries: number
  activeEntries: number
  expiredEntries: number
  oldestEntry?: number
  newestEntry?: number
} {
  const stats = {
    totalEntries: 0,
    activeEntries: 0,
    expiredEntries: 0,
    oldestEntry: undefined as number | undefined,
    newestEntry: undefined as number | undefined
  }
  
  try {
    const keys = Object.keys(sessionStorage)
    const workflowKeys = keys.filter(key => key.startsWith('okbuddy_workflow_'))
    
    stats.totalEntries = workflowKeys.length
    
    for (const key of workflowKeys) {
      try {
        const dataStr = sessionStorage.getItem(key)
        if (dataStr) {
          const data = JSON.parse(dataStr)
          
          if (data.timestamp) {
            if (!stats.oldestEntry || data.timestamp < stats.oldestEntry) {
              stats.oldestEntry = data.timestamp
            }
            if (!stats.newestEntry || data.timestamp > stats.newestEntry) {
              stats.newestEntry = data.timestamp
            }
          }
          
          if (data.expiresAt && Date.now() > data.expiresAt) {
            stats.expiredEntries++
          } else {
            stats.activeEntries++
          }
        }
      } catch (error) {
        // Count corrupted entries as expired
        stats.expiredEntries++
      }
    }
    
  } catch (error) {
    console.error('Failed to get transition stats:', error)
  }
  
  return stats
} 