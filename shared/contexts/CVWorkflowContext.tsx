import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react'
import { CVWorkflowDataService } from '../services/cvWorkflowDataService'
import { WorkflowCVData } from '../types/workflow'

// Action types for state management
type CVWorkflowAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CV_DATA'; payload: WorkflowCVData }
  | { type: 'UPDATE_CV_DATA'; payload: Partial<WorkflowCVData> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: string }
  | { type: 'CLEAR_CV_DATA' }
  | { type: 'SET_SYNC_STATUS'; payload: 'synced' | 'syncing' | 'error' | 'offline' }

// State interface
interface CVWorkflowState {
  cvData: WorkflowCVData | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSaved: string | null
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline'
}

// Context interface
interface CVWorkflowContextType {
  // State
  state: CVWorkflowState
  
  // Actions
  loadCVData: (cvId: string) => Promise<void>
  saveCVData: (data: Partial<WorkflowCVData>) => Promise<void>
  updateCVData: (updates: Partial<WorkflowCVData>) => void
  clearCVData: () => void
  
  // Utility functions
  isDataValid: () => boolean
  hasUnsavedChanges: () => boolean
  forceSave: () => Promise<void>
  refreshData: () => Promise<void>
}

// Initial state
const initialState: CVWorkflowState = {
  cvData: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: null,
  syncStatus: 'synced'
}

// Reducer function
function cvWorkflowReducer(state: CVWorkflowState, action: CVWorkflowAction): CVWorkflowState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_CV_DATA':
      return {
        ...state,
        cvData: action.payload,
        isLoading: false,
        error: null,
        syncStatus: 'synced'
      }
    
    case 'UPDATE_CV_DATA':
      return {
        ...state,
        cvData: state.cvData ? { ...state.cvData, ...action.payload } : null,
        syncStatus: 'syncing'
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isSaving: false,
        syncStatus: action.payload ? 'error' : 'synced'
      }
    
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }
    
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload }
    
    case 'CLEAR_CV_DATA':
      return {
        ...initialState,
        syncStatus: 'synced'
      }
    
    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload }
    
    default:
      return state
  }
}

// Create context
const CVWorkflowContext = createContext<CVWorkflowContextType | undefined>(undefined)

// Provider component props
interface CVWorkflowProviderProps {
  children: ReactNode
  userId?: string
  cvId?: string // Specific CV to load
  autoSaveInterval?: number
  offlineSupport?: boolean
}

