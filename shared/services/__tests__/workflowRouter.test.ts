import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
/**
 * Workflow Router Service Tests
 * Comprehensive test coverage for navigation and state management
 * Following Tenet 5 - Rigorous testing with >90% coverage
 */

import { WorkflowRouter, workflowRouter } from '../workflowRouter'
import { WORKFLOW_ROUTES } from '../../types/workflow'

// Mock localStorage
const mockLocalStorage: {
  store: Record<string, string>
  getItem: vi.MockedFunction<(key: string) => string | null>
  setItem: vi.MockedFunction<(key: string, value: string) => void>
  removeItem: vi.MockedFunction<(key: string) => void>
  clear: vi.MockedFunction<() => void>
} = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string): string | null => mockLocalStorage.store[key] || null),
  setItem: vi.fn((key: string, value: string): void => {
    mockLocalStorage.store[key] = value
  }),
  removeItem: vi.fn((key: string): void => {
    delete mockLocalStorage.store[key]
  }),
  clear: vi.fn((): void => {
    mockLocalStorage.store = {}
  })
}

// Mock window object
const originalWindow = global.window
const mockWindow = {
  location: {
    href: 'http://localhost:3002'
  }
} as any

// Setup mocks
beforeEach(() => {
  // Clear localStorage mock
  mockLocalStorage.clear()
  mockLocalStorage.getItem.mockClear()
  mockLocalStorage.setItem.mockClear()
  mockLocalStorage.removeItem.mockClear()

  // Mock global localStorage
  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true
  })

  // Mock window if not already defined
  if (typeof global.window === 'undefined') {
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
      configurable: true
    })
  } else {
    // Update existing window object
    Object.assign(global.window, mockWindow)
  }

  // Mock setTimeout
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  // Restore original window if it existed
  if (originalWindow && originalWindow !== global.window) {
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true
    })
  }
})

