import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WorkflowCVData } from '../../types/workflow'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock the data service to avoid Supabase issues
const mockDataService = {
  loadDraft: vi.fn(),
  saveDraft: vi.fn(),
  updateStatus: vi.fn(),
  getUserCVs: vi.fn(),
  deleteCV: vi.fn(),
  createBackup: vi.fn()
}

vi.mock('../../services/cvWorkflowDataService', () => ({
  CVWorkflowDataService: {
    getInstance: vi.fn(() => mockDataService)
  }
}))

// Import after mocking
import { CVWorkflowProvider, useCVWorkflow } from '../CVWorkflowContext'

// Mock timers
vi.useFakeTimers()

// Mock CV data
const mockCVData: WorkflowCVData = {
  id: 'test-cv-1',
  userId: 'test-user',
  title: 'Test CV',
  status: 'draft',
  score: 75,
  contact: { fullName: 'John Doe', email: 'john@test.com', phone: '123', location: 'City' },
  summary: { content: 'Summary' },
  experience: { items: [] },
  skills: { items: [] },
  education: { items: [] },
  workflow: {
    currentStep: 'editing',
    stepsCompleted: ['upload'],
    lastActiveStep: 'editing',
    timeSpent: 0
  },
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1,
    source: 'upload'
  },
  settings: {
    autoSave: true,
    aiAssistance: true,
    template: 'default',
    language: 'vi'
  }
}