// Provider component
export function CVWorkflowProvider({ 
  children, 
  userId = 'mock-user-1',
  cvId,
  autoSaveInterval = 2000,
  offlineSupport = true
}: CVWorkflowProviderProps) {
  const [state, dispatch] = useReducer(cvWorkflowReducer, initialState)
  const dataService = CVWorkflowDataService.getInstance()
  
  // Auto-save timer reference
  const autoSaveTimer = React.useRef<NodeJS.Timeout | null>(null)
  const lastSavedData = React.useRef<WorkflowCVData | null>(null)
  const retryCount = React.useRef<number>(0)

  // Retry helper with exponential backoff
  const retryWithBackoff = async (
    operation: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<any> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
        
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries + 1} in ${Math.round(delay)}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Check if data has unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    if (!state.cvData || !lastSavedData.current) return false
    return JSON.stringify(state.cvData) !== JSON.stringify(lastSavedData.current)
  }, [state.cvData])

  // Validate CV data
  const isDataValid = useCallback((): boolean => {
    if (!state.cvData) return false
    
    // Basic validation - check required fields
    return !!(
      state.cvData.userId &&
      state.cvData.id &&
      state.cvData.contact?.fullName
    )
  }, [state.cvData])

  // Load CV data from service
  const loadCVData = useCallback(async (cvId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // For template CVs, skip database and load from localStorage directly
      if (cvId.startsWith('template-')) {
        console.log('🎯 CVWorkflowProvider: Template CV detected, loading from localStorage:', cvId)

        // FIRST: check for previously-saved edits at cv_workflow_{cvId}.
        // Without this, every F5 reloads the original upload snapshot and discards user edits.
        try {
          const savedEdits = localStorage.getItem(`cv_workflow_${cvId}`)
          if (savedEdits) {
            const parsedEdits = JSON.parse(savedEdits) as WorkflowCVData
            console.log('💾 CVWorkflowProvider: Restoring saved template edits from cv_workflow_*')
            dispatch({ type: 'SET_CV_DATA', payload: parsedEdits })
            lastSavedData.current = parsedEdits
            dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() })
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' })
            return
          }
        } catch (editsErr) {
          console.warn('CVWorkflowProvider: Failed to parse saved template edits:', editsErr)
        }

        // Try to load template data from upload localStorage
        const uploadData = localStorage.getItem('cv_upload_data') || localStorage.getItem(`cv_upload_${cvId}`)
        
        if (uploadData) {
          const parsed = JSON.parse(uploadData)
          console.log('🎯 CVWorkflowProvider: Found template upload data:', parsed)
          
          if (parsed.cvId === cvId && parsed.structuredCV) {
            // Convert upload data format to workflow data format with all required properties
            const workflowData: WorkflowCVData = {
              // Core identification
              id: cvId,
              userId: userId,
              title: 'Template CV',
              status: 'draft',
              score: 0,
              
              // CV Data structure (spread the parsed data)
              ...parsed.structuredCV,
              
              // Workflow tracking
              workflow: {
                currentStep: 'editing',
                stepsCompleted: ['upload'],
                lastActiveStep: 'editing',
                timeSpent: 0
              },
              
              // Metadata
              metadata: {
                version: 1,
                createdAt: new Date(parsed.timestamp).toISOString(),
                updatedAt: new Date(parsed.timestamp).toISOString(),
                source: 'template'
              },
              
              // Settings with defaults
              settings: {
                autoSave: true,
                aiAssistance: true,
                template: 'default',
                language: 'en'
              }
            }
            
            console.log('🎯 CVWorkflowProvider: Template CV loaded successfully from localStorage')
            dispatch({ type: 'SET_CV_DATA', payload: workflowData })
            lastSavedData.current = workflowData
            dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() })
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' }) // Mark as offline since not in DB yet
            return
          }
        }
        
        console.warn('🎯 CVWorkflowProvider: Template CV data not found in localStorage')
        dispatch({ type: 'SET_ERROR', payload: 'Template CV data not found' })
        return
      }
      
      // For regular CVs, load from database first, fallback to localStorage upload data
      const result = await dataService.loadDraft(userId, cvId)

      if (result.success && result.data) {
        dispatch({ type: 'SET_CV_DATA', payload: result.data })
        lastSavedData.current = result.data
        dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() })
      } else {
        // DB failed or no record — try localStorage upload data (just uploaded CV)
        const uploadRaw = typeof window !== 'undefined'
          ? (localStorage.getItem(`cv_upload_${cvId}`) || localStorage.getItem('cv_upload_data'))
          : null

        if (uploadRaw) {
          try {
            const parsed = JSON.parse(uploadRaw)
            const structuredCV = parsed.structuredCV

            if (structuredCV && (parsed.cvId === cvId || !parsed.cvId)) {
              const workflowData: WorkflowCVData = {
                id: cvId,
                userId,
                title: parsed.file?.name?.replace(/\.[^/.]+$/, '') || 'CV mới',
                status: 'draft',
                score: Math.round(parsed.llmParsedData?.possibility_score || 0),
                ...structuredCV,
                workflow: {
                  currentStep: 'editing',
                  stepsCompleted: ['upload'],
                  lastActiveStep: 'editing',
                  timeSpent: 0
                },
                metadata: {
                  version: 1,
                  createdAt: new Date(parsed.timestamp || Date.now()).toISOString(),
                  updatedAt: new Date(parsed.timestamp || Date.now()).toISOString(),
                  source: 'upload'
                },
                settings: {
                  autoSave: true,
                  aiAssistance: true,
                  template: 'default',
                  language: 'vi'
                }
              }
              console.log('📦 CVWorkflowContext: Loaded from localStorage upload data for cvId:', cvId)
              dispatch({ type: 'SET_CV_DATA', payload: workflowData })
              lastSavedData.current = workflowData
              dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() })
              dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' })
              return
            }
          } catch (parseErr) {
            console.warn('CVWorkflowContext: Failed to parse localStorage upload data:', parseErr)
          }
        }

        dispatch({ type: 'SET_ERROR', payload: result.error || 'CV not found' })
      }
    } catch (error) {
      console.error('Error loading CV data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load CV data' })
      
      // Try to load from localStorage as fallback
      if (offlineSupport) {
        try {
          const cachedData = localStorage.getItem(`cv_workflow_${cvId}`)
          if (cachedData) {
            const parsedData = JSON.parse(cachedData)
            dispatch({ type: 'SET_CV_DATA', payload: parsedData })
            dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' })
          }
        } catch (cacheError) {
          console.error('Error loading from cache:', cacheError)
        }
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [userId, dataService, offlineSupport])

  // Save CV data to service
  const saveCVData = useCallback(async (data: Partial<WorkflowCVData>): Promise<void> => {
    if (!state.cvData) {
      return
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      const updatedData = { 
        ...state.cvData, 
        ...data, 
        metadata: {
          ...state.cvData.metadata,
          updatedAt: new Date().toISOString()
        }
      }
      
      const result = await retryWithBackoff(() => dataService.saveDraft(updatedData))
      
      if (result.success && result.data) {
        // Check for version conflicts
        if (result.data.metadata.version > updatedData.metadata.version + 1) {
          console.warn('🚨 Version conflict detected - data may have been updated by another session')
          dispatch({ type: 'SET_ERROR', payload: 'Version conflict: Data updated in another session. Refreshing...' })
          
          // Auto-refresh to get latest data
          setTimeout(() => {
            if (cvId) {
              loadCVData(cvId)
            }
          }, 2000)
          
          return
        }
        
        dispatch({ type: 'SET_CV_DATA', payload: result.data })
        lastSavedData.current = result.data
        dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() })
        retryCount.current = 0 // Reset retry count on success
        
        // Cache in localStorage for offline support
        if (offlineSupport) {
          localStorage.setItem(`cv_workflow_${result.data.id}`, JSON.stringify(result.data))
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to save CV data' })
        
        // Cache locally even if save fails
        if (offlineSupport) {
          localStorage.setItem(`cv_workflow_${updatedData.id}`, JSON.stringify(updatedData))
          dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' })
        }
      }
      
    } catch (error) {
      console.error('Error saving CV data:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save CV data' })
      
      // Cache locally even if save fails
      if (offlineSupport && state.cvData) {
        const updatedData = { 
          ...state.cvData, 
          ...data, 
          metadata: {
            ...state.cvData.metadata,
            updatedAt: new Date().toISOString()
          }
        }
        localStorage.setItem(`cv_workflow_${updatedData.id}`, JSON.stringify(updatedData))
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' })
      }
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false })
    }
  }, [state.cvData, dataService, offlineSupport])

  // Update CV data locally (triggers auto-save)
  const updateCVData = useCallback((updates: Partial<WorkflowCVData>): void => {
    dispatch({ type: 'UPDATE_CV_DATA', payload: updates })

    // Clear existing auto-save timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }

    // Set new auto-save timer
    autoSaveTimer.current = setTimeout(() => {
      saveCVData(updates)
    }, autoSaveInterval)
  }, [saveCVData, autoSaveInterval])

  // Clear CV data
  const clearCVData = useCallback((): void => {
    dispatch({ type: 'CLEAR_CV_DATA' })
    lastSavedData.current = null
    
    // Clear auto-save timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
    }
  }, [])

  // Force save current data
  const forceSave = useCallback(async (): Promise<void> => {
    if (state.cvData && hasUnsavedChanges()) {
      await saveCVData({})
    }
  }, [state.cvData, hasUnsavedChanges, saveCVData])

  // Refresh data from server
  const refreshData = useCallback(async (): Promise<void> => {
    if (state.cvData?.id) {
      await loadCVData(state.cvData.id)
    }
  }, [state.cvData?.id, loadCVData])

  // Handle online/offline status
  useEffect(() => {
    if (!offlineSupport) return

    const handleOnline = () => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'synced' })
      // Try to sync offline data
      if (state.cvData && hasUnsavedChanges()) {
        saveCVData({})
      }
    }

    const handleOffline = () => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [offlineSupport, state.cvData, hasUnsavedChanges, saveCVData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [])

  // Load specific CV when cvId is provided
  useEffect(() => {
    if (cvId) {
      console.log('🔄 CVWorkflowProvider: Loading CV data for ID:', cvId)
      loadCVData(cvId)
    }
  }, [cvId, loadCVData])

  // Periodic sync check for conflict detection
  useEffect(() => {
    if (!cvId || !state.cvData) return

    const checkForUpdates = async () => {
      try {
        const result = await dataService.loadDraft(userId, cvId)
        if (result.success && result.data) {
          const remoteVersion = result.data.metadata.version
          const localVersion = state.cvData?.metadata.version || 0
          
          if (remoteVersion > localVersion && !hasUnsavedChanges()) {
            console.log('🔄 Remote changes detected, updating local data')
            dispatch({ type: 'SET_CV_DATA', payload: result.data })
            lastSavedData.current = result.data
          } else if (remoteVersion > localVersion && hasUnsavedChanges()) {
            console.warn('🚨 Conflict: Remote changes detected but local changes exist')
            dispatch({ 
              type: 'SET_ERROR', 
              payload: 'Document updated by another session. Your changes will override when saved.' 
            })
          }
        }
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.warn('🔍 Sync check failed:', error)
      }
    }

    // Check for updates every 30 seconds when not actively editing
    const interval = setInterval(checkForUpdates, 30000)
    
    return () => clearInterval(interval)
  }, [cvId, userId, state.cvData, hasUnsavedChanges, dataService])

  // Prevent data loss on page close/reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        const message = 'You have unsaved changes. Are you sure you want to leave?'
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges()) {
        // Force save when page becomes hidden (user switching tabs, etc.)
        forceSave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, forceSave])

  // Context value
  const contextValue: CVWorkflowContextType = {
    state,
    loadCVData,
    saveCVData,
    updateCVData,
    clearCVData,
    isDataValid,
    hasUnsavedChanges,
    forceSave,
    refreshData
  }

  return (
    <CVWorkflowContext.Provider value={contextValue}>
      {children}
    </CVWorkflowContext.Provider>
  )
}

// Hook to use the context
export function useCVWorkflow(): CVWorkflowContextType {
  const context = useContext(CVWorkflowContext)
  if (context === undefined) {
    throw new Error('useCVWorkflow must be used within a CVWorkflowProvider')
  }
  return context
}

// Export context for testing
export { CVWorkflowContext } 