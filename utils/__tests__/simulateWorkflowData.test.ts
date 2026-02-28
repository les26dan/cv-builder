import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
/**
 * Simulate Workflow Data Utility Tests
 * Testing workflow simulation functions for development and testing
 */

import { 
  simulateWorkspaceNavigation, 
  simulateUploadCompletion, 
  injectTestData 
} from '../simulateWorkflowData'
import { CrossAppDataService } from '../../shared/services/crossAppDataService'

// Mock CrossAppDataService
vi.mock('../../shared/services/crossAppDataService')

const mockCrossAppDataService = {
  createMockCVData: vi.fn(),
  storeCVData: vi.fn(),
  generateNavigationURL: vi.fn(),
  getInstance: vi.fn()
}

;(CrossAppDataService.getInstance as vi.Mock).mockReturnValue(mockCrossAppDataService)

// Mock window.location
const mockLocation = {
  href: '',
  hostname: 'localhost'
}

// Mock console
const mockConsole = {
  log: vi.fn(),
  error: vi.fn()
}

describe('Simulate Workflow Data Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })
    Object.defineProperty(console, 'log', { value: mockConsole.log })
    Object.defineProperty(console, 'error', { value: mockConsole.error })
    mockLocation.href = ''
    mockLocation.hostname = 'localhost'
  })

  describe('simulateWorkspaceNavigation', () => {
    const mockCVData = {
      id: 'test-cv',
      userId: 'mock-user-1',
      title: 'Test CV',
      status: 'draft' as const,
      score: 75,
      contact: { fullName: 'Test User', email: 'test@example.com', phone: '', location: '', linkedin: '' },
      summary: { content: 'Test summary' },
      experience: { items: [] },
      skills: { items: [] },
      education: { items: [] },
      workflow: {
        currentStep: 'editing' as const,
        stepsCompleted: ['upload', 'analysis'],
        lastActiveStep: 'editing',
        timeSpent: 0
      },
      metadata: {
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
        source: 'upload' as const
      },
      settings: {
        autoSave: true,
        aiAssistance: true,
        template: 'dennis-schroder',
        language: 'vi' as const
      }
    }

    beforeEach(() => {
      mockCrossAppDataService.createMockCVData.mockReturnValue(mockCVData)
      mockCrossAppDataService.generateNavigationURL.mockReturnValue('http://localhost:5173/?cvId=test-cv&userId=mock-user-1')
    })

    it('should create mock CV data for workspace simulation', () => {
      simulateWorkspaceNavigation()

      expect(mockCrossAppDataService.createMockCVData).toHaveBeenCalledWith(
        expect.stringMatching(/^cv_\d+_workspace$/),
        'mock-user-1'
      )
    })

    it('should store CV data with workspace source', () => {
      simulateWorkspaceNavigation()

      expect(mockCrossAppDataService.storeCVData).toHaveBeenCalledWith(
        expect.stringMatching(/^cv_\d+_workspace$/),
        'mock-user-1',
        mockCVData,
        'workspace'
      )
    })

    it('should generate navigation URL for editor', () => {
      simulateWorkspaceNavigation()

      expect(mockCrossAppDataService.generateNavigationURL).toHaveBeenCalledWith(
        'editor',
        expect.stringMatching(/^cv_\d+_workspace$/),
        'mock-user-1'
      )
    })

    it('should navigate to generated URL', () => {
      simulateWorkspaceNavigation()

      expect(mockLocation.href).toBe('http://localhost:5173/?cvId=test-cv&userId=mock-user-1')
    })

    it('should log navigation action', () => {
      simulateWorkspaceNavigation()

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔄 Simulating workspace navigation to:',
        'http://localhost:5173/?cvId=test-cv&userId=mock-user-1'
      )
    })

    it('should generate unique CV IDs on multiple calls', () => {
      simulateWorkspaceNavigation()
      const firstCall = mockCrossAppDataService.createMockCVData.mock.calls[0][0]

      vi.clearAllMocks()
      mockCrossAppDataService.createMockCVData.mockReturnValue(mockCVData)
      mockCrossAppDataService.generateNavigationURL.mockReturnValue('http://localhost:5173/?cvId=test-cv&userId=mock-user-1')

      simulateWorkspaceNavigation()
      const secondCall = mockCrossAppDataService.createMockCVData.mock.calls[0][0]

      expect(firstCall).not.toBe(secondCall)
      expect(firstCall).toMatch(/^cv_\d+_workspace$/)
      expect(secondCall).toMatch(/^cv_\d+_workspace$/)
    })
  })

  describe('simulateUploadCompletion', () => {
    const mockCVData = {
      id: 'test-cv',
      userId: 'mock-user-1',
      title: 'Test CV',
      status: 'draft' as const,
      score: 75,
      contact: { fullName: 'Test User', email: 'test@example.com', phone: '', location: '', linkedin: '' },
      summary: { content: 'Test summary' },
      experience: { items: [] },
      skills: { items: [] },
      education: { items: [] },
      workflow: {
        currentStep: 'editing' as const,
        stepsCompleted: ['upload', 'analysis'],
        lastActiveStep: 'editing',
        timeSpent: 0
      },
      metadata: {
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
        source: 'upload' as const
      },
      settings: {
        autoSave: true,
        aiAssistance: true,
        template: 'dennis-schroder',
        language: 'vi' as const
      }
    }

    beforeEach(() => {
      mockCrossAppDataService.createMockCVData.mockReturnValue(mockCVData)
      mockCrossAppDataService.generateNavigationURL.mockReturnValue('http://localhost:5173/?cvId=test-cv&userId=mock-user-1')
    })

    it('should create mock CV data for upload simulation', () => {
      simulateUploadCompletion()

      expect(mockCrossAppDataService.createMockCVData).toHaveBeenCalledWith(
        expect.stringMatching(/^cv_\d+_upload$/),
        'mock-user-1'
      )
    })

    it('should store enhanced CV data with upload completion details', () => {
      simulateUploadCompletion()

      const storedData = mockCrossAppDataService.storeCVData.mock.calls[0][2]
      
      expect(storedData.status).toBe('completed')
      expect(storedData.workflow.currentStep).toBe('editing')
      expect(storedData.workflow.stepsCompleted).toEqual(['upload', 'analysis'])
      expect(storedData.uploadedFile).toMatchObject({
        name: 'sample-cv.pdf',
        size: 245760,
        type: 'application/pdf',
        url: 'mock-url',
        originalText: 'Sample CV content...'
      })
      expect(storedData.analysisResults).toMatchObject({
        score: 78,
        keywords: ['React', 'TypeScript', 'Node.js'],
        suggestions: expect.arrayContaining([
          expect.objectContaining({
            section: 'summary',
            recommendation: 'Add more industry-specific keywords',
            priority: 'high',
            implemented: false
          })
        ])
      })
    })

    it('should store CV data with upload source', () => {
      simulateUploadCompletion()

      expect(mockCrossAppDataService.storeCVData).toHaveBeenCalledWith(
        expect.stringMatching(/^cv_\d+_upload$/),
        'mock-user-1',
        expect.any(Object),
        'upload'
      )
    })

    it('should navigate to editor with upload completion URL', () => {
      simulateUploadCompletion()

      expect(mockLocation.href).toBe('http://localhost:5173/?cvId=test-cv&userId=mock-user-1')
    })

    it('should log upload completion action', () => {
      simulateUploadCompletion()

      expect(mockConsole.log).toHaveBeenCalledWith(
        '🔄 Simulating upload completion navigation to:',
        'http://localhost:5173/?cvId=test-cv&userId=mock-user-1'
      )
    })

    it('should include analysis results with proper structure', () => {
      simulateUploadCompletion()

      const storedData = mockCrossAppDataService.storeCVData.mock.calls[0][2]
      const analysisResults = storedData.analysisResults

      expect(analysisResults).toHaveProperty('suggestions')
      expect(analysisResults).toHaveProperty('score')
      expect(analysisResults).toHaveProperty('keywords')
      expect(analysisResults).toHaveProperty('improvements')
      
      expect(analysisResults.suggestions).toHaveLength(2)
      expect(analysisResults.improvements).toHaveLength(1)
      expect(analysisResults.keywords).toEqual(['React', 'TypeScript', 'Node.js'])
      expect(analysisResults.score).toBe(78)
    })

    it('should include proper uploaded file metadata', () => {
      simulateUploadCompletion()

      const storedData = mockCrossAppDataService.storeCVData.mock.calls[0][2]
      const uploadedFile = storedData.uploadedFile

      expect(uploadedFile).toMatchObject({
        name: 'sample-cv.pdf',
        size: 245760,
        type: 'application/pdf',
        url: 'mock-url',
        originalText: 'Sample CV content...'
      })
    })
  })

  describe('injectTestData', () => {
    const mockCVData = {
      id: 'test-cv',
      userId: 'mock-user-1',
      title: 'Test CV',
      status: 'draft' as const,
      score: 75,
      contact: { fullName: 'Test User', email: 'test@example.com', phone: '', location: '', linkedin: '' },
      summary: { content: 'Test summary' },
      experience: { items: [] },
      skills: { items: [] },
      education: { items: [] },
      workflow: {
        currentStep: 'editing' as const,
        stepsCompleted: ['upload', 'analysis'],
        lastActiveStep: 'editing',
        timeSpent: 0
      },
      metadata: {
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        version: 1,
        source: 'upload' as const
      },
      settings: {
        autoSave: true,
        aiAssistance: true,
        template: 'dennis-schroder',
        language: 'vi' as const
      }
    }

    beforeEach(() => {
      mockCrossAppDataService.createMockCVData.mockReturnValue(mockCVData)
      mockCrossAppDataService.generateNavigationURL.mockReturnValue('http://localhost:5173/?cvId=test-cv&userId=mock-user-1')
    })

    it('should inject multiple test CVs in development environment', () => {
      mockLocation.hostname = 'localhost'

      injectTestData()

      expect(mockCrossAppDataService.storeCVData).toHaveBeenCalledTimes(2)
      
      // Check marketing manager CV
      expect(mockCrossAppDataService.storeCVData).toHaveBeenCalledWith(
        'cv_marketing_manager',
        'mock-user-1',
        expect.objectContaining({
          title: 'CV Marketing Manager',
          contact: expect.objectContaining({
            fullName: 'Trần Thị B',
            email: 'tran.thi.b@email.com'
          })
        }),
        'workspace'
      )

      // Check software engineer CV
      expect(mockCrossAppDataService.storeCVData).toHaveBeenCalledWith(
        'cv_software_engineer',
        'mock-user-1',
        expect.objectContaining({
          title: 'CV Software Engineer',
          status: 'completed'
        }),
        'upload'
      )
    })

    it('should not inject data in non-development environment', () => {
      mockLocation.hostname = 'production.example.com'

      injectTestData()

      expect(mockCrossAppDataService.storeCVData).not.toHaveBeenCalled()
      expect(mockCrossAppDataService.createMockCVData).not.toHaveBeenCalled()
    })

    it('should log injection success and URLs', () => {
      mockLocation.hostname = 'localhost'

      injectTestData()

      expect(mockConsole.log).toHaveBeenCalledWith('📝 Injected test CV: CV Marketing Manager (cv_marketing_manager)')
      expect(mockConsole.log).toHaveBeenCalledWith('📝 Injected test CV: CV Software Engineer (cv_software_engineer)')
      expect(mockConsole.log).toHaveBeenCalledWith('✅ Test CV data injected. You can now test navigation with these URLs:')
    })

    it('should generate navigation URLs for test data', () => {
      mockLocation.hostname = 'localhost'

      injectTestData()

      expect(mockCrossAppDataService.generateNavigationURL).toHaveBeenCalledWith(
        'editor',
        'cv_marketing_manager',
        'mock-user-1'
      )
      expect(mockCrossAppDataService.generateNavigationURL).toHaveBeenCalledWith(
        'editor',
        'cv_software_engineer',
        'mock-user-1'
      )
    })

    it('should customize marketing manager CV data', () => {
      mockLocation.hostname = 'localhost'

      injectTestData()

      const marketingCV = mockCrossAppDataService.storeCVData.mock.calls[0][2]
      
      expect(marketingCV.title).toBe('CV Marketing Manager')
      expect(marketingCV.contact.fullName).toBe('Trần Thị B')
      expect(marketingCV.contact.email).toBe('tran.thi.b@email.com')
      expect(marketingCV.contact.phone).toBe('+84 987 654 321')
      expect(marketingCV.contact.location).toBe('Hà Nội, Việt Nam')
      expect(marketingCV.summary.content).toContain('Marketing professional')
    })

    it('should customize software engineer CV data', () => {
      mockLocation.hostname = 'localhost'

      injectTestData()

      const engineerCV = mockCrossAppDataService.storeCVData.mock.calls[1][2]
      
      expect(engineerCV.title).toBe('CV Software Engineer')
      expect(engineerCV.status).toBe('completed')
      expect(engineerCV.workflow.currentStep).toBe('editing')
      expect(engineerCV.workflow.stepsCompleted).toEqual(['upload', 'analysis'])
    })
  })

  describe('Global Function Availability', () => {
    beforeEach(() => {
      // Clear global functions
      delete (window as any).simulateWorkspaceNavigation
      delete (window as any).simulateUploadCompletion
      delete (window as any).injectTestData
    })

    it('should add global functions in localhost environment', () => {
      mockLocation.hostname = 'localhost'
      
      // Re-import to trigger global function assignment
      vi.resetModules()
      require('../simulateWorkflowData')

      expect((window as any).simulateWorkspaceNavigation).toBeDefined()
      expect((window as any).simulateUploadCompletion).toBeDefined()
      expect((window as any).injectTestData).toBeDefined()
      expect(typeof (window as any).simulateWorkspaceNavigation).toBe('function')
      expect(typeof (window as any).simulateUploadCompletion).toBe('function')
      expect(typeof (window as any).injectTestData).toBe('function')
    })

    it('should not add global functions in production environment', () => {
      mockLocation.hostname = 'production.example.com'
      
      // Re-import to trigger conditional global function assignment
      vi.resetModules()
      require('../simulateWorkflowData')

      // Functions should still be undefined in production
      expect((window as any).simulateWorkspaceNavigation).toBeUndefined()
      expect((window as any).simulateUploadCompletion).toBeUndefined()
      expect((window as any).injectTestData).toBeUndefined()
    })

    it('should log development utilities availability', () => {
      mockLocation.hostname = 'localhost'
      
      vi.resetModules()
      require('../simulateWorkflowData')

      expect(mockConsole.log).toHaveBeenCalledWith('🔧 Development utilities available:')
      expect(mockConsole.log).toHaveBeenCalledWith('   simulateWorkspaceNavigation() - Simulate clicking CV in workspace')
      expect(mockConsole.log).toHaveBeenCalledWith('   simulateUploadCompletion() - Simulate completing CV upload')
      expect(mockConsole.log).toHaveBeenCalledWith('   injectTestData() - Inject test CV data for manual testing')
    })
  })

  describe('Error Handling', () => {
    it('should handle CrossAppDataService errors in simulateWorkspaceNavigation', () => {
      mockCrossAppDataService.createMockCVData.mockImplementation(() => {
        throw new Error('Service error')
      })

      expect(() => simulateWorkspaceNavigation()).toThrow('Service error')
    })

    it('should handle CrossAppDataService errors in simulateUploadCompletion', () => {
      mockCrossAppDataService.storeCVData.mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => simulateUploadCompletion()).toThrow('Storage error')
    })

    it('should handle CrossAppDataService errors in injectTestData', () => {
      mockLocation.hostname = 'localhost'
      mockCrossAppDataService.createMockCVData.mockImplementation(() => {
        throw new Error('Mock data creation error')
      })

      expect(() => injectTestData()).toThrow('Mock data creation error')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing window object gracefully', () => {
      const originalWindow = global.window
      delete (global as any).window

      expect(() => {
        vi.resetModules()
        require('../simulateWorkflowData')
      }).not.toThrow()

      global.window = originalWindow
    })

    it('should handle undefined location hostname', () => {
      mockLocation.hostname = undefined as any

      expect(() => injectTestData()).not.toThrow()
      expect(mockCrossAppDataService.storeCVData).not.toHaveBeenCalled()
    })

    it('should work with different localhost variations', () => {
      const localhostVariations = ['localhost', '127.0.0.1', 'localhost:3000', '127.0.0.1:5173']
      
      localhostVariations.forEach(hostname => {
        vi.clearAllMocks()
        mockLocation.hostname = hostname
        
        injectTestData()
        
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
          expect(mockCrossAppDataService.storeCVData).toHaveBeenCalled()
        }
      })
    })
  })

  describe('Type Safety', () => {
    it('should ensure CV data has correct types', () => {
      mockLocation.hostname = 'localhost'
      
      injectTestData()

      const marketingCV = mockCrossAppDataService.storeCVData.mock.calls[0][2]
      const engineerCV = mockCrossAppDataService.storeCVData.mock.calls[1][2]

      // Check required properties exist and have correct types
      expect(typeof marketingCV.id).toBe('string')
      expect(typeof marketingCV.userId).toBe('string')
      expect(typeof marketingCV.title).toBe('string')
      expect(['draft', 'analyzing', 'completed']).toContain(marketingCV.status)
      expect(typeof marketingCV.score).toBe('number')

      expect(typeof engineerCV.id).toBe('string')
      expect(typeof engineerCV.userId).toBe('string')
      expect(typeof engineerCV.title).toBe('string')
      expect(['draft', 'analyzing', 'completed']).toContain(engineerCV.status)
      expect(typeof engineerCV.score).toBe('number')
    })

    it('should ensure source types are correct', () => {
      mockLocation.hostname = 'localhost'
      
      injectTestData()

      expect(mockCrossAppDataService.storeCVData).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        'workspace'
      )
      expect(mockCrossAppDataService.storeCVData).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        'upload'
      )
    })
  })
}) 