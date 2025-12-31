import { vi, describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
/**
 * CrossAppDataService Unit Tests
 * Comprehensive testing for cross-application data sharing functionality
 */

import { CrossAppDataService, CrossAppDataTransfer } from '../crossAppDataService'
import { WorkflowCVData } from '../../types/workflow'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length
    }
  }
})()

// Mock window.location
const mockLocation = {
  href: '',
  search: '',
  hostname: 'localhost'
}

// Mock console methods
const consoleMock = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
}

describe('CrossAppDataService', () => {
  let service: CrossAppDataService
  let mockWorkflowData: WorkflowCVData

  beforeAll(() => {
    // Setup global mocks
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })
    Object.defineProperty(console, 'log', { value: consoleMock.log })
    Object.defineProperty(console, 'error', { value: consoleMock.error })
    Object.defineProperty(console, 'warn', { value: consoleMock.warn })
  })

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    localStorageMock.clear()
    
    // Reset singleton instance
    ;(CrossAppDataService as any).instance = undefined
    
    // Create fresh service instance
    service = CrossAppDataService.getInstance()
    
    // Create mock workflow data
    mockWorkflowData = {
      id: 'test-cv-123',
      userId: 'test-user-456',
      title: 'Test CV',
      status: 'draft',
      score: 85,
      contact: {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        location: 'Test City',
        linkedin: 'linkedin.com/in/johndoe'
      },
      summary: {
        content: 'Test summary content'
      },
      experience: {
        items: [{
          id: 'exp1',
          title: 'Software Engineer',
          company: 'Test Company',
          location: 'Test City',
          startDate: '2022-01',
          endDate: '2024-01',
          current: false,
          bullets: ['Test bullet point']
        }]
      },
      skills: {
        items: ['JavaScript', 'TypeScript', 'React']
      },
      education: {
        items: [{
          id: 'edu1',
          degree: 'Computer Science',
          institution: 'Test University',
          location: 'Test City',
          graduationDate: '2022',
          description: 'Test description'
        }]
      },
      workflow: {
        currentStep: 'editing',
        stepsCompleted: ['upload', 'analysis'],
        lastActiveStep: 'editing',
        timeSpent: 0
      },
      metadata: {
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
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

  afterEach(() => {
    // Clean up timers
    vi.clearAllTimers()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = CrossAppDataService.getInstance()
      const instance2 = CrossAppDataService.getInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance1).toBeInstanceOf(CrossAppDataService)
    })

    it('should initialize cleanup timer on instantiation', () => {
      vi.useFakeTimers()
      const setIntervalSpy = vi.spyOn(global, 'setInterval')
      
      CrossAppDataService.getInstance()
      
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000)
      
      vi.useRealTimers()
    })
  })

  describe('storeCVData', () => {
    it('should store CV data successfully', () => {
      service.storeCVData('test-cv', 'test-user', mockWorkflowData, 'workspace')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'okbuddy_cv_transfer_test-cv',
        expect.stringContaining('"cvId":"test-cv"')
      )
      expect(consoleMock.log).toHaveBeenCalledWith(
        '✅ CV data stored for cross-app transfer: test-cv from workspace'
      )
    })

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded')
      })
      
      service.storeCVData('test-cv', 'test-user', mockWorkflowData, 'workspace')
      
      expect(consoleMock.error).toHaveBeenCalledWith(
        '❌ Failed to store CV data for transfer:',
        expect.any(Error)
      )
    })

    it('should store transfer data with correct structure', () => {
      const cvId = 'test-cv'
      const userId = 'test-user'
      const source = 'upload'
      
      service.storeCVData(cvId, userId, mockWorkflowData, source)
      
      const storedData = localStorageMock.setItem.mock.calls[0][1]
      const parsedData: CrossAppDataTransfer = JSON.parse(storedData)
      
      expect(parsedData).toMatchObject({
        cvId,
        userId,
        data: mockWorkflowData,
        source,
        ttl: 5 * 60 * 1000
      })
      expect(parsedData.timestamp).toBeCloseTo(Date.now(), -2)
    })
  })

  describe('getCVData', () => {
    it('should retrieve stored CV data successfully', () => {
      // Store data first
      service.storeCVData('test-cv', 'test-user', mockWorkflowData, 'workspace')
      
      // Retrieve data
      const retrievedData = service.getCVData('test-cv')
      
      expect(retrievedData).toEqual(mockWorkflowData)
      expect(consoleMock.log).toHaveBeenCalledWith(
        '✅ CV data retrieved from transfer: test-cv (source: workspace)'
      )
    })

    it('should return null for non-existent CV data', () => {
      const retrievedData = service.getCVData('non-existent-cv')
      
      expect(retrievedData).toBeNull()
      expect(consoleMock.log).toHaveBeenCalledWith(
        '⚠️ No transfer data found for CV: non-existent-cv'
      )
    })

    it('should return null and cleanup expired data', () => {
      // Mock expired timestamp
      const expiredTransferData: CrossAppDataTransfer = {
        cvId: 'test-cv',
        userId: 'test-user',
        data: mockWorkflowData,
        timestamp: Date.now() - (6 * 60 * 1000), // 6 minutes ago (expired)
        source: 'workspace',
        ttl: 5 * 60 * 1000
      }
      
      localStorageMock.setItem(
        'okbuddy_cv_transfer_test-cv',
        JSON.stringify(expiredTransferData)
      )
      
      const retrievedData = service.getCVData('test-cv')
      
      expect(retrievedData).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('okbuddy_cv_transfer_test-cv')
      expect(consoleMock.log).toHaveBeenCalledWith(
        '⚠️ Transfer data expired for CV: test-cv'
      )
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.setItem('okbuddy_cv_transfer_test-cv', 'invalid-json')
      
      const retrievedData = service.getCVData('test-cv')
      
      expect(retrievedData).toBeNull()
      expect(consoleMock.error).toHaveBeenCalledWith(
        '❌ Failed to retrieve CV data from transfer:',
        expect.any(Error)
      )
    })

    it('should handle localStorage getItem errors', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage access denied')
      })
      
      const retrievedData = service.getCVData('test-cv')
      
      expect(retrievedData).toBeNull()
      expect(consoleMock.error).toHaveBeenCalledWith(
        '❌ Failed to retrieve CV data from transfer:',
        expect.any(Error)
      )
    })
  })

  describe('generateNavigationURL', () => {
    it('should generate correct URL for workspace', () => {
      const url = service.generateNavigationURL('workspace', 'test-cv', 'test-user')
      
      expect(url).toBe('http://localhost:3002/workspace?cvId=test-cv&userId=test-user')
    })

    it('should generate correct URL for upload', () => {
      const url = service.generateNavigationURL('upload', 'test-cv', 'test-user')
      
      expect(url).toBe('http://localhost:4000/?cvId=test-cv&userId=test-user')
    })

    it('should generate correct URL for editor', () => {
      const url = service.generateNavigationURL('editor', 'test-cv', 'test-user')
      
      expect(url).toBe('http://localhost:5173/?cvId=test-cv&userId=test-user')
    })

    it('should include additional parameters', () => {
      const additionalParams = { step: 'analysis', source: 'workspace' }
      const url = service.generateNavigationURL('editor', 'test-cv', 'test-user', additionalParams)
      
      expect(url).toContain('cvId=test-cv')
      expect(url).toContain('userId=test-user')
      expect(url).toContain('step=analysis')
      expect(url).toContain('source=workspace')
    })

    it('should handle special characters in parameters', () => {
      const cvId = 'cv with spaces & symbols'
      const userId = 'user@domain.com'
      const url = service.generateNavigationURL('editor', cvId, userId)
      
      expect(url).toContain('cvId=cv%20with%20spaces%20%26%20symbols')
      expect(url).toContain('userId=user%40domain.com')
    })
  })

  describe('navigateWithCVData', () => {
    it('should store data and navigate to target app', () => {
      const originalHref = mockLocation.href
      
      service.navigateWithCVData('workspace', mockWorkflowData)
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
      expect(mockLocation.href).toBe(
        'http://localhost:3002/workspace?cvId=test-cv-123&userId=test-user-456'
      )
      expect(consoleMock.log).toHaveBeenCalledWith(
        '🔄 Navigating to workspace: http://localhost:3002/workspace?cvId=test-cv-123&userId=test-user-456'
      )
      
      // Restore original href
      mockLocation.href = originalHref
    })

    it('should handle navigation errors gracefully', () => {
      const originalHref = mockLocation.href
      
      // Mock error in storeCVData
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })
      
      service.navigateWithCVData('workspace', mockWorkflowData)
      
      expect(consoleMock.error).toHaveBeenCalledWith(
        '❌ Failed to store CV data for transfer:',
        expect.any(Error)
      )
      
      // Restore original href
      mockLocation.href = originalHref
    })

    it('should include additional parameters in navigation', () => {
      const originalHref = mockLocation.href
      const additionalParams = { returnUrl: '/dashboard' }
      
      service.navigateWithCVData('editor', mockWorkflowData, additionalParams)
      
      expect(mockLocation.href).toContain('returnUrl=%2Fdashboard')
      
      // Restore original href
      mockLocation.href = originalHref
    })
  })

  describe('getURLParams', () => {
    it('should extract cvId and userId from URL', () => {
      mockLocation.search = '?cvId=test-cv&userId=test-user&other=param'
      
      const params = service.getURLParams()
      
      expect(params).toEqual({
        cvId: 'test-cv',
        userId: 'test-user'
      })
    })

    it('should return null for missing parameters', () => {
      mockLocation.search = '?other=param'
      
      const params = service.getURLParams()
      
      expect(params).toEqual({
        cvId: null,
        userId: null
      })
    })

    it('should handle empty search string', () => {
      mockLocation.search = ''
      
      const params = service.getURLParams()
      
      expect(params).toEqual({
        cvId: null,
        userId: null
      })
    })

    it('should handle URL-encoded parameters', () => {
      mockLocation.search = '?cvId=cv%20with%20spaces&userId=user%40domain.com'
      
      const params = service.getURLParams()
      
      expect(params).toEqual({
        cvId: 'cv with spaces',
        userId: 'user@domain.com'
      })
    })
  })

  describe('convertWorkflowToCVData', () => {
    it('should convert WorkflowCVData to CVData format', () => {
      const cvData = service.convertWorkflowToCVData(mockWorkflowData)
      
      expect(cvData).toMatchObject({
        sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
        sectionTitles: {},
        contact: mockWorkflowData.contact,
        summary: mockWorkflowData.summary,
        experience: mockWorkflowData.experience,
        skills: mockWorkflowData.skills,
        education: {
          items: expect.arrayContaining([
            expect.objectContaining({
              description: 'Test description'
            })
          ])
        }
      })
    })

    it('should handle missing optional fields', () => {
      const incompleteData = {
        ...mockWorkflowData,
        contact: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '',
          location: '',
          linkedin: undefined
        },
        sectionOrder: undefined,
        sectionTitles: undefined,
        education: {
          items: [{
            id: 'edu1',
            degree: 'CS',
            institution: 'University',
            location: 'City',
            graduationDate: '2022'
            // description is missing
          }]
        }
      } as WorkflowCVData
      
      const cvData = service.convertWorkflowToCVData(incompleteData)
      
      expect(cvData.sectionOrder).toEqual(['contact', 'summary', 'experience', 'skills', 'education'])
      expect(cvData.sectionTitles).toEqual({})
      expect(cvData.contact.linkedin).toBe('')
      expect(cvData.education.items[0].description).toBe('')
    })

    it('should handle empty arrays and objects', () => {
      const emptyData = {
        ...mockWorkflowData,
        experience: { items: [] },
        skills: { items: [] },
        education: { items: [] }
      }
      
      const cvData = service.convertWorkflowToCVData(emptyData)
      
      expect(cvData.experience.items).toEqual([])
      expect(cvData.skills.items).toEqual([])
      expect(cvData.education.items).toEqual([])
    })
  })

  describe('convertCVDataToWorkflow', () => {
    it('should convert CVData back to WorkflowCVData format', () => {
      const cvData = service.convertWorkflowToCVData(mockWorkflowData)
      const convertedBack = service.convertCVDataToWorkflow(cvData, mockWorkflowData)
      
      expect(convertedBack).toMatchObject({
        ...mockWorkflowData,
        metadata: expect.objectContaining({
          version: mockWorkflowData.metadata.version + 1,
          updatedAt: expect.any(String)
        })
      })
    })

    it('should preserve workflow-specific fields', () => {
      const cvData = service.convertWorkflowToCVData(mockWorkflowData)
      const convertedBack = service.convertCVDataToWorkflow(cvData, mockWorkflowData)
      
      expect(convertedBack.id).toBe(mockWorkflowData.id)
      expect(convertedBack.userId).toBe(mockWorkflowData.userId)
      expect(convertedBack.status).toBe(mockWorkflowData.status)
      expect(convertedBack.workflow).toEqual(mockWorkflowData.workflow)
      expect(convertedBack.settings).toEqual(mockWorkflowData.settings)
    })

    it('should update metadata correctly', () => {
      const cvData = service.convertWorkflowToCVData(mockWorkflowData)
      const beforeVersion = mockWorkflowData.metadata.version
      const beforeUpdatedAt = mockWorkflowData.metadata.updatedAt
      
      const convertedBack = service.convertCVDataToWorkflow(cvData, mockWorkflowData)
      
      expect(convertedBack.metadata.version).toBe(beforeVersion + 1)
      expect(convertedBack.metadata.updatedAt).not.toBe(beforeUpdatedAt)
      expect(new Date(convertedBack.metadata.updatedAt).getTime()).toBeCloseTo(Date.now(), -2)
    })
  })

  describe('createMockCVData', () => {
    it('should create valid mock CV data', () => {
      const mockData = service.createMockCVData('test-cv', 'test-user')
      
      expect(mockData).toMatchObject({
        id: 'test-cv',
        userId: 'test-user',
        title: 'Sample CV',
        status: 'draft',
        score: 75,
        contact: expect.objectContaining({
          fullName: expect.any(String),
          email: expect.any(String)
        }),
        workflow: expect.objectContaining({
          currentStep: 'editing',
          stepsCompleted: ['upload', 'analysis']
        }),
        metadata: expect.objectContaining({
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          version: 1,
          source: 'upload'
        }),
        settings: expect.objectContaining({
          autoSave: true,
          aiAssistance: true,
          template: 'dennis-schroder',
          language: 'vi'
        })
      })
    })

    it('should create data with current timestamps', () => {
      const beforeTime = Date.now()
      const mockData = service.createMockCVData('test-cv', 'test-user')
      const afterTime = Date.now()
      
      const createdTime = new Date(mockData.metadata.createdAt).getTime()
      const updatedTime = new Date(mockData.metadata.updatedAt).getTime()
      
      expect(createdTime).toBeGreaterThanOrEqual(beforeTime)
      expect(createdTime).toBeLessThanOrEqual(afterTime)
      expect(updatedTime).toBeGreaterThanOrEqual(beforeTime)
      expect(updatedTime).toBeLessThanOrEqual(afterTime)
    })

    it('should create unique data for different IDs', () => {
      const mockData1 = service.createMockCVData('cv-1', 'user-1')
      const mockData2 = service.createMockCVData('cv-2', 'user-2')
      
      expect(mockData1.id).toBe('cv-1')
      expect(mockData2.id).toBe('cv-2')
      expect(mockData1.userId).toBe('user-1')
      expect(mockData2.userId).toBe('user-2')
    })
  })

  describe('Data Cleanup', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should clean up expired data automatically', () => {
      // Store expired data
      const expiredData: CrossAppDataTransfer = {
        cvId: 'expired-cv',
        userId: 'test-user',
        data: mockWorkflowData,
        timestamp: Date.now() - (6 * 60 * 1000), // 6 minutes ago
        source: 'workspace',
        ttl: 5 * 60 * 1000
      }
      
      localStorageMock.setItem(
        'okbuddy_cv_transfer_expired-cv',
        JSON.stringify(expiredData)
      )
      
      // Store valid data
      service.storeCVData('valid-cv', 'test-user', mockWorkflowData, 'workspace')
      
      // Trigger cleanup
      vi.advanceTimersByTime(60000) // 1 minute
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('okbuddy_cv_transfer_expired-cv')
      expect(consoleMock.log).toHaveBeenCalledWith(
        '🧹 Cleaned up expired transfer data: okbuddy_cv_transfer_expired-cv'
      )
    })

    it('should handle cleanup errors gracefully', () => {
      // Mock localStorage.key to return invalid data
      localStorageMock.key.mockImplementationOnce(() => 'okbuddy_cv_transfer_invalid')
      localStorageMock.getItem.mockImplementationOnce(() => 'invalid-json')
      
      // Trigger cleanup
      vi.advanceTimersByTime(60000)
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('okbuddy_cv_transfer_invalid')
    })

    it('should not clean up valid data', () => {
      service.storeCVData('valid-cv', 'test-user', mockWorkflowData, 'workspace')
      
      // Trigger cleanup
      vi.advanceTimersByTime(60000)
      
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('okbuddy_cv_transfer_valid-cv')
    })

    it('should handle localStorage iteration errors', () => {
      localStorageMock.key.mockImplementationOnce(() => {
        throw new Error('Storage access error')
      })
      
      // Trigger cleanup - should not throw
      expect(() => {
        vi.advanceTimersByTime(60000)
      }).not.toThrow()
      
      expect(consoleMock.error).toHaveBeenCalledWith(
        '❌ Failed to cleanup expired data:',
        expect.any(Error)
      )
    })
  })

  describe('Manual Cleanup', () => {
    it('should manually trigger cleanup', () => {
      const cleanupSpy = vi.spyOn(service as any, 'cleanupExpiredData')
      
      service.cleanup()
      
      expect(cleanupSpy).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle extremely long CV IDs', () => {
      const longCvId = 'a'.repeat(1000)
      
      service.storeCVData(longCvId, 'test-user', mockWorkflowData, 'workspace')
      const retrievedData = service.getCVData(longCvId)
      
      expect(retrievedData).toEqual(mockWorkflowData)
    })

    it('should handle special characters in CV IDs', () => {
      const specialCvId = 'cv-with-特殊字符-émojis-🚀'
      
      service.storeCVData(specialCvId, 'test-user', mockWorkflowData, 'workspace')
      const retrievedData = service.getCVData(specialCvId)
      
      expect(retrievedData).toEqual(mockWorkflowData)
    })

    it('should handle null and undefined inputs gracefully', () => {
      expect(() => {
        service.getCVData('')
      }).not.toThrow()
      
      expect(() => {
        service.generateNavigationURL('editor', '', '')
      }).not.toThrow()
    })

    it('should handle localStorage quota exceeded', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })
      
      expect(() => {
        service.storeCVData('test-cv', 'test-user', mockWorkflowData, 'workspace')
      }).not.toThrow()
      
      expect(consoleMock.error).toHaveBeenCalledWith(
        '❌ Failed to store CV data for transfer:',
        expect.any(Error)
      )
    })
  })

  describe('Type Safety', () => {
    it('should enforce correct source types', () => {
      // This test ensures TypeScript compilation catches invalid source types
      expect(() => {
        service.storeCVData('test-cv', 'test-user', mockWorkflowData, 'workspace')
        service.storeCVData('test-cv', 'test-user', mockWorkflowData, 'upload')
        service.storeCVData('test-cv', 'test-user', mockWorkflowData, 'editor')
      }).not.toThrow()
    })

    it('should enforce correct app types for navigation', () => {
      expect(() => {
        service.generateNavigationURL('workspace', 'cv', 'user')
        service.generateNavigationURL('upload', 'cv', 'user')
        service.generateNavigationURL('editor', 'cv', 'user')
      }).not.toThrow()
    })
  })
}) 