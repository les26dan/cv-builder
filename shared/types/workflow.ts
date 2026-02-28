/**
 * Shared types for CV Workflow Integration
 * Defines interfaces for routing, data flow, and component integration
 */

/**
 * Workflow routing configuration interface
 * Supports navigation between Next.js App Router, Pages Router, and Vite SPA
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
    baseUrl: 'http://localhost:3002' // cv-workspace-navigation
  },
  upload: {
    component: 'upload',
    path: '/',
    baseUrl: 'http://localhost:4000' // cv-jd-upload
  },
  loading: {
    component: 'upload',
    path: '/loading',
    baseUrl: 'http://localhost:4000' // cv-jd-upload loading screen
  },
  editor: {
    component: 'editor',
    path: '/',
    baseUrl: 'http://localhost:5173' // cv-guided-editing
  }
}

/**
 * Navigation parameters for cross-app transitions
 * Supports data passing between workflow components
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
 * Tracks navigation success and error handling
 */
export interface TransitionResult {
  success: boolean
  targetUrl?: string
  error?: string
  data?: any
}

// ===== DATABASE SCHEMA TYPES =====

/**
 * Core CV Data structure from cv-guided-editing
 * Base interface for CV content structure
 */
export interface CVData {
  contact: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
  }
  summary: {
    content: string
  }
  experience: {
    items: Array<{
      id: string
      title: string
      company: string
      location: string
      startDate: string
      endDate: string
      current: boolean
      bullets: string[]
    }>
  }
  skills: {
    items: string[]
  }
  education: {
    items: Array<{
      id: string
      degree: string
      institution: string
      location: string
      graduationDate: string
      description?: string
    }>
  }
  aiUsage?: {
    [sectionId: string]: boolean
  }
  sectionOrder?: string[]
  sectionTitles?: Record<string, string>
  [key: string]: any // Support for custom sections
}

/**
 * Extended CV Data for workflow integration
 * Includes workflow-specific fields and metadata
 */
export interface WorkflowCVData extends CVData {
  id: string
  userId: string
  title: string
  status: 'draft' | 'analyzing' | 'completed'
  score: number
  uploadedFile?: {
    name: string
    size: number
    type: string
    url: string
    originalText?: string
  }
  jobDescription?: {
    text?: string
    url?: string
    keywords?: string[]
  }
  analysisResults?: {
    suggestions: Array<{
      section: string
      recommendation: string
      priority: 'high' | 'medium' | 'low'
      implemented: boolean
    }>
    score: number
    keywords: string[]
    improvements: Array<{
      section: string
      recommendation: string
      priority: 'high' | 'medium' | 'low'
    }>
    matchPercentage?: number
  }
  workflow: {
    currentStep: 'upload' | 'analysis' | 'editing' | 'completed'
    stepsCompleted: string[]
    lastActiveStep: string
    timeSpent: number // in seconds
  }
  metadata: {
    createdAt: string
    updatedAt: string
    lastSavedAt?: string
    version: number
    source: 'upload' | 'template' | 'scratch'
  }
  settings: {
    autoSave: boolean
    aiAssistance: boolean
    template: string
    language: 'vi' | 'en'
  }
}

/**
 * Supabase database table structure
 * Maps to cv_workflow table in database
 */
export interface CVWorkflowTable {
  id: string
  user_id: string
  title: string
  status: 'draft' | 'analyzing' | 'completed'
  score: number
  cv_data: WorkflowCVData
  uploaded_file_url?: string
  uploaded_file_name?: string
  uploaded_file_size?: number
  uploaded_file_type?: string
  uploaded_file_text?: string
  job_description_text?: string
  job_description_url?: string
  job_description_keywords?: string[]
  analysis_results?: any // JSON field
  workflow_current_step: string
  workflow_steps_completed: string[]
  workflow_last_active_step: string
  workflow_time_spent: number
  auto_save_enabled: boolean
  ai_assistance_enabled: boolean
  template_name: string
  language: string
  version: number
  source: string
  created_at: string
  updated_at: string
  last_saved_at?: string
}

/**
 * Database operation result types
 */
export interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * CV workflow status tracking
 */
export type WorkflowStatus = 'draft' | 'analyzing' | 'completed'
export type WorkflowStep = 'upload' | 'analysis' | 'editing' | 'completed'
export type CVSource = 'upload' | 'template' | 'scratch'
export type SupportedLanguage = 'vi' | 'en'

/**
 * Analysis suggestion types
 */
export interface AnalysisSuggestion {
  section: string
  recommendation: string
  priority: 'high' | 'medium' | 'low'
  implemented: boolean
}

/**
 * File upload metadata
 */
export interface UploadedFileMetadata {
  name: string
  size: number
  type: string
  url: string
  originalText?: string
  extractedAt?: string
}

/**
 * Job description analysis
 */
export interface JobDescriptionData {
  text?: string
  url?: string
  keywords?: string[]
  analyzedAt?: string
  source: 'manual' | 'url_scraping'
} 