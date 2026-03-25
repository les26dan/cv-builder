/**
 * ===================================================================
 * LOCAL CV STORAGE SERVICE - MISSION CRITICAL
 * ===================================================================
 * 
 * CRITICAL REQUIREMENTS FOR AI MONETIZATION SYSTEM:
 * 1. CV progress persists across browser sessions (close/reopen)
 * 2. All local data syncs accurately to Supabase upon login
 * 3. Offline editing continues with local backup when disconnected
 * 4. All local changes sync to database when users log back in
 * 
 * This service is the foundation for the AI credit system where:
 * - Unauthenticated users can edit CVs freely (local storage only)
 * - Login is required only for AI features (monetization gate)
 * - Local→DB sync must be bulletproof for user conversion
 * ===================================================================
 */

import { 
  WorkflowCVData, 
  CVData, 
  DatabaseResult,
  WorkflowStatus,
  WorkflowStep,
  CVSource,
  SupportedLanguage
} from '../types/workflow'
import { compressCVData, decompressCVData } from '../../utils/compression'

/**
 * Local storage key constants - centralized for consistency
 */
const STORAGE_KEYS = {
  // Individual CV data
  CV_DATA: (cvId: string) => `okbuddy_cv_${cvId}`,
  CV_WORKFLOW: (cvId: string) => `okbuddy_cv_workflow_${cvId}`,
  CV_UPLOAD: (cvId: string) => `okbuddy_cv_upload_${cvId}`,
  
  // User-specific CV lists
  USER_CVS: (userId: string) => `okbuddy_user_cvs_${userId}`,
  GUEST_CVS: 'okbuddy_guest_cvs',
  
  // Session management
  CURRENT_SESSION: 'okbuddy_current_session',
  GUEST_SESSION: 'okbuddy_guest_session',
  
  // Sync tracking
  PENDING_SYNC: 'okbuddy_pending_sync',
  LAST_SYNC: 'okbuddy_last_sync',
  
  // Migration tracking
  MIGRATION_STATUS: 'okbuddy_migration_status',
  MIGRATION_BACKUP: 'okbuddy_migration_backup'
} as const

/**
 * Local CV session interface
 */
interface LocalCVSession {
  sessionId: string
  userId?: string // undefined for guest sessions
  isGuest: boolean
  createdAt: string
  lastActiveAt: string
  cvIds: string[]
  totalCVs: number
}

/**
 * Local CV storage entry
 */
interface LocalCVEntry {
  cvId: string
  userId?: string
  sessionId: string
  cvData: WorkflowCVData
  compressed: boolean
  lastModified: string
  syncStatus: 'pending' | 'synced' | 'conflict' | 'failed'
  version: number
  source: 'upload' | 'template' | 'editing'
}

/**
 * Sync operation result
 */
interface SyncResult {
  success: boolean
  syncedCount: number
  conflictCount: number
  failedCount: number
  totalCount: number
  errors?: string[]
  conflicts?: Array<{
    cvId: string
    localData: WorkflowCVData
    remoteData: WorkflowCVData
    resolution?: 'local' | 'remote' | 'manual'
  }>
}

/**
 * Local Storage Service Configuration
 */
interface LocalStorageConfig {
  enableCompression: boolean
  maxStorageSize: number // MB
  cleanupInterval: number // milliseconds
  syncRetryAttempts: number
  syncRetryDelay: number // milliseconds
  enableMetrics: boolean
}

/**
 * ===================================================================
 * LOCAL CV STORAGE SERVICE CLASS
 * ===================================================================
 */
export class LocalCVStorageService {
  private static instance: LocalCVStorageService
  private config: LocalStorageConfig
  private currentSession: LocalCVSession | null = null
  private syncQueue: Map<string, LocalCVEntry> = new Map()
  private cleanupTimer: NodeJS.Timeout | null = null
  
  /**
   * Singleton pattern for consistent service instance
   */
  public static getInstance(config?: Partial<LocalStorageConfig>): LocalCVStorageService {
    if (!LocalCVStorageService.instance) {
      LocalCVStorageService.instance = new LocalCVStorageService(config)
    }
    return LocalCVStorageService.instance
  }

  /**
   * Private constructor
   */
  private constructor(config?: Partial<LocalStorageConfig>) {
    this.config = {
      enableCompression: true,
      maxStorageSize: 50, // 50MB
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      syncRetryAttempts: 3,
      syncRetryDelay: 2000, // 2 seconds
      enableMetrics: true,
      ...config
    }

    this.initializeService()
  }

  /**
   * ===================================================================
   * INITIALIZATION & SESSION MANAGEMENT
   * ===================================================================
   */

