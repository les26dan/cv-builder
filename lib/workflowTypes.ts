/**
 * Workflow Types for CV Workspace Navigation
 * Essential types for WorkflowRouter integration
 */

/**
 * Workflow routing configuration interface
 */
export interface WorkflowRoute {
  component: 'workspace' | 'upload' | 'editor'
  path: string
  baseUrl: string
  params?: Record<string, string>
}

/**
 * Workflow routing configuration
 * Maps each component to its development URL and routing information
 */
export const WORKFLOW_ROUTES: Record<string, WorkflowRoute> = {
  workspace: {
    component: 'workspace',
    path: '/workspace',
    baseUrl: 'http://localhost:3001' // cv-workspace-navigation
  },
  upload: {
    component: 'upload',
    path: '/',
    baseUrl: 'http://localhost:3000' // cv-jd-upload
  },
  loading: {
    component: 'upload',
    path: '/loading',
    baseUrl: 'http://localhost:3000' // cv-jd-upload loading screen
  },
  editor: {
    component: 'editor',
    path: '/',
    baseUrl: 'http://localhost:5173' // cv-guided-editing
  }
}

/**
 * Navigation parameters for cross-app transitions
 */
export interface NavigationParams {
  cvId?: string
  userId?: string
  jobDescription?: string
  uploadedFile?: {
    name: string
    size: number
    type: string
    url: string
  }
  analysisResults?: {
    suggestions: string[]
    score: number
    keywords: string[]
  }
}

/**
 * Workflow transition result
 */
export interface TransitionResult {
  success: boolean
  targetUrl?: string
  error?: string
  data?: NavigationParams
} 