/**
 * Workflow Router Service for CV Workspace Navigation
 * Handles navigation between CV workflow components with state persistence
 */

import { WORKFLOW_ROUTES, NavigationParams, TransitionResult, WorkflowRoute } from './workflowTypes'

/**
 * Workflow Router Class
 * Manages navigation between workspace, upload, and editor components
 */
export class WorkflowRouter {
  private static instance: WorkflowRouter
  
  /**
   * Singleton pattern for consistent router instance
   */
  public static getInstance(): WorkflowRouter {
    if (!WorkflowRouter.instance) {
      WorkflowRouter.instance = new WorkflowRouter()
    }
    return WorkflowRouter.instance
  }

  /**
   * Navigate to upload component (for new CV creation)
   * @param params - Navigation parameters with CV creation context
   * @returns Promise<TransitionResult>
   */
  public async navigateToUpload(params?: NavigationParams): Promise<TransitionResult> {
    return this.navigate('upload', params)
  }

  /**
   * Navigate to editor component (for existing CV editing)
   * @param params - Navigation parameters with CV data
   * @returns Promise<TransitionResult>
   */
  public async navigateToEditor(params?: NavigationParams): Promise<TransitionResult> {
    return this.navigate('editor', params)
  }

  /**
   * Core navigation method
   * Handles cross-origin navigation with state persistence
   * @param routeKey - Target route key from WORKFLOW_ROUTES
   * @param params - Navigation parameters
   * @returns Promise<TransitionResult>
   */
  private async navigate(routeKey: string, params?: NavigationParams): Promise<TransitionResult> {
    try {
      const route = WORKFLOW_ROUTES[routeKey]
      if (!route) {
        throw new Error(`Invalid route: ${routeKey}`)
      }

      // Persist navigation data for cross-app access
      if (params) {
        await this.persistNavigationData(params)
      }

      // Build target URL with parameters
      const targetUrl = this.buildTargetUrl(route, params)

      // Handle browser navigation
      if (typeof window !== 'undefined') {
        // Store current location for back navigation
        this.storeNavigationHistory()
        
        // Navigate to target URL
        window.location.href = targetUrl
      }

      return {
        success: true,
        targetUrl,
        data: params
      }
    } catch (error) {
      console.error('Navigation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Navigation failed'
      }
    }
  }

  /**
   * Build target URL with query parameters
   * @param route - Target route configuration
   * @param params - Navigation parameters
   * @returns Complete target URL
   */
  private buildTargetUrl(route: WorkflowRoute, params?: NavigationParams): string {
    const baseUrl = `${route.baseUrl}${route.path}`
    
    if (!params) {
      return baseUrl
    }

    // Convert params to URL search params
    const searchParams = new URLSearchParams()
    
    if (params.cvId) searchParams.set('cvId', params.cvId)
    if (params.userId) searchParams.set('userId', params.userId)
    if (params.jobDescription) searchParams.set('jd', 'true') // Flag for JD presence
    
    const queryString = searchParams.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  /**
   * Persist navigation data for cross-app access
   * Uses localStorage for data transfer between applications
   * @param params - Navigation parameters to persist
   */
  private async persistNavigationData(params: NavigationParams): Promise<void> {
    try {
      const navigationData = {
        ...params,
        timestamp: Date.now(),
        source: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('okbuddy_workflow_data', JSON.stringify(navigationData))
        
        // Set expiration (5 minutes)
        setTimeout(() => {
          localStorage.removeItem('okbuddy_workflow_data')
        }, 5 * 60 * 1000)
      }
    } catch (error) {
      console.warn('Failed to persist navigation data:', error)
    }
  }

  /**
   * Store navigation history for back button support
   */
  private storeNavigationHistory(): void {
    try {
      if (typeof window === 'undefined') return

      const history = JSON.parse(localStorage.getItem('okbuddy_nav_history') || '[]')
      history.push({
        url: window.location.href,
        timestamp: Date.now()
      })
      
      // Keep only last 10 entries
      if (history.length > 10) {
        history.shift()
      }
      
      localStorage.setItem('okbuddy_nav_history', JSON.stringify(history))
    } catch (error) {
      console.warn('Failed to store navigation history:', error)
    }
  }
}

/**
 * Export singleton instance for consistent usage
 */
export const workflowRouter = WorkflowRouter.getInstance() 