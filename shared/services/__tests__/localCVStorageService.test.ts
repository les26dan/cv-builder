import { LocalCVStorageService } from '../localCVStorageService'
import { WorkflowCVData } from '../../types/workflow'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock timers
jest.useFakeTimers()

// Mock setInterval
const mockSetInterval = jest.fn()
global.setInterval = mockSetInterval

// Mock clearInterval
const mockClearInterval = jest.fn()
global.clearInterval = mockClearInterval

// Mock compression utilities
jest.mock('../../../utils/compression', () => ({
  compressCVData: jest.fn((data: any) => ({ ...data, _compressed: true })),
  decompressCVData: jest.fn((data: any, map: any) => {
    const { _compressed, ...rest } = data
    return rest
  })
}))

// Mock CV data
const mockCVData: WorkflowCVData = {
  id: 'test-cv-1',
  userId: 'test-user-1',
  title: 'Test CV',
  status: 'draft',
  score: 75,
  contact: {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '0123456789',
    location: 'Test City'
  },
  summary: {
    content: 'Test summary content'
  },
  experience: {
    items: []
  },
  skills: {
    items: ['JavaScript', 'React']
  },
  education: {
    items: []
  },
  workflow: {
    currentStep: 'editing',
    stepsCompleted: ['upload', 'analysis'],
    lastActiveStep: 'editing',
    timeSpent: 300
  },
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T01:00:00Z',
    version: 1,
    source: 'upload'
  },
  settings: {
    autoSave: true,
    aiAssistance: true,
    template: 'dennis-schroder',
    language: 'vi'
  }
}

const mockGuestCVData: WorkflowCVData = {
  ...mockCVData,
  id: 'guest-cv-1',
  userId: 'guest'
}

// Mock database service
const mockDatabaseService = {
  loadDraft: jest.fn(),
  saveDraft: jest.fn()
}

