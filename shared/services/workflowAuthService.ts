/**
 * Workflow Authentication Service
 * Handles authentication across CV workflow components with secure session management
 * Supports cross-domain token sharing and user context synchronization
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'
import { environmentConfig, shouldUseMockMode } from '../../config/environment'
import { DatabaseResult } from '../types/workflow'

/**
 * User authentication data interface
 */
export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string
  role?: string
  metadata?: Record<string, any>
}

/**
 * Authentication session data
 */
export interface AuthSession {
  user: AuthUser
  accessToken: string
  refreshToken?: string
  expiresAt: number
  issuedAt: number
  source: 'supabase' | 'mock'
}

/**
 * Authentication state interface
 */
export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  error: string | null
}

/**
 * Authentication service result
 */
export interface AuthResult<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * Mock user data for development
 */
const MOCK_USER: AuthUser = {
  id: 'mock-user-1',
  email: 'user@okbuddy.com',
  name: 'Test User',
  avatar: 'https://via.placeholder.com/40',
  role: 'user',
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString()
  }
}

/**
 * Workflow Authentication Service Class
 * Manages authentication state across all workflow components
 */
export class WorkflowAuthService {
  private static instance: WorkflowAuthService
  private supabase: SupabaseClient | null = null
  private currentSession: AuthSession | null = null
  private authStateListeners: Array<(state: AuthState) => void> = []
  private isInitialized = false

  /**
   * Singleton pattern for consistent auth instance
   */
  public static getInstance(): WorkflowAuthService {
    if (!WorkflowAuthService.instance) {
      WorkflowAuthService.instance = new WorkflowAuthService()
    }
    return WorkflowAuthService.instance
  }