  /**
   * Initialize the service and restore session
   */
  private initializeService(): void {
    try {
      // Only initialize in browser environment
      if (typeof window === 'undefined') {
        console.log('🔧 Server-side: LocalCVStorageService initialization skipped')
        return
      }

      // Restore current session if exists
      this.restoreSession()
      
      // Set up cleanup timer
      this.setupCleanupTimer()
      
      // Restore sync queue
      this.restoreSyncQueue()
      
      console.log('✅ LocalCVStorageService initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize LocalCVStorageService:', error)
    }
  }

  /**
   * Start or continue a session (guest or authenticated)
   */
  public startSession(userId?: string): LocalCVSession {
    try {
      // Only work in browser environment
      if (typeof window === 'undefined') {
        throw new Error('LocalCVStorageService requires browser environment')
      }

      const isGuest = !userId
      const sessionId = isGuest 
        ? `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        : `user-${userId}-${Date.now()}`

      const session: LocalCVSession = {
        sessionId,
        userId,
        isGuest,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        cvIds: [],
        totalCVs: 0
      }

      // Load existing CVs for this user/guest
      const existingCVs = this.getUserCVList(userId)
      session.cvIds = existingCVs.map(cv => cv.id)
      session.totalCVs = existingCVs.length

      this.currentSession = session
      this.saveSession()

      console.log(`✅ Session started: ${isGuest ? 'Guest' : 'User'} session (${session.totalCVs} existing CVs)`)
      return session
    } catch (error) {
      console.error('❌ Failed to start session:', error)
      throw error
    }
  }

  /**
   * ===================================================================
   * CV DATA OPERATIONS
   * ===================================================================
   */

  /**
   * Save CV data to local storage
   * CRITICAL: This must work reliably for the AI monetization system
   */
  public async saveCVData(cvData: WorkflowCVData, source: 'upload' | 'template' | 'editing' = 'editing'): Promise<DatabaseResult<WorkflowCVData>> {
    try {
      // Only work in browser environment
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'LocalStorage not available in server environment'
        }
      }

      console.log(`💾 Saving CV data to localStorage: ${cvData.id} (source: ${source})`)
      
      // Ensure session exists
      if (!this.currentSession) {
        this.startSession(cvData.userId === 'guest' ? undefined : cvData.userId)
      }

      // Update metadata
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

      // Create local entry
      const localEntry: LocalCVEntry = {
        cvId: cvData.id,
        userId: cvData.userId === 'guest' ? undefined : cvData.userId,
        sessionId: this.currentSession!.sessionId,
        cvData: updatedCVData,
        compressed: this.config.enableCompression,
        lastModified: now,
        syncStatus: 'pending',
        version: updatedCVData.metadata.version,
        source
      }

      // Compress data if enabled
      let dataToStore = updatedCVData
      if (this.config.enableCompression) {
        const compressedData = compressCVData(updatedCVData)
        // Ensure the compressed data maintains the WorkflowCVData structure
        dataToStore = {
          ...updatedCVData,
          ...compressedData
        } as WorkflowCVData
        localEntry.compressed = true
      }

      // Save to multiple localStorage keys for redundancy
      this.saveToMultipleKeys(cvData.id, {
        ...localEntry,
        cvData: dataToStore
      })

      // Update user CV list
      this.updateUserCVList(cvData.userId, updatedCVData)

      // Add to sync queue
      this.syncQueue.set(cvData.id, localEntry)

      // Update session
      this.updateSession(cvData.id)

      console.log(`✅ CV data saved successfully: ${cvData.id}`)
      
      return {
        success: true,
        data: updatedCVData
      }

    } catch (error) {
      console.error('❌ Failed to save CV data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save CV data to localStorage'
      }
    }
  }

  /**
   * Load CV data from local storage
   */
  public async loadCVData(cvId: string, userId?: string): Promise<DatabaseResult<WorkflowCVData>> {
    try {
      // Only work in browser environment
      if (typeof window === 'undefined') {
        return {
          success: false,
          error: 'LocalStorage not available in server environment'
        }
      }

      console.log(`🔍 Loading CV data from localStorage: ${cvId}`)

      // Try to load from multiple storage keys
      const localEntry = this.loadFromMultipleKeys(cvId, userId)
      
      if (!localEntry) {
        return {
          success: false,
          error: `CV not found in localStorage: ${cvId}`
        }
      }

      // Decompress if needed
      let cvData = localEntry.cvData
      if (localEntry.compressed) {
        // Extract compression map if it exists
        const compressionMap = (cvData.metadata as any)?.compressionMap || {}
        cvData = decompressCVData(cvData, compressionMap)
      }

      console.log(`✅ CV data loaded successfully: ${cvId}`)
      
      return {
        success: true,
        data: cvData
      }

    } catch (error) {
      console.error('❌ Failed to load CV data:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load CV data from localStorage'
      }
    }
  }

  /**
   * Get all CVs for a user (guest or authenticated)
   */
  public getUserCVList(userId?: string): WorkflowCVData[] {
    try {
      // Only work in browser environment
      if (typeof window === 'undefined') {
        return []
      }

      const storageKey = userId ? STORAGE_KEYS.USER_CVS(userId) : STORAGE_KEYS.GUEST_CVS
      const storedList = localStorage.getItem(storageKey)
      
      if (!storedList) {
        return []
      }

      const cvList = JSON.parse(storedList) as WorkflowCVData[]
      console.log(`📋 Found ${cvList.length} CVs for ${userId ? 'user' : 'guest'}`)
      
      return cvList
    } catch (error) {
      console.error('❌ Failed to get user CV list:', error)
      return []
    }
  }

  /**
   * ===================================================================
   * LOGIN SYNC OPERATIONS - CRITICAL FOR AI MONETIZATION
   * ===================================================================
   */

  /**
   * Sync all local CV data to Supabase when user logs in
   * CRITICAL: This is the foundation for the AI credit system
   */
  public async syncLocalDataToDatabase(userId: string, databaseService: any): Promise<SyncResult> {
    console.log(`🔄 Starting critical sync operation for user: ${userId}`)
    
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      conflictCount: 0,
      failedCount: 0,
      totalCount: 0,
      errors: [],
      conflicts: []
    }

    try {
      // Only work in browser environment
      if (typeof window === 'undefined') {
        result.success = false
        result.errors!.push('Sync not available in server environment')
        return result
      }

      // Get all local CVs (guest and any existing user data)
      const localCVs = this.getAllLocalCVs()
      result.totalCount = localCVs.length

      console.log(`📊 Found ${localCVs.length} local CVs to sync`)

      if (localCVs.length === 0) {
        console.log('✅ No local CVs to sync')
        return result
      }

      // Create backup before sync
      this.createSyncBackup(localCVs)

      // Process each CV
      for (const localEntry of localCVs) {
        try {
          console.log(`🔄 Syncing CV: ${localEntry.cvId}`)
          
          // Update userId for guest CVs
          const updatedCVData: WorkflowCVData = {
            ...localEntry.cvData,
            userId: userId,
            metadata: {
              ...localEntry.cvData.metadata,
              updatedAt: new Date().toISOString()
            }
          }

          // Check for conflicts with existing database records
          const existingCV = await databaseService.loadDraft(userId, localEntry.cvId)
          
          if (existingCV.success && existingCV.data) {
            // Conflict detected
            console.log(`⚠️ Conflict detected for CV: ${localEntry.cvId}`)
            result.conflicts!.push({
              cvId: localEntry.cvId,
              localData: updatedCVData,
              remoteData: existingCV.data,
              resolution: 'local' // Default to local data (user's work)
            })
            result.conflictCount++
          } else {
            // No conflict, proceed with sync
            const syncResult = await databaseService.saveDraft(updatedCVData)
            
            if (syncResult.success) {
              // Mark as synced
              localEntry.syncStatus = 'synced'
              this.updateLocalEntry(localEntry)
              result.syncedCount++
              console.log(`✅ CV synced successfully: ${localEntry.cvId}`)
            } else {
              // Sync failed
              localEntry.syncStatus = 'failed'
              this.updateLocalEntry(localEntry)
              result.failedCount++
              result.errors!.push(`Failed to sync ${localEntry.cvId}: ${syncResult.error}`)
              console.error(`❌ Failed to sync CV: ${localEntry.cvId}`, syncResult.error)
            }
          }

        } catch (error) {
          result.failedCount++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.errors!.push(`Error syncing ${localEntry.cvId}: ${errorMessage}`)
          console.error(`❌ Error syncing CV: ${localEntry.cvId}`, error)
        }
      }

      // Update user's CV list with new user ID
      this.migrateGuestCVsToUser(userId)

      // Mark migration as complete
      this.markMigrationComplete(userId)

      result.success = result.failedCount === 0 && result.conflictCount === 0

      console.log(`🎉 Sync operation completed:`, {
        success: result.success,
        synced: result.syncedCount,
        conflicts: result.conflictCount,
        failed: result.failedCount,
        total: result.totalCount
      })

      return result

    } catch (error) {
      result.success = false
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'
      result.errors!.push(errorMessage)
      
      console.error('❌ Critical sync operation failed:', error)
      return result
    }
  }

  /**
   * ===================================================================
   * PRIVATE HELPER METHODS
   * ===================================================================
   */

  /**
   * Save to multiple localStorage keys for redundancy
   */
  private saveToMultipleKeys(cvId: string, localEntry: LocalCVEntry): void {
    try {
      const serialized = JSON.stringify(localEntry)
      
      // Primary keys
      localStorage.setItem(STORAGE_KEYS.CV_WORKFLOW(cvId), serialized)
      localStorage.setItem(STORAGE_KEYS.CV_DATA(cvId), JSON.stringify(localEntry.cvData))
      
      // Legacy compatibility keys
      localStorage.setItem(STORAGE_KEYS.CV_UPLOAD(cvId), serialized)
      
    } catch (error) {
      console.error('❌ Failed to save to multiple keys:', error)
      throw error
    }
  }

  /**
   * Load from multiple localStorage keys (redundancy)
   */
  private loadFromMultipleKeys(cvId: string, userId?: string): LocalCVEntry | null {
    const keys = [
      STORAGE_KEYS.CV_WORKFLOW(cvId),
      STORAGE_KEYS.CV_UPLOAD(cvId),
      STORAGE_KEYS.CV_DATA(cvId)
    ]

    for (const key of keys) {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const parsed = JSON.parse(stored)
          
          // If it's a LocalCVEntry
          if (parsed.cvId && parsed.cvData) {
            return parsed as LocalCVEntry
          }
          
          // If it's just CVData, wrap it
          if (parsed.id) {
            return {
              cvId: parsed.id,
              userId: userId,
              sessionId: this.currentSession?.sessionId || 'unknown',
              cvData: parsed,
              compressed: false,
              lastModified: parsed.metadata?.updatedAt || new Date().toISOString(),
              syncStatus: 'pending',
              version: parsed.metadata?.version || 1,
              source: 'editing'
            } as LocalCVEntry
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse data from key ${key}:`, error)
        continue
      }
    }

    return null
  }

  /**
   * Update user CV list
   */
  private updateUserCVList(userId?: string, cvData?: WorkflowCVData): void {
    try {
      const storageKey = userId ? STORAGE_KEYS.USER_CVS(userId) : STORAGE_KEYS.GUEST_CVS
      const existingList = this.getUserCVList(userId)
      
      if (cvData) {
        // Update or add CV
        const existingIndex = existingList.findIndex(cv => cv.id === cvData.id)
        if (existingIndex >= 0) {
          existingList[existingIndex] = cvData
        } else {
          existingList.push(cvData)
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(existingList))
    } catch (error) {
      console.error('❌ Failed to update user CV list:', error)
    }
  }

  /**
   * Get all local CVs across all users and sessions
   */
  private getAllLocalCVs(): LocalCVEntry[] {
    const allCVs: LocalCVEntry[] = []

    try {
      // Scan all localStorage keys for CV data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('okbuddy_cv_workflow_') || key.includes('okbuddy_cv_upload_'))) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              if (parsed.cvId && parsed.cvData) {
                allCVs.push(parsed as LocalCVEntry)
              }
            }
          } catch (error) {
            console.warn(`⚠️ Failed to parse CV data from key ${key}:`, error)
          }
        }
      }

      // Deduplicate by cvId
      const uniqueCVs = allCVs.reduce((acc, current) => {
        const existing = acc.find(cv => cv.cvId === current.cvId)
        if (!existing || current.version > existing.version) {
          // Use the latest version
          acc = acc.filter(cv => cv.cvId !== current.cvId)
          acc.push(current)
        }
        return acc
      }, [] as LocalCVEntry[])

      return uniqueCVs
    } catch (error) {
      console.error('❌ Failed to get all local CVs:', error)
      return []
    }
  }

  /**
   * Create backup before sync operation
   */
  private createSyncBackup(localCVs: LocalCVEntry[]): void {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        totalCVs: localCVs.length,
        cvs: localCVs
      }
      
      localStorage.setItem(STORAGE_KEYS.MIGRATION_BACKUP, JSON.stringify(backup))
      console.log(`✅ Sync backup created: ${localCVs.length} CVs`)
    } catch (error) {
      console.error('❌ Failed to create sync backup:', error)
    }
  }

  /**
   * Migrate guest CVs to authenticated user
   */
  private migrateGuestCVsToUser(userId: string): void {
    try {
      const guestCVs = this.getUserCVList() // Get guest CVs
      const userCVs = this.getUserCVList(userId) // Get existing user CVs
      
      // Merge and deduplicate
      const mergedCVs = [...userCVs]
      
      for (const guestCV of guestCVs) {
        const exists = mergedCVs.find(cv => cv.id === guestCV.id)
        if (!exists) {
          // Update userId
          const updatedCV = { ...guestCV, userId }
          mergedCVs.push(updatedCV)
        }
      }

      // Save merged list
      localStorage.setItem(STORAGE_KEYS.USER_CVS(userId), JSON.stringify(mergedCVs))
      
      // Clear guest list
      localStorage.removeItem(STORAGE_KEYS.GUEST_CVS)
      
      console.log(`✅ Migrated ${guestCVs.length} guest CVs to user ${userId}`)
    } catch (error) {
      console.error('❌ Failed to migrate guest CVs:', error)
    }
  }

  /**
   * Session management methods
   */
  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)
      if (stored) {
        this.currentSession = JSON.parse(stored) as LocalCVSession
        console.log(`✅ Session restored: ${this.currentSession.isGuest ? 'Guest' : 'User'}`)
      }
    } catch (error) {
      console.warn('⚠️ Failed to restore session:', error)
    }
  }

  private saveSession(): void {
    if (this.currentSession) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(this.currentSession))
    }
  }

  private updateSession(cvId: string): void {
    if (this.currentSession) {
      this.currentSession.lastActiveAt = new Date().toISOString()
      if (!this.currentSession.cvIds.includes(cvId)) {
        this.currentSession.cvIds.push(cvId)
        this.currentSession.totalCVs = this.currentSession.cvIds.length
      }
      this.saveSession()
    }
  }

  private restoreSyncQueue(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC)
      if (stored) {
        const entries = JSON.parse(stored) as LocalCVEntry[]
        entries.forEach(entry => {
          this.syncQueue.set(entry.cvId, entry)
        })
        console.log(`✅ Restored ${entries.length} items to sync queue`)
      }
    } catch (error) {
      console.warn('⚠️ Failed to restore sync queue:', error)
    }
  }

  private updateLocalEntry(entry: LocalCVEntry): void {
    this.saveToMultipleKeys(entry.cvId, entry)
    this.syncQueue.set(entry.cvId, entry)
  }

  private markMigrationComplete(userId: string): void {
    const migrationStatus = {
      userId,
      completedAt: new Date().toISOString(),
      success: true
    }
    localStorage.setItem(STORAGE_KEYS.MIGRATION_STATUS, JSON.stringify(migrationStatus))
  }

  private setupCleanupTimer(): void {
    if (typeof window === 'undefined') return

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    
    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)
  }

  private performCleanup(): void {
    // Implement storage cleanup logic
    // Remove expired entries, compress old data, etc.
    console.log('🧹 Performing localStorage cleanup...')
  }

  /**
   * ===================================================================
   * PUBLIC UTILITY METHODS
   * ===================================================================
   */

  /**
   * Check if user has local CV data that needs syncing
   */
  public hasPendingSync(): boolean {
    return this.syncQueue.size > 0
  }

  /**
   * Get sync queue status
   */
  public getSyncStatus(): { pending: number; failed: number; total: number } {
    const entries = Array.from(this.syncQueue.values())
    return {
      pending: entries.filter(e => e.syncStatus === 'pending').length,
      failed: entries.filter(e => e.syncStatus === 'failed').length,
      total: entries.length
    }
  }

  /**
   * Clear all local data (for testing or reset)
   */
  public clearAllLocalData(): void {
    if (typeof window === 'undefined') return

    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('okbuddy_')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    this.currentSession = null
    this.syncQueue.clear()
    
    console.log(`🗑️ Cleared ${keysToRemove.length} localStorage entries`)
  }

  /**
   * Get storage usage statistics
   */
  public getStorageStats(): { used: number; available: number; utilization: number } {
    if (typeof window === 'undefined') {
      return { used: 0, available: 0, utilization: 0 }
    }

    let used = 0
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('okbuddy_')) {
        const value = localStorage.getItem(key)
        if (value) {
          used += new Blob([value]).size
        }
      }
    }

    const usedMB = used / (1024 * 1024)
    const availableMB = this.config.maxStorageSize
    const utilization = (usedMB / availableMB) * 100

    return {
      used: usedMB,
      available: availableMB,
      utilization
    }
  }
}

/**
 * ===================================================================
 * EXPORT SINGLETON INSTANCE
 * ===================================================================
 */
export const localCVStorageService = LocalCVStorageService.getInstance({
  enableCompression: true,
  maxStorageSize: 50, // 50MB
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  syncRetryAttempts: 3,
  syncRetryDelay: 2000,
  enableMetrics: true
})

export default localCVStorageService
