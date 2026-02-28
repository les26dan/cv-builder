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
 * Maps each component to its unified application URL (all on port 3000)
 */
export const WORKFLOW_ROUTES: Record<string, WorkflowRoute> = {
  workspace: {
    component: 'workspace',
    path: '/cv-workspace',
    baseUrl: 'http://localhost:3000' // Unified application on port 3000
  },
  upload: {
    component: 'upload',
    path: '/cv-upload',
    baseUrl: 'http://localhost:3000' // Unified application on port 3000
  },
  loading: {
    component: 'upload',
    path: '/cv-upload/loading',
    baseUrl: 'http://localhost:3000' // Unified application on port 3000
  },
  editor: {
    component: 'editor',
    path: '/cv-guided-editing',
    baseUrl: 'http://localhost:3000' // Unified application on port 3000
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