describe('WorkflowRouter', () => {
  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = WorkflowRouter.getInstance()
      const instance2 = WorkflowRouter.getInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance1).toBe(workflowRouter)
    })
  })

  describe('Navigation Methods', () => {
    it('should navigate to workspace', async () => {
      const params = { userId: 'user-123' }
      const result = await workflowRouter.navigateToWorkspace(params)

      expect(result.success).toBe(true)
      expect(result.targetUrl).toBe('http://localhost:3002/workspace?userId=user-123')
      expect(result.data).toEqual(params)
    })

    it('should navigate to upload', async () => {
      const params = { cvId: 'cv-456', userId: 'user-123' }
      const result = await workflowRouter.navigateToUpload(params)

      expect(result.success).toBe(true)
      expect(result.targetUrl).toBe('http://localhost:4000/?cvId=cv-456&userId=user-123')
      expect(result.data).toEqual(params)
    })

    it('should navigate to loading screen', async () => {
      const params = { 
        cvId: 'cv-789',
        uploadedFile: {
          name: 'test.pdf',
          size: 1024,
          type: 'application/pdf',
          url: 'blob:test'
        }
      }
      const result = await workflowRouter.navigateToLoading(params)

      expect(result.success).toBe(true)
      expect(result.targetUrl).toBe('http://localhost:4000/loading?cvId=cv-789')
      expect(result.data).toEqual(params)
    })

    it('should navigate to editor', async () => {
      const params = { 
        cvId: 'cv-101',
        analysisResults: {
          suggestions: ['Improve summary'],
          score: 85,
          keywords: ['javascript', 'react']
        }
      }
      const result = await workflowRouter.navigateToEditor(params)

      expect(result.success).toBe(true)
      expect(result.targetUrl).toBe('http://localhost:5173/?cvId=cv-101')
      expect(result.data).toEqual(params)
    })

    it('should handle navigation without parameters', async () => {
      const result = await workflowRouter.navigateToWorkspace()

      expect(result.success).toBe(true)
      expect(result.targetUrl).toBe('http://localhost:3001/workspace')
      expect(result.data).toBeUndefined()
    })
  })

  describe('URL Building', () => {
    it('should build URL with job description flag', async () => {
      const params = { 
        cvId: 'cv-123',
        jobDescription: 'Software engineer position...'
      }
      const result = await workflowRouter.navigateToUpload(params)

      expect(result.targetUrl).toBe('http://localhost:3000/?cvId=cv-123&jd=true')
    })

    it('should build URL without query parameters when no params provided', async () => {
      const result = await workflowRouter.navigateToWorkspace()

      expect(result.targetUrl).toBe('http://localhost:3001/workspace')
    })

    it('should handle multiple parameters correctly', async () => {
      const params = { 
        cvId: 'cv-456',
        userId: 'user-789',
        jobDescription: 'Test job'
      }
      const result = await workflowRouter.navigateToEditor(params)

      expect(result.targetUrl).toBe('http://localhost:5173/?cvId=cv-456&userId=user-789&jd=true')
    })
  })

  describe('Data Persistence', () => {
    it('should persist navigation data to localStorage', async () => {
      const params = { cvId: 'cv-123', userId: 'user-456' }
      
      await workflowRouter.navigateToUpload(params)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_workflow_data',
        expect.stringContaining('"cvId":"cv-123"')
      )
    })

    it('should retrieve persisted navigation data', () => {
      const testData = {
        cvId: 'cv-789',
        userId: 'user-101',
        timestamp: Date.now(),
        source: 'http://localhost:3001'
      }

      mockLocalStorage.store['okbuddy_workflow_data'] = JSON.stringify(testData)

      const result = workflowRouter.getNavigationData()

      expect(result).toEqual(testData)
    })

    it('should return null for expired navigation data', () => {
      const expiredData = {
        cvId: 'cv-old',
        timestamp: Date.now() - (6 * 60 * 1000) // 6 minutes ago
      }

      mockLocalStorage.store['okbuddy_workflow_data'] = JSON.stringify(expiredData)

      const result = workflowRouter.getNavigationData()

      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_workflow_data')
    })

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.store['okbuddy_workflow_data'] = 'invalid-json'

      const result = workflowRouter.getNavigationData()

      expect(result).toBeNull()
    })

    it('should clear navigation data', () => {
      mockLocalStorage.store['okbuddy_workflow_data'] = '{"test": "data"}'

      workflowRouter.clearNavigationData()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_workflow_data')
    })
  })

  describe('Navigation History', () => {
    it('should store navigation history', async () => {
      await workflowRouter.navigateToWorkspace()

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_nav_history',
        expect.stringContaining(mockWindow.location.href)
      )
    })

    it('should get previous URL from history', () => {
      const history = [
        { url: 'http://localhost:3001/workspace', timestamp: Date.now() - 1000 },
        { url: 'http://localhost:3000/', timestamp: Date.now() }
      ]

      mockLocalStorage.store['okbuddy_nav_history'] = JSON.stringify(history)

      const previousUrl = workflowRouter.getPreviousUrl()

      expect(previousUrl).toBe('http://localhost:3001/workspace')
    })

    it('should return null when no previous URL available', () => {
      const history = [
        { url: 'http://localhost:3001/workspace', timestamp: Date.now() }
      ]

      mockLocalStorage.store['okbuddy_nav_history'] = JSON.stringify(history)

      const previousUrl = workflowRouter.getPreviousUrl()

      expect(previousUrl).toBeNull()
    })

    it('should handle corrupted history data gracefully', () => {
      mockLocalStorage.store['okbuddy_nav_history'] = 'invalid-json'

      const previousUrl = workflowRouter.getPreviousUrl()

      expect(previousUrl).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid route keys', async () => {
      // Access private navigate method through type assertion
      const router = workflowRouter as any
      const result = await router.navigate('invalid-route')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid route: invalid-route')
    })

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const result = await workflowRouter.navigateToWorkspace({ userId: 'test' })

      // Navigation should still succeed even if localStorage fails
      expect(result.success).toBe(true)
    })
  })

  describe('Server-Side Rendering', () => {
    it('should handle navigation when window is undefined', async () => {
      // Mock server environment
      const tempWindow = global.window
      delete (global as any).window

      const result = await workflowRouter.navigateToWorkspace()

      expect(result.success).toBe(true)
      expect(result.targetUrl).toBe('http://localhost:3001/workspace')

      // Restore window for other tests
      Object.defineProperty(global, 'window', {
        value: tempWindow,
        writable: true,
        configurable: true
      })
    })
  })

  describe('Route Configuration', () => {
    it('should have correct route configurations', () => {
      expect(WORKFLOW_ROUTES.workspace).toEqual({
        component: 'workspace',
        path: '/workspace',
        baseUrl: 'http://localhost:3001'
      })

      expect(WORKFLOW_ROUTES.upload).toEqual({
        component: 'upload',
        path: '/',
        baseUrl: 'http://localhost:3000'
      })

      expect(WORKFLOW_ROUTES.editor).toEqual({
        component: 'editor',
        path: '/',
        baseUrl: 'http://localhost:5173'
      })

      expect(WORKFLOW_ROUTES.loading).toEqual({
        component: 'upload',
        path: '/loading',
        baseUrl: 'http://localhost:3000'
      })
    })
  })
}) 