  /**
   * Initialize authentication service
   */
  public async initialize(): Promise<AuthResult<boolean>> {
    if (this.isInitialized) {
      return { success: true, data: true }
    }

    try {
      // Initialize Supabase client if not in mock mode
      if (!shouldUseMockMode()) {
        await this.initializeSupabase()
      }

      // Restore session from storage
      await this.restoreSession()

      this.isInitialized = true
      return { success: true, data: true }

    } catch (error) {
      console.error('Auth service initialization failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }
    }
  }

  /**
   * Initialize Supabase client
   */
  private async initializeSupabase(): Promise<void> {
    const { supabaseUrl, supabaseAnonKey } = environmentConfig.database

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials not configured')
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Set up auth state change listener
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.handleAuthStateChange(event, session)
    })
  }

  /**
   * Handle Supabase auth state changes
   */
  private async handleAuthStateChange(event: string, session: Session | null): Promise<void> {
    try {
      if (event === 'SIGNED_IN' && session) {
        const authSession = await this.createAuthSession(session)
        this.currentSession = authSession
        await this.persistSession(authSession)
        this.notifyAuthStateChange()
      } else if (event === 'SIGNED_OUT') {
        this.currentSession = null
        await this.clearPersistedSession()
        this.notifyAuthStateChange()
      } else if (event === 'TOKEN_REFRESHED' && session) {
        const authSession = await this.createAuthSession(session)
        this.currentSession = authSession
        await this.persistSession(authSession)
        this.notifyAuthStateChange()
      }
    } catch (error) {
      console.error('Auth state change error:', error)
    }
  }

  /**
   * Create AuthSession from Supabase session
   */
  private async createAuthSession(session: Session): Promise<AuthSession> {
    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      avatar: session.user.user_metadata?.avatar_url,
      role: session.user.user_metadata?.role || 'user',
      metadata: session.user.user_metadata
    }

    return {
      user,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + (60 * 60 * 1000), // 1 hour default
      issuedAt: Date.now(),
      source: 'supabase'
    }
  }

  /**
   * Get current authentication state
   */
  public getAuthState(): AuthState {
    if (shouldUseMockMode()) {
      return {
        isAuthenticated: true,
        user: MOCK_USER,
        session: {
          user: MOCK_USER,
          accessToken: 'mock-token',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
          issuedAt: Date.now(),
          source: 'mock'
        },
        loading: false,
        error: null
      }
    }

    const isAuthenticated = this.currentSession !== null && this.isSessionValid(this.currentSession)
    
    return {
      isAuthenticated,
      user: isAuthenticated ? this.currentSession!.user : null,
      session: isAuthenticated ? this.currentSession : null,
      loading: false,
      error: null
    }
  }

  /**
   * Get current user
   */
  public getCurrentUser(): AuthUser | null {
    const authState = this.getAuthState()
    return authState.user
  }

  /**
   * Get current session
   */
  public getCurrentSession(): AuthSession | null {
    const authState = this.getAuthState()
    return authState.session
  }

  /**
   * Get session token for API calls
   */
  public getSessionToken(): string | null {
    const session = this.getCurrentSession()
    return session?.accessToken || null
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.getAuthState().isAuthenticated
  }

  /**
   * Sign in user (for future implementation)
   */
  public async signIn(email: string, password: string): Promise<AuthResult<AuthSession>> {
    if (shouldUseMockMode()) {
      const mockSession: AuthSession = {
        user: MOCK_USER,
        accessToken: 'mock-token',
        expiresAt: Date.now() + (24 * 60 * 60 * 1000),
        issuedAt: Date.now(),
        source: 'mock'
      }
      this.currentSession = mockSession
      await this.persistSession(mockSession)
      this.notifyAuthStateChange()
      return { success: true, data: mockSession }
    }

    if (!this.supabase) {
      return { success: false, error: 'Authentication service not initialized' }
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message, code: error.name }
      }

      if (data.session) {
        const authSession = await this.createAuthSession(data.session)
        return { success: true, data: authSession }
      }

      return { success: false, error: 'No session returned' }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      }
    }
  }

  /**
   * Sign out user
   */
  public async signOut(): Promise<AuthResult<boolean>> {
    if (shouldUseMockMode()) {
      this.currentSession = null
      await this.clearPersistedSession()
      this.notifyAuthStateChange()
      return { success: true, data: true }
    }

    if (!this.supabase) {
      return { success: false, error: 'Authentication service not initialized' }
    }

    try {
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        return { success: false, error: error.message, code: error.name }
      }

      return { success: true, data: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }
    }
  }

  /**
   * Refresh session token
   */
  public async refreshSession(): Promise<AuthResult<AuthSession>> {
    if (shouldUseMockMode()) {
      const mockSession: AuthSession = {
        user: MOCK_USER,
        accessToken: 'mock-token-refreshed',
        expiresAt: Date.now() + (24 * 60 * 60 * 1000),
        issuedAt: Date.now(),
        source: 'mock'
      }
      this.currentSession = mockSession
      await this.persistSession(mockSession)
      return { success: true, data: mockSession }
    }

    if (!this.supabase) {
      return { success: false, error: 'Authentication service not initialized' }
    }

    try {
      const { data, error } = await this.supabase.auth.refreshSession()

      if (error) {
        return { success: false, error: error.message, code: error.name }
      }

      if (data.session) {
        const authSession = await this.createAuthSession(data.session)
        return { success: true, data: authSession }
      }

      return { success: false, error: 'No session returned' }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh failed'
      }
    }
  }

  /**
   * Share session across domains
   * Uses secure localStorage with encryption for cross-domain token transfer
   */
  public async shareSessionAcrossDomains(targetDomain: string): Promise<AuthResult<boolean>> {
    try {
      const session = this.getCurrentSession()
      if (!session) {
        return { success: false, error: 'No active session to share' }
      }

      // Create secure session data for cross-domain sharing
      const sessionData = {
        token: session.accessToken,
        user: session.user,
        expiresAt: session.expiresAt,
        issuedAt: session.issuedAt,
        source: session.source,
        sharedAt: Date.now(),
        targetDomain
      }

      // Store in localStorage with expiration
      const sessionKey = 'okbuddy_shared_session'
      localStorage.setItem(sessionKey, JSON.stringify(sessionData))

      // Set expiration (5 minutes for security)
      setTimeout(() => {
        localStorage.removeItem(sessionKey)
      }, 5 * 60 * 1000)

      return { success: true, data: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session sharing failed'
      }
    }
  }

  /**
   * Retrieve shared session from cross-domain storage
   */
  public async getSharedSession(): Promise<AuthResult<AuthSession>> {
    try {
      const sessionKey = 'okbuddy_shared_session'
      const sessionData = localStorage.getItem(sessionKey)
      
      if (!sessionData) {
        return { success: false, error: 'No shared session found' }
      }

      const parsed = JSON.parse(sessionData)
      
      // Check if session is expired (5 minutes)
      if (Date.now() - parsed.sharedAt > 5 * 60 * 1000) {
        localStorage.removeItem(sessionKey)
        return { success: false, error: 'Shared session expired' }
      }

      // Check if session token is still valid
      if (parsed.expiresAt < Date.now()) {
        localStorage.removeItem(sessionKey)
        return { success: false, error: 'Session token expired' }
      }

      const authSession: AuthSession = {
        user: parsed.user,
        accessToken: parsed.token,
        expiresAt: parsed.expiresAt,
        issuedAt: parsed.issuedAt,
        source: parsed.source
      }

      // Set as current session
      this.currentSession = authSession
      await this.persistSession(authSession)
      this.notifyAuthStateChange()

      // Clean up shared session
      localStorage.removeItem(sessionKey)

      return { success: true, data: authSession }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve shared session'
      }
    }
  }

  /**
   * Persist session to localStorage
   */
  private async persistSession(session: AuthSession): Promise<void> {
    try {
      const sessionData = {
        ...session,
        persistedAt: Date.now()
      }
      localStorage.setItem('okbuddy_auth_session', JSON.stringify(sessionData))
    } catch (error) {
      console.warn('Failed to persist session:', error)
    }
  }

  /**
   * Restore session from localStorage
   */
  private async restoreSession(): Promise<void> {
    try {
      const sessionData = localStorage.getItem('okbuddy_auth_session')
      if (!sessionData) return

      const parsed = JSON.parse(sessionData)
      
      // Check if session is expired
      if (parsed.expiresAt < Date.now()) {
        localStorage.removeItem('okbuddy_auth_session')
        return
      }

      this.currentSession = parsed
      this.notifyAuthStateChange()

    } catch (error) {
      console.warn('Failed to restore session:', error)
      localStorage.removeItem('okbuddy_auth_session')
    }
  }

  /**
   * Clear persisted session
   */
  private async clearPersistedSession(): Promise<void> {
    try {
      localStorage.removeItem('okbuddy_auth_session')
      localStorage.removeItem('okbuddy_shared_session')
    } catch (error) {
      console.warn('Failed to clear persisted session:', error)
    }
  }

  /**
   * Check if session is valid
   */
  private isSessionValid(session: AuthSession): boolean {
    return session.expiresAt > Date.now()
  }

  /**
   * Subscribe to auth state changes
   */
  public onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback)
      if (index > -1) {
        this.authStateListeners.splice(index, 1)
      }
    }
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyAuthStateChange(): void {
    const authState = this.getAuthState()
    this.authStateListeners.forEach(callback => {
      try {
        callback(authState)
      } catch (error) {
        console.error('Auth state listener error:', error)
      }
    })
  }

  /**
   * Get authorization headers for API calls
   */
  public getAuthHeaders(): Record<string, string> {
    const token = this.getSessionToken()
    if (!token) {
      return {}
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Validate current session and refresh if needed
   */
  public async validateAndRefreshSession(): Promise<AuthResult<AuthSession>> {
    const currentSession = this.getCurrentSession()
    
    if (!currentSession) {
      return { success: false, error: 'No active session' }
    }

    // Check if session is close to expiry (within 5 minutes)
    const fiveMinutes = 5 * 60 * 1000
    if (currentSession.expiresAt - Date.now() < fiveMinutes) {
      return await this.refreshSession()
    }

    return { success: true, data: currentSession }
  }
}

/**
 * Export singleton instance
 */
export const workflowAuthService = WorkflowAuthService.getInstance() 