// Test component that uses the context
const TestComponent: React.FC = () => {
  const {
    state,
    loadCVData,
    saveCVData,
    updateCVData,
    clearCVData,
    isDataValid,
    hasUnsavedChanges,
    forceSave,
    refreshData
  } = useCVWorkflow()

  return (
    <div>
      <div data-testid="loading">{state.isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="saving">{state.isSaving ? 'saving' : 'not-saving'}</div>
      <div data-testid="error">{state.error || 'no-error'}</div>
      <div data-testid="sync-status">{state.syncStatus}</div>
      <div data-testid="cv-id">{state.cvData?.id || 'no-id'}</div>
      <div data-testid="last-saved">{state.lastSaved || 'no-date'}</div>
      <div data-testid="data-valid">{isDataValid() ? 'valid' : 'invalid'}</div>
      <div data-testid="has-changes">{hasUnsavedChanges() ? 'has-changes' : 'no-changes'}</div>
      
      <button onClick={() => loadCVData('test-cv-1')}>Load CV</button>
      <button onClick={() => saveCVData({ title: 'Updated' })}>Save CV</button>
      <button onClick={() => updateCVData({ title: 'Auto-save' })}>Update CV</button>
      <button onClick={clearCVData}>Clear CV</button>
      <button onClick={forceSave}>Force Save</button>
      <button onClick={refreshData}>Refresh</button>
    </div>
  )
}

describe('CVWorkflowContext Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    
    // Mock console methods to avoid noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.useFakeTimers()
    vi.restoreAllMocks()
  })

  describe('Provider Setup', () => {
    it('should provide context to child components', () => {
      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      expect(screen.getByTestId('saving')).toHaveTextContent('not-saving')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced')
      expect(screen.getByTestId('data-valid')).toHaveTextContent('invalid')
      expect(screen.getByTestId('has-changes')).toHaveTextContent('no-changes')
    })

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useCVWorkflow must be used within a CVWorkflowProvider')

      consoleSpy.mockRestore()
    })

    it('should accept custom configuration', () => {
      render(
        <CVWorkflowProvider 
          userId="custom-user"
          autoSaveInterval={5000}
          offlineSupport={false}
        >
          <TestComponent />
        </CVWorkflowProvider>
      )

      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced')
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      expect(screen.getByTestId('saving')).toHaveTextContent('not-saving')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced')
      expect(screen.getByTestId('data-valid')).toHaveTextContent('invalid')
      expect(screen.getByTestId('has-changes')).toHaveTextContent('no-changes')
    })
  })

  describe('Load CV Data', () => {
    it('should load CV data successfully', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
      expect(screen.getByTestId('data-valid')).toHaveTextContent('valid')
      expect(mockDataService.loadDraft).toHaveBeenCalledWith('mock-user-1', 'test-cv-1')
    })

    it('should handle load failure', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: false,
        error: 'CV not found'
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('CV not found')
      })
    })

    it('should handle load failure with no error message', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: false,
        error: null
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('CV not found')
      })
    })

    it('should handle load exception with offline fallback', async () => {
      const cachedData = { id: 'test-cv-1', title: 'Cached CV' }
      
      mockDataService.loadDraft.mockRejectedValue(new Error('Network error'))
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData))

      render(
        <CVWorkflowProvider offlineSupport={true}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toHaveTextContent('offline')
      })
    })

    it('should handle load exception without offline support', async () => {
      mockDataService.loadDraft.mockRejectedValue(new Error('Network error'))

      render(
        <CVWorkflowProvider offlineSupport={false}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load CV data')
      })
    })

    it('should handle cache errors gracefully', async () => {
      mockDataService.loadDraft.mockRejectedValue(new Error('Network error'))
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Cache error')
      })

      render(
        <CVWorkflowProvider offlineSupport={true}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load CV data')
      })
    })
  })

  describe('Save CV Data', () => {
    it('should save CV data successfully', async () => {
      // First load CV data
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      mockDataService.saveDraft.mockResolvedValue({
        success: true,
        data: { ...mockCVData, title: 'Updated' }
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV first
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Now save
      await act(async () => {
        screen.getByText('Save CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('saving')).toHaveTextContent('not-saving')
      })

      expect(mockDataService.saveDraft).toHaveBeenCalled()
    })

    it('should handle save failure', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      mockDataService.saveDraft.mockResolvedValue({
        success: false,
        error: 'Save failed'
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV first
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Now save
      await act(async () => {
        screen.getByText('Save CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Save failed')
      })
    })

    it('should handle save failure with no error message', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      mockDataService.saveDraft.mockResolvedValue({
        success: false,
        error: null
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV first
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Now save
      await act(async () => {
        screen.getByText('Save CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to save CV data')
      })
    })

    it('should handle save exception', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      mockDataService.saveDraft.mockRejectedValue(new Error('Save error'))

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV first
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Try to save
      await act(async () => {
        screen.getByText('Save CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to save CV data')
      })
    })

    it('should not save when no CV data exists', async () => {
      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Save CV').click()
      })

      expect(mockDataService.saveDraft).not.toHaveBeenCalled()
    })
  })

  describe('Update CV Data and Auto-save', () => {
    it('should update CV data and trigger auto-save', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      mockDataService.saveDraft.mockResolvedValue({
        success: true,
        data: { ...mockCVData, title: 'Auto-save' }
      })

      render(
        <CVWorkflowProvider autoSaveInterval={1000}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV first
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Update CV data
      await act(async () => {
        screen.getByText('Update CV').click()
      })

      expect(screen.getByTestId('sync-status')).toHaveTextContent('syncing')

      // Fast-forward auto-save timer
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockDataService.saveDraft).toHaveBeenCalled()
      })
    })

    it('should clear existing timer when updating multiple times', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      render(
        <CVWorkflowProvider autoSaveInterval={1000}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV first
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Update multiple times quickly
      await act(async () => {
        screen.getByText('Update CV').click()
        screen.getByText('Update CV').click()
      })

      // Fast-forward timer
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      // Should only save once (last update)
      await waitFor(() => {
        expect(mockDataService.saveDraft).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Clear CV Data', () => {
    it('should clear CV data and reset state', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV first
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Clear CV data
      await act(async () => {
        screen.getByText('Clear CV').click()
      })

      expect(screen.getByTestId('cv-id')).toHaveTextContent('no-id')
      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced')
      expect(screen.getByTestId('data-valid')).toHaveTextContent('invalid')
      expect(screen.getByTestId('has-changes')).toHaveTextContent('no-changes')
    })
  })

  describe('Force Save', () => {
    it('should force save when there are unsaved changes', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      mockDataService.saveDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV first
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Update to create unsaved changes
      await act(async () => {
        screen.getByText('Update CV').click()
      })

      expect(screen.getByTestId('has-changes')).toHaveTextContent('has-changes')

      // Force save
      await act(async () => {
        screen.getByText('Force Save').click()
      })

      await waitFor(() => {
        expect(mockDataService.saveDraft).toHaveBeenCalled()
      })
    })

    it('should not force save when no unsaved changes', async () => {
      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Force Save').click()
      })

      expect(mockDataService.saveDraft).not.toHaveBeenCalled()
    })
  })

  describe('Refresh Data', () => {
    it('should refresh data when CV ID exists', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV first
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Refresh data
      await act(async () => {
        screen.getByText('Refresh').click()
      })

      await waitFor(() => {
        expect(mockDataService.loadDraft).toHaveBeenCalledTimes(2)
      })
    })

    it('should not refresh when no CV ID exists', async () => {
      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Refresh').click()
      })

      expect(mockDataService.loadDraft).not.toHaveBeenCalled()
    })
  })

  describe('Online/Offline Handling', () => {
    it('should handle online event and sync data', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      mockDataService.saveDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      render(
        <CVWorkflowProvider offlineSupport={true}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Load CV and update to create changes
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      await act(async () => {
        screen.getByText('Update CV').click()
      })

      expect(screen.getByTestId('has-changes')).toHaveTextContent('has-changes')

      // Simulate going online
      await act(async () => {
        window.dispatchEvent(new Event('online'))
      })

      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced')
    })

    it('should handle online event without unsaved changes', async () => {
      render(
        <CVWorkflowProvider offlineSupport={true}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Simulate going online
      await act(async () => {
        window.dispatchEvent(new Event('online'))
      })

      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced')
      expect(mockDataService.saveDraft).not.toHaveBeenCalled()
    })

    it('should handle offline event', async () => {
      render(
        <CVWorkflowProvider offlineSupport={true}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Simulate going offline
      await act(async () => {
        window.dispatchEvent(new Event('offline'))
      })

      expect(screen.getByTestId('sync-status')).toHaveTextContent('offline')
    })

    it('should not handle online/offline events when offline support is disabled', async () => {
      render(
        <CVWorkflowProvider offlineSupport={false}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Simulate going offline
      await act(async () => {
        window.dispatchEvent(new Event('offline'))
      })

      expect(screen.getByTestId('sync-status')).toHaveTextContent('synced')
    })
  })

  describe('Data Validation', () => {
    it('should validate empty data as invalid', () => {
      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      expect(screen.getByTestId('data-valid')).toHaveTextContent('invalid')
    })

    it('should validate CV data correctly', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('data-valid')).toHaveTextContent('valid')
      })
    })

    it('should invalidate CV data with missing userId', async () => {
      const invalidCVData = { ...mockCVData, userId: '' }

      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: invalidCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('data-valid')).toHaveTextContent('invalid')
      })
    })

    it('should invalidate CV data with missing id', async () => {
      const invalidCVData = { ...mockCVData, id: '' }

      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: invalidCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('data-valid')).toHaveTextContent('invalid')
      })
    })

    it('should invalidate CV data with missing contact fullName', async () => {
      const invalidCVData = {
        ...mockCVData,
        contact: { ...mockCVData.contact, fullName: '' }
      }

      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: invalidCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('data-valid')).toHaveTextContent('invalid')
      })
    })

    it('should invalidate CV data with missing contact', async () => {
      const invalidCVData = {
        ...mockCVData,
        contact: undefined as any
      }

      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: invalidCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('data-valid')).toHaveTextContent('invalid')
      })
    })
  })

  describe('Change Detection', () => {
    it('should detect no changes initially', () => {
      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      expect(screen.getByTestId('has-changes')).toHaveTextContent('no-changes')
    })

    it('should detect changes correctly', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Initially no changes
      expect(screen.getByTestId('has-changes')).toHaveTextContent('no-changes')

      // Load CV
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      // Still no changes after load
      expect(screen.getByTestId('has-changes')).toHaveTextContent('no-changes')

      // Update CV
      await act(async () => {
        screen.getByText('Update CV').click()
      })

      // Now should have changes
      expect(screen.getByTestId('has-changes')).toHaveTextContent('has-changes')
    })

    it('should handle changes when no lastSavedData exists', async () => {
      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      expect(screen.getByTestId('has-changes')).toHaveTextContent('no-changes')
    })
  })

  describe('Reducer Edge Cases', () => {
    it('should handle UPDATE_CV_DATA with null cvData', async () => {
      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      // Try to update when no CV data exists
      await act(async () => {
        screen.getByText('Update CV').click()
      })

      expect(screen.getByTestId('cv-id')).toHaveTextContent('no-id')
      expect(screen.getByTestId('sync-status')).toHaveTextContent('syncing')
    })

    it('should handle SET_ERROR with null error', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error')
        expect(screen.getByTestId('sync-status')).toHaveTextContent('synced')
      })
    })

    it('should handle SET_ERROR with actual error', async () => {
      mockDataService.loadDraft.mockResolvedValue({
        success: false,
        error: 'Test error'
      })

      render(
        <CVWorkflowProvider>
          <TestComponent />
        </CVWorkflowProvider>
      )

      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error')
        expect(screen.getByTestId('sync-status')).toHaveTextContent('error')
      })
    })
  })

  describe('Cleanup', () => {
    it('should cleanup timers on unmount', async () => {
      const { unmount } = render(
        <CVWorkflowProvider autoSaveInterval={1000}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      mockDataService.loadDraft.mockResolvedValue({
        success: true,
        data: mockCVData
      })

      // Load CV and update to set timer
      await act(async () => {
        screen.getByText('Load CV').click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('cv-id')).toHaveTextContent('test-cv-1')
      })

      await act(async () => {
        screen.getByText('Update CV').click()
      })

      // Unmount component
      unmount()

      // Timer should be cleared, so advancing time shouldn't trigger save
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(mockDataService.saveDraft).not.toHaveBeenCalled()
    })

    it('should cleanup event listeners on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = render(
        <CVWorkflowProvider offlineSupport={true}>
          <TestComponent />
        </CVWorkflowProvider>
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })
}) 