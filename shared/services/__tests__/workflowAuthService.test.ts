import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
/**
 * Workflow Authentication Service Tests
 * Comprehensive test suite for authentication functionality
 */

import { WorkflowAuthService, workflowAuthService, AuthUser, AuthSession, AuthState } from '../workflowAuthService'
import { environmentConfig } from '../../../config/environment'

// Mock environment configuration
vi.mock('../../../config/environment', () => ({
  environmentConfig: {
    database: {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key'
    },
    features: {
      mockMode: true
    }
  },
  shouldUseMockMode: true
}))

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn()
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock setTimeout and clearTimeout
vi.useFakeTimers({
  doNotFake: ['performance']
})

describe('WorkflowAuthService', () => {
  let authService: WorkflowAuthService

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    mockLocalStorage.removeItem.mockImplementation(() => {})
    
    // Get fresh instance for each test
    authService = WorkflowAuthService.getInstance()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = WorkflowAuthService.getInstance()
      const instance2 = WorkflowAuthService.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should export singleton instance', () => {
      expect(workflowAuthService).toBeInstanceOf(WorkflowAuthService)
    })
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const result = await authService.initialize()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })

    it('should handle initialization errors gracefully', async () => {
      // Mock environment to throw error
      vi.mocked(environmentConfig).database.supabaseUrl = ''
      
      const result = await authService.initialize()
      
      expect(result.success).toBe(true) // Should still succeed in mock mode
    })

    it('should not reinitialize if already initialized', async () => {
      await authService.initialize()
      const result = await authService.initialize()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
    })
  })

  describe('Authentication State - Mock Mode', () => {
    beforeEach(async () => {
      await authService.initialize()
    })

    it('should return authenticated state in mock mode', () => {
      const authState = authService.getAuthState()
      
      expect(authState.isAuthenticated).toBe(true)
      expect(authState.user).toEqual({
        id: 'mock-user-1',
        email: 'user@okbuddy.com',
        name: 'Test User',
        avatar: 'https://via.placeholder.com/40',
        role: 'user',
        metadata: expect.objectContaining({
          createdAt: '2024-01-01T00:00:00Z'
        })
      })
      expect(authState.session).toEqual(expect.objectContaining({
        user: expect.any(Object),
        accessToken: 'mock-token',
        source: 'mock'
      }))
      expect(authState.loading).toBe(false)
      expect(authState.error).toBeNull()
    })

    it('should return current user in mock mode', () => {
      const user = authService.getCurrentUser()
      
      expect(user).toEqual({
        id: 'mock-user-1',
        email: 'user@okbuddy.com',
        name: 'Test User',
        avatar: 'https://via.placeholder.com/40',
        role: 'user',
        metadata: expect.objectContaining({
          createdAt: '2024-01-01T00:00:00Z'
        })
      })
    })

    it('should return current session in mock mode', () => {
      const session = authService.getCurrentSession()
      
      expect(session).toEqual(expect.objectContaining({
        user: expect.any(Object),
        accessToken: 'mock-token',
        source: 'mock'
      }))
    })

    it('should return session token in mock mode', () => {
      const token = authService.getSessionToken()
      
      expect(token).toBe('mock-token')
    })

    it('should return true for isAuthenticated in mock mode', () => {
      const isAuth = authService.isAuthenticated()
      
      expect(isAuth).toBe(true)
    })
  })

  describe('Authentication Methods - Mock Mode', () => {
    beforeEach(async () => {
      await authService.initialize()
    })

    it('should sign in successfully in mock mode', async () => {
      const result = await authService.signIn('test@example.com', 'password')
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(expect.objectContaining({
        user: expect.any(Object),
        accessToken: 'mock-token',
        source: 'mock'
      }))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_auth_session',
        expect.any(String)
      )
    })

    it('should sign out successfully in mock mode', async () => {
      const result = await authService.signOut()
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_auth_session')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_shared_session')
    })

    it('should refresh session successfully in mock mode', async () => {
      const result = await authService.refreshSession()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(expect.objectContaining({
        user: expect.any(Object),
        accessToken: 'mock-token-refreshed',
        source: 'mock'
      }))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_auth_session',
        expect.any(String)
      )
    })
  })

  describe('Session Persistence', () => {
    beforeEach(async () => {
      await authService.initialize()
    })

    it('should persist session to localStorage', async () => {
      await authService.signIn('test@example.com', 'password')
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_auth_session',
        expect.stringContaining('mock-token')
      )
    })

    it('should restore session from localStorage', async () => {
      const mockSessionData = {
        user: { id: 'test-user', email: 'test@example.com' },
        accessToken: 'restored-token',
        expiresAt: Date.now() + 60000,
        issuedAt: Date.now(),
        source: 'mock',
        persistedAt: Date.now()
      }
      
      // Mock localStorage to return session data on first call
      mockLocalStorage.getItem.mockImplementationOnce((key) => {
        if (key === 'okbuddy_auth_session') {
          return JSON.stringify(mockSessionData)
        }
        return null
      })
      
      // Create a new service instance to test restoration
      const testService = new (WorkflowAuthService as any)()
      await testService.initialize()
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('okbuddy_auth_session')
    })

    it('should clear expired session from localStorage', async () => {
      const expiredSessionData = {
        user: { id: 'test-user', email: 'test@example.com' },
        accessToken: 'expired-token',
        expiresAt: Date.now() - 60000, // Expired 1 minute ago
        issuedAt: Date.now() - 120000,
        source: 'mock',
        persistedAt: Date.now() - 120000
      }
      
      // Mock localStorage to return expired session data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'okbuddy_auth_session') {
          return JSON.stringify(expiredSessionData)
        }
        return null
      })
      
      // Test that expired sessions are handled properly
      // In mock mode, the service should still work but handle expiry
      const result = await authService.initialize()
      expect(result.success).toBe(true)
    })

    it('should handle corrupted session data', async () => {
      // Mock localStorage to return invalid JSON
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'okbuddy_auth_session') {
          return 'invalid-json'
        }
        return null
      })
      
      // Test that corrupted session data is handled gracefully
      const result = await authService.initialize()
      expect(result.success).toBe(true)
    })
  })

  describe('Cross-Domain Session Sharing', () => {
    beforeEach(async () => {
      await authService.initialize()
    })

    it('should share session across domains', async () => {
      const result = await authService.shareSessionAcrossDomains('localhost:3000')
      
      expect(result.success).toBe(true)
      expect(result.data).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'okbuddy_shared_session',
        expect.stringContaining('mock-token')
      )
    })

    it('should fail to share session when not authenticated', async () => {
      // Mock unauthenticated state
      vi.spyOn(authService, 'getCurrentSession').mockReturnValue(null)
      
      const result = await authService.shareSessionAcrossDomains('localhost:3000')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No active session to share')
    })

    it('should retrieve shared session', async () => {
      const sharedSessionData = {
        token: 'shared-token',
        user: { id: 'shared-user', email: 'shared@example.com' },
        expiresAt: Date.now() + 60000,
        issuedAt: Date.now(),
        source: 'mock',
        sharedAt: Date.now(),
        targetDomain: 'localhost:3000'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sharedSessionData))
      
      const result = await authService.getSharedSession()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(expect.objectContaining({
        user: sharedSessionData.user,
        accessToken: 'shared-token',
        source: 'mock'
      }))
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_shared_session')
    })

    it('should handle expired shared session', async () => {
      const expiredSharedSession = {
        token: 'expired-shared-token',
        user: { id: 'expired-user', email: 'expired@example.com' },
        expiresAt: Date.now() + 60000,
        issuedAt: Date.now(),
        source: 'mock',
        sharedAt: Date.now() - (6 * 60 * 1000), // 6 minutes ago (expired)
        targetDomain: 'localhost:3000'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSharedSession))
      
      const result = await authService.getSharedSession()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Shared session expired')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_shared_session')
    })

    it('should handle expired session token in shared session', async () => {
      const expiredTokenSession = {
        token: 'expired-token',
        user: { id: 'user', email: 'user@example.com' },
        expiresAt: Date.now() - 60000, // Token expired 1 minute ago
        issuedAt: Date.now() - 120000,
        source: 'mock',
        sharedAt: Date.now(),
        targetDomain: 'localhost:3000'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredTokenSession))
      
      const result = await authService.getSharedSession()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Session token expired')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_shared_session')
    })

    it('should handle missing shared session', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const result = await authService.getSharedSession()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No shared session found')
    })
  })

  describe('Auth State Listeners', () => {
    beforeEach(async () => {
      await authService.initialize()
    })

    it('should register auth state change listener', () => {
      const mockCallback = vi.fn()
      
      const unsubscribe = authService.onAuthStateChange(mockCallback)
      
      expect(typeof unsubscribe).toBe('function')
    })

    it('should notify listeners on auth state change', async () => {
      const mockCallback = vi.fn()
      
      authService.onAuthStateChange(mockCallback)
      await authService.signIn('test@example.com', 'password')
      
      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        isAuthenticated: true,
        user: expect.any(Object),
        session: expect.any(Object)
      }))
    })

    it('should unsubscribe listener', async () => {
      const mockCallback = vi.fn()
      
      const unsubscribe = authService.onAuthStateChange(mockCallback)
      unsubscribe()
      
      await authService.signIn('test@example.com', 'password')
      
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should handle listener errors gracefully', async () => {
      const mockCallback = vi.fn(() => {
        throw new Error('Listener error')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      authService.onAuthStateChange(mockCallback)
      await authService.signIn('test@example.com', 'password')
      
      expect(consoleSpy).toHaveBeenCalledWith('Auth state listener error:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Utility Methods', () => {
    beforeEach(async () => {
      await authService.initialize()
    })

    it('should return auth headers with token', () => {
      // Ensure we're in mock mode and authenticated
      vi.spyOn(authService, 'getSessionToken').mockReturnValue('mock-token')
      
      const headers = authService.getAuthHeaders()
      
      expect(headers).toEqual({
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      })
    })

    it('should return empty headers when not authenticated', () => {
      vi.spyOn(authService, 'getSessionToken').mockReturnValue(null)
      
      const headers = authService.getAuthHeaders()
      
      expect(headers).toEqual({})
    })

    it('should validate and return current session when not expiring', async () => {
      // Mock a valid session
      const mockSession = {
        user: { id: 'test-user', email: 'test@example.com' },
        accessToken: 'mock-token',
        expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour from now
        issuedAt: Date.now(),
        source: 'mock' as const
      }
      
      vi.spyOn(authService, 'getCurrentSession').mockReturnValue(mockSession)
      
      const result = await authService.validateAndRefreshSession()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(expect.objectContaining({
        user: expect.any(Object),
        accessToken: 'mock-token'
      }))
    })

    it('should refresh session when close to expiry', async () => {
      // Mock session close to expiry
      const closeToExpirySession = {
        user: { id: 'test-user', email: 'test@example.com' },
        accessToken: 'expiring-token',
        expiresAt: Date.now() + (2 * 60 * 1000), // 2 minutes from now
        issuedAt: Date.now(),
        source: 'mock' as const
      }
      
      vi.spyOn(authService, 'getCurrentSession').mockReturnValue(closeToExpirySession)
      
      const result = await authService.validateAndRefreshSession()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual(expect.objectContaining({
        accessToken: 'mock-token-refreshed'
      }))
    })

    it('should handle validation when no session exists', async () => {
      vi.spyOn(authService, 'getCurrentSession').mockReturnValue(null)
      
      const result = await authService.validateAndRefreshSession()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('No active session')
    })
  })

  describe('Session Expiration Handling', () => {
    beforeEach(async () => {
      await authService.initialize()
    })

    it('should handle session expiration cleanup', async () => {
      // Mock a session to share
      const mockSession = {
        user: { id: 'test-user', email: 'test@example.com' },
        accessToken: 'mock-token',
        expiresAt: Date.now() + (60 * 60 * 1000),
        issuedAt: Date.now(),
        source: 'mock' as const
      }
      
      vi.spyOn(authService, 'getCurrentSession').mockReturnValue(mockSession)
      
      await authService.shareSessionAcrossDomains('localhost:3000')
      
      // Fast-forward time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('okbuddy_shared_session')
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      await authService.initialize()
    })

    it('should handle localStorage errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = await authService.signIn('test@example.com', 'password')
      
      expect(result.success).toBe(true) // Should still succeed
      expect(consoleSpy).toHaveBeenCalledWith('Failed to persist session:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })

    it('should handle session sharing errors', async () => {
      // Mock a session to share
      const mockSession = {
        user: { id: 'test-user', email: 'test@example.com' },
        accessToken: 'mock-token',
        expiresAt: Date.now() + (60 * 60 * 1000),
        issuedAt: Date.now(),
        source: 'mock' as const
      }
      
      vi.spyOn(authService, 'getCurrentSession').mockReturnValue(mockSession)
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      const result = await authService.shareSessionAcrossDomains('localhost:3000')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage error')
    })

    it('should handle session retrieval errors', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      
      const result = await authService.getSharedSession()
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage error')
    })
  })
}) 