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
  autoSaveInterval?: number
  offlineSupport?: boolean
}

// Provider component
export function CVWorkflowProvider({ 
  children, 
  userId = 'mock-user-1',
  autoSaveInterval = 2000,
  offlineSupport = true
}: CVWorkflowProviderProps) {
  const [state, dispatch] = useReducer(cvWorkflowReducer, initialState)
  const dataService = CVWorkflowDataService.getInstance()
  
  // Auto-save timer reference
  const autoSaveTimer = React.useRef<NodeJS.Timeout | null>(null)
  const lastSavedData = React.useRef<WorkflowCVData | null>(null)

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
      
      const result = await dataService.loadDraft(userId, cvId)
      
      if (result.success && result.data) {
        dispatch({ type: 'SET_CV_DATA', payload: result.data })
        lastSavedData.current = result.data
        dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() })
      } else {
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
    if (!state.cvData) return

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
      
      const result = await dataService.saveDraft(updatedData)
      
      if (result.success && result.data) {
        dispatch({ type: 'SET_CV_DATA', payload: result.data })
        lastSavedData.current = result.data
        dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() })
        
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