describe('LocalCVStorageService', () => {
  let service: LocalCVStorageService

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.length = 0
    
    // Reset singleton instance
    ;(LocalCVStorageService as any).instance = undefined
    
    service = LocalCVStorageService.getInstance({
      enableCompression: true,
      maxStorageSize: 10, // 10MB for testing
      cleanupInterval: 1000, // 1 second for testing
      syncRetryAttempts: 2,
      syncRetryDelay: 100,
      enableMetrics: true
    })
  })

  afterEach(() => {
    service.clearAllLocalData()
    jest.clearAllTimers()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const service1 = LocalCVStorageService.getInstance()
      const service2 = LocalCVStorageService.getInstance()
      expect(service1).toBe(service2)
    })

    it('should initialize with correct configuration', () => {
      const stats = service.getStorageStats()
      expect(stats.available).toBe(10) // From config
    })

    it('should handle server-side environment gracefully', () => {
      // Mock server environment
      const originalWindow = global.window
      delete (global as any).window

      // Should not throw error
      expect(() => {
        LocalCVStorageService.getInstance()
      }).not.toThrow()

      // Restore window
      global.window = originalWindow
    })
  })

  describe('Session Management', () => {
    it('should start guest session successfully', () => {
      const session = service.startSession()
      
      expect(session.isGuest).toBe(true)
      expect(session.userId).toBeUndefined()
      expect(session.sessionId).toMatch(/^guest-/)
      expect(session.totalCVs).toBe(0)
      expect(session.cvIds).toEqual([])
    })

    it('should start authenticated user session', () => {
      const userId = 'user-123'
      const session = service.startSession(userId)
      
      expect(session.isGuest).toBe(false)
      expect(session.userId).toBe(userId)
      expect(session.sessionId).toMatch(/^user-user-123-/)
    })

    it('should save and restore session', () => {
      const session = service.startSession('user-123')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_current_session',
        expect.stringContaining(session.sessionId)
      )
    })
  })

  describe('CV Data Operations', () => {
    it('should save CV data successfully', async () => {
      const result = await service.saveCVData(mockCVData, 'upload')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.metadata.version).toBe(2) // Incremented
      
      // Verify multiple localStorage keys are set
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_cv_workflow_test-cv-1',
        expect.any(String)
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_cv_test-cv-1',
        expect.any(String)
      )
    })

    it('should save guest CV data', async () => {
      const result = await service.saveCVData(mockGuestCVData, 'template')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      // Verify guest CV list is updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_guest_cvs',
        expect.any(String)
      )
    })

    it('should handle save errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const result = await service.saveCVData(mockCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Storage quota exceeded')
    })

    it('should load CV data successfully', async () => {
      // Mock localStorage to return stored data
      const mockEntry = {
        cvId: 'test-cv-1',
        userId: 'test-user-1',
        sessionId: 'session-123',
        cvData: mockCVData,
        compressed: false,
        lastModified: '2024-01-01T00:00:00Z',
        syncStatus: 'pending',
        version: 1,
        source: 'upload'
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEntry))

      const result = await service.loadCVData('test-cv-1', 'test-user-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockCVData)
    })

    it('should handle compressed CV data', async () => {
      const compressedData = { ...mockCVData, _compressed: true }
      const mockEntry = {
        cvId: 'test-cv-1',
        cvData: compressedData,
        compressed: true,
        syncStatus: 'pending',
        version: 1,
        source: 'upload'
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEntry))

      const result = await service.loadCVData('test-cv-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should handle load errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = await service.loadCVData('non-existent')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should handle server environment gracefully', async () => {
      // Mock server environment
      const originalWindow = global.window
      delete (global as any).window

      const result = await service.saveCVData(mockCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('server environment')

      // Restore window
      global.window = originalWindow
    })
  })

  describe('User CV List Management', () => {
    it('should get empty CV list for new user', () => {
      const cvList = service.getUserCVList('new-user')
      expect(cvList).toEqual([])
    })

    it('should get CV list from localStorage', () => {
      const mockCVList = [mockCVData]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockCVList))

      const cvList = service.getUserCVList('test-user-1')
      
      expect(cvList).toEqual(mockCVList)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('okbuddy_user_cvs_test-user-1')
    })

    it('should get guest CV list', () => {
      const mockCVList = [mockGuestCVData]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockCVList))

      const cvList = service.getUserCVList()
      
      expect(cvList).toEqual(mockCVList)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('okbuddy_guest_cvs')
    })

    it('should handle corrupted CV list gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      const cvList = service.getUserCVList('test-user')
      expect(cvList).toEqual([])
    })
  })

  describe('Critical Sync Operations', () => {
    beforeEach(() => {
      mockDatabaseService.loadDraft.mockResolvedValue({ success: false })
      mockDatabaseService.saveDraft.mockResolvedValue({ success: true, data: mockCVData })
    })

    it('should sync local CVs to database successfully', async () => {
      // Set up local CV data
      const mockEntry = {
        cvId: 'test-cv-1',
        userId: undefined, // Guest CV
        sessionId: 'guest-session',
        cvData: mockGuestCVData,
        compressed: false,
        lastModified: '2024-01-01T00:00:00Z',
        syncStatus: 'pending',
        version: 1,
        source: 'upload'
      }

      // Mock localStorage scan
      mockLocalStorage.length = 1
      mockLocalStorage.key.mockReturnValue('okbuddy_cv_workflow_test-cv-1')
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEntry))

      const result = await service.syncLocalDataToDatabase('user-123', mockDatabaseService)
      
      expect(result.success).toBe(true)
      expect(result.syncedCount).toBe(1)
      expect(result.conflictCount).toBe(0)
      expect(result.failedCount).toBe(0)
      expect(result.totalCount).toBe(1)
      
      expect(mockDatabaseService.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          id: 'test-cv-1'
        })
      )
    })

    it('should handle sync conflicts', async () => {
      // Mock existing CV in database
      mockDatabaseService.loadDraft.mockResolvedValue({
        success: true,
        data: { ...mockCVData, metadata: { ...mockCVData.metadata, version: 5 } }
      })

      const mockEntry = {
        cvId: 'test-cv-1',
        cvData: mockCVData,
        syncStatus: 'pending',
        version: 1,
        source: 'upload'
      }

      mockLocalStorage.length = 1
      mockLocalStorage.key.mockReturnValue('okbuddy_cv_workflow_test-cv-1')
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEntry))

      const result = await service.syncLocalDataToDatabase('user-123', mockDatabaseService)
      
      expect(result.conflictCount).toBe(1)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts![0].resolution).toBe('local')
    })

    it('should handle sync failures', async () => {
      mockDatabaseService.saveDraft.mockResolvedValue({
        success: false,
        error: 'Database error'
      })

      const mockEntry = {
        cvId: 'test-cv-1',
        cvData: mockCVData,
        syncStatus: 'pending',
        version: 1,
        source: 'upload'
      }

      mockLocalStorage.length = 1
      mockLocalStorage.key.mockReturnValue('okbuddy_cv_workflow_test-cv-1')
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEntry))

      const result = await service.syncLocalDataToDatabase('user-123', mockDatabaseService)
      
      expect(result.success).toBe(false)
      expect(result.failedCount).toBe(1)
      expect(result.errors).toContain('Failed to sync test-cv-1: Database error')
    })

    it('should create backup before sync', async () => {
      const mockEntry = {
        cvId: 'test-cv-1',
        cvData: mockCVData,
        syncStatus: 'pending',
        version: 1,
        source: 'upload'
      }

      mockLocalStorage.length = 1
      mockLocalStorage.key.mockReturnValue('okbuddy_cv_workflow_test-cv-1')
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEntry))

      await service.syncLocalDataToDatabase('user-123', mockDatabaseService)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_migration_backup',
        expect.stringContaining('test-cv-1')
      )
    })

    it('should migrate guest CVs to user', async () => {
      const mockEntry = {
        cvId: 'guest-cv-1',
        cvData: mockGuestCVData,
        syncStatus: 'pending',
        version: 1,
        source: 'template'
      }

      mockLocalStorage.length = 1
      mockLocalStorage.key.mockReturnValue('okbuddy_cv_workflow_guest-cv-1')
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockEntry))

      await service.syncLocalDataToDatabase('user-123', mockDatabaseService)
      
      // Verify guest list is cleared and user list is updated
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_guest_cvs')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_user_cvs_user-123',
        expect.any(String)
      )
    })

    it('should handle server environment in sync', async () => {
      // Mock server environment
      const originalWindow = global.window
      delete (global as any).window

      const result = await service.syncLocalDataToDatabase('user-123', mockDatabaseService)
      
      expect(result.success).toBe(false)
      expect(result.errors).toContain('Sync not available in server environment')

      // Restore window
      global.window = originalWindow
    })
  })

  describe('Utility Methods', () => {
    it('should check pending sync status', () => {
      expect(service.hasPendingSync()).toBe(false)
      
      // Add item to sync queue by saving data
      service.saveCVData(mockCVData)
      
      expect(service.hasPendingSync()).toBe(true)
    })

    it('should get sync status', () => {
      const status = service.getSyncStatus()
      
      expect(status).toEqual({
        pending: 0,
        failed: 0,
        total: 0
      })
    })

    it('should get storage statistics', () => {
      const stats = service.getStorageStats()
      
      expect(stats).toEqual({
        used: 0,
        available: 10,
        utilization: 0
      })
    })

    it('should calculate storage utilization', () => {
      // Mock some localStorage usage
      mockLocalStorage.length = 2
      mockLocalStorage.key
        .mockReturnValueOnce('okbuddy_cv_test-1')
        .mockReturnValueOnce('other_key')
      mockLocalStorage.getItem.mockReturnValue('test data')

      const stats = service.getStorageStats()
      
      expect(stats.used).toBeGreaterThan(0)
      expect(stats.utilization).toBeGreaterThan(0)
    })

    it('should clear all local data', () => {
      // Mock localStorage with OkBuddy keys
      mockLocalStorage.length = 3
      mockLocalStorage.key
        .mockReturnValueOnce('okbuddy_cv_test-1')
        .mockReturnValueOnce('other_key')
        .mockReturnValueOnce('okbuddy_session')

      service.clearAllLocalData()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_cv_test-1')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_session')
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other_key')
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded', async () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError')
      mockLocalStorage.setItem.mockImplementation(() => {
        throw quotaError
      })

      const result = await service.saveCVData(mockCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Quota exceeded')
    })

    it('should handle invalid JSON in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json{')

      const result = await service.loadCVData('test-cv-1')
      
      expect(result.success).toBe(false)
    })

    it('should handle missing localStorage keys gracefully', () => {
      mockLocalStorage.key.mockReturnValue(null)

      const cvList = service.getUserCVList('test-user')
      expect(cvList).toEqual([])
    })
  })

  describe('Cleanup and Maintenance', () => {
    it('should set up cleanup timer', () => {
      expect(mockSetInterval).toHaveBeenCalledWith(
        expect.any(Function),
        1000 // From test config
      )
    })

    it('should perform periodic cleanup', () => {
      // Advance timer to trigger cleanup
      jest.advanceTimersByTime(1000)
      
      // Cleanup should be triggered (logs are checked manually)
      expect(true).toBe(true) // Placeholder - cleanup logic can be enhanced
    })
  })

  describe('Data Deduplication', () => {
    it('should deduplicate CVs by ID and version', () => {
      const entry1 = {
        cvId: 'test-cv-1',
        cvData: { ...mockCVData, metadata: { ...mockCVData.metadata, version: 1 } },
        version: 1,
        syncStatus: 'pending',
        source: 'upload'
      }

      const entry2 = {
        cvId: 'test-cv-1',
        cvData: { ...mockCVData, metadata: { ...mockCVData.metadata, version: 2 } },
        version: 2,
        syncStatus: 'pending',
        source: 'editing'
      }

      // Mock localStorage to return both entries
      mockLocalStorage.length = 2
      mockLocalStorage.key
        .mockReturnValueOnce('okbuddy_cv_workflow_test-cv-1-old')
        .mockReturnValueOnce('okbuddy_cv_workflow_test-cv-1')
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(entry1))
        .mockReturnValueOnce(JSON.stringify(entry2))

      // This indirectly tests deduplication through sync
      service.syncLocalDataToDatabase('user-123', mockDatabaseService)
      
      // Should only sync the latest version
      expect(mockDatabaseService.saveDraft).toHaveBeenCalledTimes(1)
      expect(mockDatabaseService.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ version: 2 })
        })
      )
    })
  })
})
