'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAutosave, AutosaveStatus, UseAutosaveOptions } from '../../lib/hooks/useAutosave'

interface AutosaveContextType {
  status: AutosaveStatus
  triggerSave: (data?: any) => void
  setStatus: (status: AutosaveStatus) => void
  reset: () => void
}

const AutosaveContext = createContext<AutosaveContextType | undefined>(undefined)

interface AutosaveProviderProps {
  children: ReactNode
  options?: UseAutosaveOptions
}

/**
 * Provider component for autosave functionality
 * Manages autosave state throughout the application
 */
export function AutosaveProvider({ children, options }: AutosaveProviderProps) {
  const autosave = useAutosave(options)

  return (
    <AutosaveContext.Provider value={autosave}>
      {children}
    </AutosaveContext.Provider>
  )
}

/**
 * Hook to access autosave context
 * Must be used within AutosaveProvider
 */
export function useAutosaveContext(): AutosaveContextType {
  const context = useContext(AutosaveContext)
  
  if (context === undefined) {
    throw new Error('useAutosaveContext must be used within an AutosaveProvider')
  }
  
  return context
}

/**
 * HOC to wrap components with autosave functionality
 */
export function withAutosave<P extends object>(
  Component: React.ComponentType<P>,
  options?: UseAutosaveOptions
) {
  return function WrappedComponent(props: P) {
    return (
      <AutosaveProvider options={options}>
        <Component {...props} />
      </AutosaveProvider>
    )
  }
}

// Export types for convenience
export type { AutosaveStatus } from '../../lib/hooks/useAutosave' 