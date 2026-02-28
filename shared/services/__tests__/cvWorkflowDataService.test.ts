import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
/**
 * CV Workflow Data Service Tests
 * Comprehensive test suite for CV workflow data operations
 * Tests CRUD operations, validation, caching, and error handling
 */

import { cvWorkflowDataService, CVWorkflowDataService } from '../cvWorkflowDataService'
import { WorkflowCVData, WorkflowStatus, WorkflowStep } from '../../types/workflow'

// Mock database service completely
vi.mock('../database', () => ({
  databaseService: {
    getClient: vi.fn()
  }
}))

// Mock Supabase to avoid ES module issues
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}))

const mockDatabaseService = {
  getClient: vi.fn()
}

// Mock environment configuration
vi.mock('../../../config/environment', () => ({
  environmentConfig: {
    performance: {
      dataCacheTTL: 300000 // 5 minutes
    }
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('CVWorkflowDataService', () => {
  let mockClient: any
  let testCVData: WorkflowCVData

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create mock Supabase client
    mockClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn()
    }

    mockDatabaseService.getClient.mockResolvedValue(mockClient)

    // Test CV data
    testCVData = {
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
        items: [
          {
            id: 'exp-1',
            title: 'Test Position',
            company: 'Test Company',
            location: 'Test Location',
            startDate: '2022-01',
            endDate: '2024-01',
            current: false,
            bullets: ['Test achievement 1', 'Test achievement 2']
          }
        ]
      },
      skills: {
        items: ['JavaScript', 'TypeScript', 'React']
      },
      education: {
        items: [
          {
            id: 'edu-1',
            degree: 'Test Degree',
            institution: 'Test University',
            location: 'Test City',
            graduationDate: '2020-06'
          }
        ]
      },
      workflow: {
        currentStep: 'editing',
        stepsCompleted: ['upload', 'analysis'],
        lastActiveStep: 'editing',
        timeSpent: 1200
      },
      metadata: {
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
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
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CVWorkflowDataService.getInstance()
      const instance2 = CVWorkflowDataService.getInstance()
      const instance3 = cvWorkflowDataService
      
      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
    })
  })

  describe('Save Draft', () => {
    it('should save CV data successfully', async () => {
      mockClient.upsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: testCVData.id },
            error: null
          })
        })
      })

      const result = await cvWorkflowDataService.saveDraft(testCVData)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe(testCVData.id)
      expect(result.data?.metadata.version).toBe(2) // Version incremented
      expect(mockClient.upsert).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      const invalidCVData = {
        ...testCVData,
        contact: {
          ...testCVData.contact,
          email: 'invalid-email' // Invalid email format
        }
      }

      const result = await cvWorkflowDataService.saveDraft(invalidCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Validation failed')
      expect(result.error).toContain('Invalid email format')
    })

    it('should handle database errors', async () => {
      mockClient.upsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: 'DB001' }
          })
        })
      })

      const result = await cvWorkflowDataService.saveDraft(testCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Database save failed: Database error')
      expect(result.code).toBe('DB001')
    })

    it('should use mock mode when client is null', async () => {
      mockDatabaseService.getClient.mockResolvedValue(null)

      const result = await cvWorkflowDataService.saveDraft(testCVData)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.metadata.updatedAt).toBeDefined()
    })

    it('should handle exceptions', async () => {
      mockClient.upsert.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const result = await cvWorkflowDataService.saveDraft(testCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unexpected error')
    })
  })

  describe('Load Draft', () => {
    it('should load CV by ID successfully', async () => {
      const mockDbRow = {
        id: testCVData.id,
        user_id: testCVData.userId,
        title: testCVData.title,
        status: testCVData.status,
        score: testCVData.score,
        cv_data: testCVData,
        workflow_current_step: testCVData.workflow.currentStep,
        workflow_steps_completed: testCVData.workflow.stepsCompleted,
        workflow_last_active_step: testCVData.workflow.lastActiveStep,
        workflow_time_spent: testCVData.workflow.timeSpent,
        auto_save_enabled: testCVData.settings.autoSave,
        ai_assistance_enabled: testCVData.settings.aiAssistance,
        template_name: testCVData.settings.template,
        language: testCVData.settings.language,
        version: testCVData.metadata.version,
        source: testCVData.metadata.source,
        created_at: testCVData.metadata.createdAt,
        updated_at: testCVData.metadata.updatedAt
      }

      mockClient.eq.mockResolvedValue({
        data: [mockDbRow],
        error: null
      })

      const result = await cvWorkflowDataService.loadDraft('test-user-1', 'test-cv-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe(testCVData.id)
      expect(result.data?.userId).toBe(testCVData.userId)
    })

    it('should load latest draft when no ID provided', async () => {
      const mockDbRow = {
        id: testCVData.id,
        user_id: testCVData.userId,
        cv_data: testCVData,
        // ... other required fields
      }

      mockClient.order.mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: [mockDbRow],
          error: null
        })
      })

      const result = await cvWorkflowDataService.loadDraft('test-user-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(mockClient.in).toHaveBeenCalledWith('status', ['draft', 'analyzing'])
    })

    it('should return from cache if valid', async () => {
      // Manually add to cache
      const service = cvWorkflowDataService as any
      service.updateCache(testCVData.id, testCVData)

      const result = await cvWorkflowDataService.loadDraft('test-user-1', testCVData.id)
      
      expect(result.success).toBe(true)
      expect(result.data?.id).toBe(testCVData.id)
      expect(mockClient.eq).not.toHaveBeenCalled() // Should not hit database
    })

    it('should handle no draft found', async () => {
      mockClient.eq.mockResolvedValue({
        data: [],
        error: null
      })

      const result = await cvWorkflowDataService.loadDraft('test-user-1', 'nonexistent-id')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No draft found')
    })

    it('should handle database errors', async () => {
      mockClient.eq.mockResolvedValue({
        data: null,
        error: { message: 'Access denied', code: 'AUTH001' }
      })

      const result = await cvWorkflowDataService.loadDraft('test-user-1', 'test-cv-1')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Database load failed: Access denied')
      expect(result.code).toBe('AUTH001')
    })

    it('should use mock mode when client is null', async () => {
      mockDatabaseService.getClient.mockResolvedValue(null)

      const result = await cvWorkflowDataService.loadDraft('mock-user-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe('Update Status', () => {
    it('should update status successfully', async () => {
      mockClient.eq.mockResolvedValue({
        error: null
      })

      const result = await cvWorkflowDataService.updateStatus('test-cv-1', 'completed', 'completed')
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          workflow_current_step: 'completed',
          workflow_last_active_step: 'completed'
        })
      )
    })

    it('should update status without step', async () => {
      mockClient.eq.mockResolvedValue({
        error: null
      })

      const result = await cvWorkflowDataService.updateStatus('test-cv-1', 'analyzing')
      
      expect(result.success).toBe(true)
      expect(mockClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'analyzing'
        })
      )
    })

    it('should handle database errors', async () => {
      mockClient.eq.mockResolvedValue({
        error: { message: 'Update failed', code: 'UPDATE001' }
      })

      const result = await cvWorkflowDataService.updateStatus('test-cv-1', 'completed')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Status update failed: Update failed')
      expect(result.code).toBe('UPDATE001')
    })

    it('should use mock mode when client is null', async () => {
      mockDatabaseService.getClient.mockResolvedValue(null)

      const result = await cvWorkflowDataService.updateStatus('mock-cv-1', 'completed')
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })
  })

  describe('Get User CVs', () => {
    it('should get all user CVs successfully', async () => {
      const mockDbRows = [
        {
          id: 'cv-1',
          user_id: 'test-user-1',
          cv_data: { ...testCVData, id: 'cv-1' },
          // ... other required fields
        },
        {
          id: 'cv-2', 
          user_id: 'test-user-1',
          cv_data: { ...testCVData, id: 'cv-2' },
          // ... other required fields
        }
      ]

      mockClient.order.mockResolvedValue({
        data: mockDbRows,
        error: null
      })

      const result = await cvWorkflowDataService.getUserCVs('test-user-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data?.[0].id).toBe('cv-1')
      expect(result.data?.[1].id).toBe('cv-2')
    })

    it('should handle database errors', async () => {
      mockClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Query failed', code: 'QUERY001' }
      })

      const result = await cvWorkflowDataService.getUserCVs('test-user-1')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to get user CVs: Query failed')
      expect(result.code).toBe('QUERY001')
    })

    it('should use mock mode when client is null', async () => {
      mockDatabaseService.getClient.mockResolvedValue(null)

      const result = await cvWorkflowDataService.getUserCVs('mock-user-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('Delete CV', () => {
    it('should delete CV successfully', async () => {
      mockClient.eq.mockResolvedValue({
        error: null
      })

      const result = await cvWorkflowDataService.deleteCV('test-cv-1', 'test-user-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockClient.delete).toHaveBeenCalled()
      expect(mockClient.eq).toHaveBeenCalledWith('id', 'test-cv-1')
      expect(mockClient.eq).toHaveBeenCalledWith('user_id', 'test-user-1')
    })

    it('should handle database errors', async () => {
      mockClient.eq.mockResolvedValue({
        error: { message: 'Delete failed', code: 'DELETE001' }
      })

      const result = await cvWorkflowDataService.deleteCV('test-cv-1', 'test-user-1')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Delete failed: Delete failed')
      expect(result.code).toBe('DELETE001')
    })

    it('should use mock mode when client is null', async () => {
      mockDatabaseService.getClient.mockResolvedValue(null)

      const result = await cvWorkflowDataService.deleteCV('mock-cv-1', 'mock-user-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })
  })

  describe('Create Backup', () => {
    it('should create backup successfully', async () => {
      // Mock loadDraft to return test data
      vi.spyOn(cvWorkflowDataService, 'loadDraft').mockResolvedValue({
        success: true,
        data: testCVData
      })

      const result = await cvWorkflowDataService.createBackup('test-cv-1')
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.id).toBe('test-cv-1')
      expect(result.data.data).toEqual(testCVData)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should handle backup failure when CV load fails', async () => {
      vi.spyOn(cvWorkflowDataService, 'loadDraft').mockResolvedValue({
        success: false,
        error: 'CV not found'
      })

      const result = await cvWorkflowDataService.createBackup('nonexistent-cv')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to load CV for backup')
    })

    it('should handle localStorage errors', async () => {
      vi.spyOn(cvWorkflowDataService, 'loadDraft').mockResolvedValue({
        success: true,
        data: testCVData
      })

      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const result = await cvWorkflowDataService.createBackup('test-cv-1')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage quota exceeded')
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      const invalidCVData = {
        ...testCVData,
        id: '', // Missing required field
        contact: {
          ...testCVData.contact,
          fullName: '' // Missing required field
        }
      }

      const result = await cvWorkflowDataService.saveDraft(invalidCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('CV ID is required')
      expect(result.error).toContain('Full name is required')
    })

    it('should validate email format', async () => {
      const invalidCVData = {
        ...testCVData,
        contact: {
          ...testCVData.contact,
          email: 'invalid-email-format'
        }
      }

      const result = await cvWorkflowDataService.saveDraft(invalidCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid email format')
    })

    it('should validate score range', async () => {
      const invalidCVData = {
        ...testCVData,
        score: 150 // Invalid score > 100
      }

      const result = await cvWorkflowDataService.saveDraft(invalidCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Score must be between 0 and 100')
    })

    it('should validate status values', async () => {
      const invalidCVData = {
        ...testCVData,
        status: 'invalid-status' as WorkflowStatus
      }

      const result = await cvWorkflowDataService.saveDraft(invalidCVData)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid status')
    })
  })

  describe('Cache Management', () => {
    it('should cache loaded data', async () => {
      const mockDbRow = {
        id: testCVData.id,
        user_id: testCVData.userId,
        cv_data: testCVData,
        // ... other required fields
      }

      mockClient.eq.mockResolvedValue({
        data: [mockDbRow],
        error: null
      })

      // First load - should hit database
      await cvWorkflowDataService.loadDraft('test-user-1', testCVData.id)
      
      // Second load - should use cache
      const result = await cvWorkflowDataService.loadDraft('test-user-1', testCVData.id)
      
      expect(result.success).toBe(true)
      expect(result.data?.id).toBe(testCVData.id)
      // Database should only be called once
      expect(mockClient.eq).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache on status update', async () => {
      // Add to cache first
      const service = cvWorkflowDataService as any
      service.updateCache(testCVData.id, testCVData)

      mockClient.eq.mockResolvedValue({ error: null })

      // Update status should invalidate cache
      await cvWorkflowDataService.updateStatus(testCVData.id, 'completed')
      
      // Check if cache is invalidated
      const cachedData = service.cache.get(testCVData.id)
      expect(cachedData).toBeUndefined()
    })

    it('should invalidate cache on delete', async () => {
      // Add to cache first
      const service = cvWorkflowDataService as any
      service.updateCache(testCVData.id, testCVData)

      mockClient.eq.mockResolvedValue({ error: null })

      // Delete should invalidate cache
      await cvWorkflowDataService.deleteCV(testCVData.id, testCVData.userId)
      
      // Check if cache is invalidated
      const cachedData = service.cache.get(testCVData.id)
      expect(cachedData).toBeUndefined()
    })
  })

  describe('Data Mapping', () => {
    it('should map CV data to table row correctly', async () => {
      mockClient.upsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: testCVData.id },
            error: null
          })
        })
      })

      await cvWorkflowDataService.saveDraft(testCVData)
      
      const upsertCall = mockClient.upsert.mock.calls[0][0][0]
      
      expect(upsertCall.id).toBe(testCVData.id)
      expect(upsertCall.user_id).toBe(testCVData.userId)
      expect(upsertCall.title).toBe(testCVData.title)
      expect(upsertCall.status).toBe(testCVData.status)
      expect(upsertCall.score).toBe(testCVData.score)
      expect(upsertCall.cv_data).toEqual(expect.objectContaining(testCVData))
    })

    it('should map table row to CV data correctly', async () => {
      const mockDbRow = {
        id: testCVData.id,
        user_id: testCVData.userId,
        title: testCVData.title,
        status: testCVData.status,
        score: testCVData.score,
        cv_data: testCVData,
        uploaded_file_url: 'https://example.com/file.pdf',
        uploaded_file_name: 'test.pdf',
        uploaded_file_size: 1024,
        uploaded_file_type: 'application/pdf',
        workflow_current_step: testCVData.workflow.currentStep,
        workflow_steps_completed: testCVData.workflow.stepsCompleted,
        workflow_last_active_step: testCVData.workflow.lastActiveStep,
        workflow_time_spent: testCVData.workflow.timeSpent,
        auto_save_enabled: testCVData.settings.autoSave,
        ai_assistance_enabled: testCVData.settings.aiAssistance,
        template_name: testCVData.settings.template,
        language: testCVData.settings.language,
        version: testCVData.metadata.version,
        source: testCVData.metadata.source,
        created_at: testCVData.metadata.createdAt,
        updated_at: testCVData.metadata.updatedAt
      }

      mockClient.eq.mockResolvedValue({
        data: [mockDbRow],
        error: null
      })

      const result = await cvWorkflowDataService.loadDraft('test-user-1', testCVData.id)
      
      expect(result.success).toBe(true)
      expect(result.data?.uploadedFile).toEqual({
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        url: 'https://example.com/file.pdf',
        originalText: undefined
      })
    })
  })
}) 