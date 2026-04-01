/**
 * CV Workflow Data Service
 * Comprehensive data operations for CV workflow integration
 * Handles CRUD operations, validation, caching, and backup/recovery
 */

import { 
  WorkflowCVData, 
  CVWorkflowTable, 
  DatabaseResult, 
  WorkflowStatus,
  WorkflowStep,
  CVSource,
  SupportedLanguage,
  AnalysisSuggestion,
  UploadedFileMetadata,
  JobDescriptionData
} from '../types/workflow'
import { databaseService } from './database'
import { environmentConfig } from '../../config/environment'
import { compressCVData, decompressCVData } from '../../utils/compression'

// Mock data completely removed - using real database only

/**
 * CV Workflow Data Service Class
 * Handles all data operations for the CV workflow integration
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export class CVWorkflowDataService {
  private static instance: CVWorkflowDataService
  private cache = new Map<string, WorkflowCVData>()
  private cacheExpiry = new Map<string, number>()

  /** Returns true if id is a valid UUID (guest-*, template-* etc. are not). */
  private static isValidUuid(id: string | undefined): boolean {
    return !!id && UUID_REGEX.test(id)
  }

  /**
   * Singleton pattern for consistent service instance
   */
  public static getInstance(): CVWorkflowDataService {
    if (!CVWorkflowDataService.instance) {
      CVWorkflowDataService.instance = new CVWorkflowDataService()
    }
    return CVWorkflowDataService.instance
  }


  /**
   * Save draft CV data
   * @param cvData - CV data to save
   * @returns Promise<DatabaseResult<WorkflowCVData>>
   */
  public async saveDraft(cvData: WorkflowCVData): Promise<DatabaseResult<WorkflowCVData>> {
    try {
      // Validate CV data before saving
      const validationResult = this.validateCVData(cvData)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validationResult.errors.join(', ')}`
        }
      }

      // Guest/template CVs (non-UUID id) — skip DB to avoid invalid uuid error
      if (!CVWorkflowDataService.isValidUuid(cvData.id)) {
        const now = new Date().toISOString()
        const updatedCVData: WorkflowCVData = {
          ...cvData,
          metadata: {
            ...cvData.metadata,
            updatedAt: now,
            lastSavedAt: now,
            version: (cvData.metadata?.version ?? 0) + 1
          }
        }
        this.updateCache(updatedCVData.id, updatedCVData)
        return { success: true, data: updatedCVData }
      }

      const client = await databaseService.getClient()
      if (!client) {
        return {
          success: false,
          error: 'Database not available'
        }
      }

      // Update timestamps
      const now = new Date().toISOString()
      const updatedCVData: WorkflowCVData = {
        ...cvData,
        metadata: {
          ...cvData.metadata,
          updatedAt: now,
          lastSavedAt: now,
          version: cvData.metadata.version + 1
        }
      }

      // Prepare database row
      const dbRow: Partial<CVWorkflowTable> = this.mapCVDataToTableRow(updatedCVData)

      // Upsert to database
      const { data, error } = await client
        .from('cv_workflow')
        .upsert([dbRow])
        .select()
        .single()

      if (error) {
        console.error('Database save error:', error)
        return {
          success: false,
          error: `Database save failed: ${error.message}`,
          code: error.code
        }
      }

      // Update cache
      this.updateCache(updatedCVData.id, updatedCVData)

      return {
        success: true,
        data: updatedCVData
      }

    } catch (error) {
      console.error('Save draft error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Save draft failed'
      }
    }
  }

  /**
   * Load draft CV data
   * @param userId - User ID
   * @param cvId - Optional CV ID, if not provided returns latest draft
   * @returns Promise<DatabaseResult<WorkflowCVData>>
   */
  public async loadDraft(userId: string, cvId?: string): Promise<DatabaseResult<WorkflowCVData>> {
    try {
      // Check cache first
      if (cvId && this.isCacheValid(cvId)) {
        const cachedData = this.cache.get(cvId)
        if (cachedData) {
          return { success: true, data: cachedData }
        }
      }

      // Guest/template IDs are not UUIDs — do not query Supabase (would cause 22P02)
      if (cvId && !CVWorkflowDataService.isValidUuid(cvId)) {
        return { success: false, error: 'No draft found' }
      }

      const client = await databaseService.getClient()
      if (!client) {
        return {
          success: false,
          error: 'Database not available'
        }
      }

      let query = client
        .from('cv_workflow')
        .select('*')
        .eq('user_id', userId)

      if (cvId) {
        query = query.eq('id', cvId)
      } else {
        // Get latest draft
        query = query
          .in('status', ['draft', 'analyzing'])
          .order('updated_at', { ascending: false })
          .limit(1)
      }

      const { data, error } = await query

      if (error) {
        // Only log real errors (not empty error objects)
        const isEmptyObject = error && typeof error === 'object' && Object.keys(error).length === 0
        const code = error?.code
        const msg = error?.message

        // Skip logging if it's an empty error object
        const shouldLog = !isEmptyObject && (code || msg)

        if (shouldLog) {
          console.error('Database load error:', error)
          return {
            success: false,
            error: `Database load failed: ${error.message}`,
            code: error.code
          }
        }
        // If it's an empty error object, continue to data check below
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'No draft found'
        }
      }

      const cvData = this.mapTableRowToCVData(data[0] as CVWorkflowTable)
      
      // Update cache
      this.updateCache(cvData.id, cvData)

      return {
        success: true,
        data: cvData
      }

    } catch (error) {
      console.error('Load draft error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Load draft failed'
      }
    }
  }

  /**
   * Update CV status
   * @param cvId - CV ID
   * @param status - New status
   * @param step - Optional workflow step
   * @returns Promise<DatabaseResult<boolean>>
   */
  public async updateStatus(
    cvId: string,
    status: WorkflowStatus,
    step?: WorkflowStep
  ): Promise<DatabaseResult<boolean>> {
    try {
      if (!CVWorkflowDataService.isValidUuid(cvId)) {
        return { success: true, data: true }
      }
      const client = await databaseService.getClient()
      if (!client) {
        return {
          success: false,
          error: 'Database not available'
        }
      }

      const updateData: Partial<CVWorkflowTable> = {
        status,
        updated_at: new Date().toISOString()
      }

      if (step) {
        updateData.workflow_current_step = step
        updateData.workflow_last_active_step = step
      }

      const { error } = await client
        .from('cv_workflow')
        .update(updateData)
        .eq('id', cvId)

      if (error) {
        console.error('Status update error:', error)
        return {
          success: false,
          error: `Status update failed: ${error.message}`,
          code: error.code
        }
      }

      // Invalidate cache
      this.invalidateCache(cvId)

      return { success: true, data: true }

    } catch (error) {
      console.error('Update status error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update status failed'
      }
    }
  }

  /**
   * Get all CVs for a user
   * @param userId - User ID
   * @returns Promise<DatabaseResult<WorkflowCVData[]>>
   */
  public async getUserCVs(userId: string): Promise<DatabaseResult<WorkflowCVData[]>> {
    try {
      const client = await databaseService.getClient()
      if (!client) {
        // No database client available
        return {
          success: true,
          data: []
        }
      }

      const { data, error } = await client
        .from('cv_workflow')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Get user CVs error:', error)
        return {
          success: false,
          error: `Failed to get user CVs: ${error.message}`,
          code: error.code
        }
      }

      const cvs = (data as CVWorkflowTable[]).map(row => this.mapTableRowToCVData(row))

      return {
        success: true,
        data: cvs
      }

    } catch (error) {
      console.error('Get user CVs error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user CVs'
      }
    }
  }

  /**
   * Delete CV
   * @param cvId - CV ID
   * @param userId - User ID for security
   * @returns Promise<DatabaseResult<boolean>>
   */
  public async deleteCV(cvId: string, userId: string): Promise<DatabaseResult<boolean>> {
    try {
      if (!CVWorkflowDataService.isValidUuid(cvId)) {
        this.invalidateCache(cvId)
        return { success: true, data: true }
      }
      const client = await databaseService.getClient()
      if (!client) {
        return { success: false, error: 'Database not available' }
      }

      const { error } = await client
        .from('cv_workflow')
        .delete()
        .eq('id', cvId)
        .eq('user_id', userId) // Security check

      if (error) {
        console.error('Delete CV error:', error)
        return {
          success: false,
          error: `Delete failed: ${error.message}`,
          code: error.code
        }
      }

      // Remove from cache
      this.invalidateCache(cvId)

      return { success: true, data: true }

    } catch (error) {
      console.error('Delete CV error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete CV failed'
      }
    }
  }

  /**
   * Create backup of CV data
   * @param cvId - CV ID
   * @returns Promise<DatabaseResult<any>>
   */
  public async createBackup(cvId: string): Promise<DatabaseResult<any>> {
    try {
      let cvData: WorkflowCVData | null = null
      if (CVWorkflowDataService.isValidUuid(cvId)) {
        const loadResult = await this.loadDraft('', cvId)
        if (loadResult.success && loadResult.data) cvData = loadResult.data
      } else {
        const cached = this.cache.get(cvId)
        if (cached) cvData = cached
      }
      if (!cvData) {
        return {
          success: false,
          error: 'Failed to load CV for backup'
        }
      }

      const backup = {
        id: cvId,
        timestamp: new Date().toISOString(),
        data: cvData,
        version: cvData.metadata?.version ?? 0
      }

      // Store backup (could be localStorage, database, or external storage)
      const backupKey = `backup_${cvId}_${Date.now()}`
      localStorage.setItem(backupKey, JSON.stringify(backup))

      return {
        success: true,
        data: backup
      }

    } catch (error) {
      console.error('Create backup error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Create backup failed'
      }
    }
  }

  /**
   * Save JD analysis results
   * @param cvId - CV ID
   * @param analysisResults - Analysis results from JD analysis API
   * @returns Promise<DatabaseResult<any>>
   */
  public async saveJDAnalysis(cvId: string, analysisResults: any): Promise<DatabaseResult<any>> {
    try {
      const storagePayload = {
        analysisResults,
        timestamp: new Date().toISOString()
      }
      const storageKey = `okbuddy_jd_analysis_${cvId}`

      if (!CVWorkflowDataService.isValidUuid(cvId)) {
        localStorage.setItem(storageKey, JSON.stringify(storagePayload))
        const cachedCV = this.cache.get(cvId)
        if (cachedCV) {
          cachedCV.analysisResults = analysisResults
          if (analysisResults.jobMatch) {
            cachedCV.jobDescription = {
              text: analysisResults.originalJobDescription || '',
              keywords: analysisResults.jobMatch.missingKeywords || [],
              url: ''
            }
          }
          this.updateCache(cvId, cachedCV)
        }
        return { success: true, data: analysisResults }
      }

      const client = await databaseService.getClient()
      if (!client) {
        localStorage.setItem(storageKey, JSON.stringify(storagePayload))
        return { success: true, data: analysisResults }
      }

      // Update the CV record with analysis results
      const { data, error } = await client
        .from('cv_workflow')
        .update({
          analysis_results: analysisResults,
          job_description_text: analysisResults.originalJobDescription || null,
          job_description_keywords: analysisResults.jobMatch?.missingKeywords || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', cvId)
        .select()

      if (error) {
        console.error('Save JD analysis error:', error)
        // Fallback to localStorage
        const storageKey = `okbuddy_jd_analysis_${cvId}`
        localStorage.setItem(storageKey, JSON.stringify({
          analysisResults,
          timestamp: new Date().toISOString()
        }))
        return { success: true, data: analysisResults }
      }

      // Update cache if CV is cached
      const cachedCV = this.cache.get(cvId)
      if (cachedCV) {
        cachedCV.analysisResults = analysisResults
        if (analysisResults.jobMatch) {
          cachedCV.jobDescription = {
            text: analysisResults.originalJobDescription || '',
            keywords: analysisResults.jobMatch.missingKeywords || [],
            url: ''
          }
        }
        this.updateCache(cvId, cachedCV)
      }

      return { success: true, data: analysisResults }

    } catch (error) {
      console.error('Save JD analysis error:', error)
      // Fallback to localStorage
      try {
        const storageKey = `okbuddy_jd_analysis_${cvId}`
        localStorage.setItem(storageKey, JSON.stringify({
          analysisResults,
          timestamp: new Date().toISOString()
        }))
        return { success: true, data: analysisResults }
      } catch (storageError) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Save JD analysis failed'
        }
      }
    }
  }

  /**
   * Load JD analysis results
   * @param cvId - CV ID
   * @returns Promise<DatabaseResult<any>>
   */
  public async loadJDAnalysis(cvId: string): Promise<DatabaseResult<any>> {
    try {
      if (!CVWorkflowDataService.isValidUuid(cvId)) {
        const storageKey = `okbuddy_jd_analysis_${cvId}`
        try {
          const stored = localStorage.getItem(storageKey)
          if (stored) {
            const { analysisResults } = JSON.parse(stored)
            return { success: true, data: analysisResults }
          }
        } catch {
          // ignore parse errors
        }
        return { success: false, error: 'No JD analysis found' }
      }

      const client = await databaseService.getClient()
      if (!client) {
        // Use localStorage fallback when DB not available
        const storageKey = `okbuddy_jd_analysis_${cvId}`
        const savedData = localStorage.getItem(storageKey)
        if (savedData) {
          const parsed = JSON.parse(savedData)
          return { success: true, data: parsed.analysisResults }
        }
        return { success: false, error: 'No analysis found' }
      }

      // Use maybeSingle() so missing row returns data: null without an error (avoids PGRST116 / empty DB noise)
      const { data, error } = await client
        .from('cv_workflow')
        .select('analysis_results, job_description_text, job_description_keywords')
        .eq('id', cvId)
        .maybeSingle()

      if (error) {
        // Only log real errors (not "no rows" which maybeSingle avoids; guard against empty error object)
        const isEmptyObject = error && typeof error === 'object' && Object.keys(error).length === 0
        const code = error?.code
        const msg = error?.message

        // Skip logging if: empty object, or PGRST116 (no rows found)
        const shouldLog = !isEmptyObject && code && code !== 'PGRST116'

        if (shouldLog) {
          console.error('Load JD analysis error:', error)
        }
        // Fallback to localStorage
        const storageKey = `okbuddy_jd_analysis_${cvId}`
        const savedData = localStorage.getItem(storageKey)
        if (savedData) {
          const parsed = JSON.parse(savedData)
          return { success: true, data: parsed.analysisResults }
        }
        return { success: false, error: 'No analysis found' }
      }

      if (data?.analysis_results) {
        return { success: true, data: data.analysis_results }
      }

      // No row or row has no analysis_results (e.g. empty DB) — try localStorage, then "no analysis"
      const storageKey = `okbuddy_jd_analysis_${cvId}`
      const savedData = localStorage.getItem(storageKey)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        return { success: true, data: parsed.analysisResults }
      }
      return { success: false, error: 'No analysis found' }

    } catch (error) {
      // Only log meaningful errors (not empty objects)
      const isEmptyObject = error && typeof error === 'object' && Object.keys(error).length === 0
      if (!isEmptyObject) {
        console.error('Load JD analysis error:', error)
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Load JD analysis failed'
      }
    }
  }

  // ===== PRIVATE METHODS =====

  /**
   * Validate CV data structure and content
   */
  private validateCVData(cvData: WorkflowCVData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields validation
    if (!cvData.id) errors.push('CV ID is required')
    if (!cvData.userId) errors.push('User ID is required')
    if (!cvData.title) errors.push('CV title is required')
    if (!cvData.status) errors.push('CV status is required')

    // Contact information validation
    if (!cvData.contact?.fullName) errors.push('Full name is required')
    if (!cvData.contact?.email) errors.push('Email is required')
    if (!cvData.contact?.phone) errors.push('Phone is required')
    if (!cvData.contact?.location) errors.push('Location is required')

    // Email format validation
    if (cvData.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cvData.contact.email)) {
      errors.push('Invalid email format')
    }

    // Score validation
    if (cvData.score < 0 || cvData.score > 100) {
      errors.push('Score must be between 0 and 100')
    }

    // Status validation
    const validStatuses: WorkflowStatus[] = ['draft', 'analyzing', 'completed']
    if (!validStatuses.includes(cvData.status)) {
      errors.push('Invalid status')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Map CV data to database table row
   */
  private mapCVDataToTableRow(cvData: WorkflowCVData): Partial<CVWorkflowTable> {
    // Compress large text content before storing
    const { data: compressedData, compressionMap } = compressCVData(cvData)
    
    // Store compression map in metadata for decompression
    const cvDataWithCompression = {
      ...compressedData,
      metadata: {
        ...compressedData.metadata,
        compressionMap
      }
    }

    return {
      id: cvData.id,
      user_id: cvData.userId,
      title: cvData.title,
      status: cvData.status,
      score: cvData.score,
      cv_data: cvDataWithCompression as any, // Store compressed CV data as JSON
      uploaded_file_url: cvData.uploadedFile?.url,
      uploaded_file_name: cvData.uploadedFile?.name,
      uploaded_file_size: cvData.uploadedFile?.size,
      uploaded_file_type: cvData.uploadedFile?.type,
      uploaded_file_text: compressedData.uploadedFile?.originalText,
      job_description_text: compressedData.jobDescription?.text,
      job_description_url: cvData.jobDescription?.url,
      job_description_keywords: cvData.jobDescription?.keywords,
      analysis_results: cvData.analysisResults as any,
      workflow_current_step: cvData.workflow.currentStep,
      workflow_steps_completed: cvData.workflow.stepsCompleted,
      workflow_last_active_step: cvData.workflow.lastActiveStep,
      workflow_time_spent: cvData.workflow.timeSpent,
      auto_save_enabled: cvData.settings.autoSave,
      ai_assistance_enabled: cvData.settings.aiAssistance,
      template_name: cvData.settings.template,
      language: cvData.settings.language,
      version: cvData.metadata.version,
      source: cvData.metadata.source,
      created_at: cvData.metadata.createdAt,
      updated_at: cvData.metadata.updatedAt,
      last_saved_at: cvData.metadata.lastSavedAt
    }
  }

  /**
   * Map database table row to CV data
   */
  private mapTableRowToCVData(row: CVWorkflowTable): WorkflowCVData {
    const cvData = row.cv_data as WorkflowCVData
    
    // Extract compression map from metadata
    const compressionMap = (cvData.metadata as any)?.compressionMap || {}
    
    // Decompress the CV data
    const decompressedData = decompressCVData(cvData, compressionMap)

    // Ensure all required fields are present
    return {
      ...decompressedData,
      id: row.id,
      userId: row.user_id,
      title: row.title,
      status: row.status,
      score: row.score,
      uploadedFile: row.uploaded_file_url ? {
        name: row.uploaded_file_name || '',
        size: row.uploaded_file_size || 0,
        type: row.uploaded_file_type || '',
        url: row.uploaded_file_url,
        originalText: row.uploaded_file_text
      } : undefined,
      jobDescription: row.job_description_text || row.job_description_url ? {
        text: row.job_description_text,
        url: row.job_description_url,
        keywords: row.job_description_keywords
      } : undefined,
      analysisResults: row.analysis_results as any,
      workflow: {
        currentStep: row.workflow_current_step as WorkflowStep,
        stepsCompleted: row.workflow_steps_completed,
        lastActiveStep: row.workflow_last_active_step,
        timeSpent: row.workflow_time_spent
      },
      metadata: {
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastSavedAt: row.last_saved_at,
        version: row.version,
        source: row.source as CVSource
      },
      settings: {
        autoSave: row.auto_save_enabled,
        aiAssistance: row.ai_assistance_enabled,
        template: row.template_name,
        language: row.language as SupportedLanguage
      }
    }
  }

  /**
   * Cache management methods
   */
  private updateCache(cvId: string, cvData: WorkflowCVData): void {
    this.cache.set(cvId, cvData)
    this.cacheExpiry.set(cvId, Date.now() + environmentConfig.performance.dataCacheTTL)
  }

  private isCacheValid(cvId: string): boolean {
    const expiry = this.cacheExpiry.get(cvId)
    return expiry ? Date.now() < expiry : false
  }

  private invalidateCache(cvId: string): void {
    this.cache.delete(cvId)
    this.cacheExpiry.delete(cvId)
  }

  // Mock methods completely removed - using real database only
}

/**
 * Export singleton instance
 */
export const cvWorkflowDataService = CVWorkflowDataService.getInstance() 