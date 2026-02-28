import { useState, useEffect, useCallback, useRef } from 'react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseAutosaveOptions {
  debounceMs?: number
  onSave?: (data: any) => Promise<void>
  autoResetDelay?: number
}

interface UseAutosaveReturn {
  status: AutosaveStatus
  triggerSave: (data?: any) => void
  setStatus: (status: AutosaveStatus) => void
  reset: () => void
}

/**
 * Custom hook for managing autosave functionality with debouncing
 * 
 * @param options Configuration options for autosave behavior
 * @returns Object with autosave status and control functions
 */
export function useAutosave({
  debounceMs = 1000,
  onSave,
  autoResetDelay = 3000,
}: UseAutosaveOptions = {}): UseAutosaveReturn {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingDataRef = useRef<any>(null)

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [])

  // Auto-reset to idle after successful save
  useEffect(() => {
    if (status === 'saved' && autoResetDelay > 0) {
      resetTimeoutRef.current = setTimeout(() => {
        setStatus('idle')
      }, autoResetDelay)
    }

    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
    }
  }, [status, autoResetDelay])

  const performSave = useCallback(async (data: any) => {
    try {
      setStatus('saving')
      
      if (onSave) {
        await onSave(data)
      }
      
      setStatus('saved')
    } catch (error) {
      console.error('Autosave error:', error)
      setStatus('error')
    }
  }, [onSave])

  const triggerSave = useCallback((data?: any) => {
    // Clear existing save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Clear reset timeout if user is actively making changes
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
    }

    // Store the data to save
    pendingDataRef.current = data

    // Set status to indicate save is pending
    if (status !== 'saving') {
      setStatus('saving')
    }

    // Debounce the actual save operation
    saveTimeoutRef.current = setTimeout(() => {
      performSave(pendingDataRef.current)
    }, debounceMs)
  }, [debounceMs, performSave, status])

  const reset = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
    }
    setStatus('idle')
    pendingDataRef.current = null
  }, [])

  const setStatusManual = useCallback((newStatus: AutosaveStatus) => {
    // Clear timeouts when status is manually set
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
    }
    setStatus(newStatus)
  }, [])

  return {
    status,
    triggerSave,
    setStatus: setStatusManual,
    reset,
  }
} 