/**
 * Authentication Caching System
 * Eliminates 15-20 second authentication delays for new users
 * Following OkBuddy tenets: performance-first, user experience priority
 */

interface UserSession {
  id: string
  email: string
  name: string
  provider: string
}

interface AuthCheckResult {
  isAuthenticated: boolean
  user: UserSession | null
  error?: string
}

interface AuthCacheEntry {
  result: AuthCheckResult
  timestamp: number
  ttl: number
}

// In-memory cache for authentication results
let authCache: Map<string, AuthCacheEntry> = new Map()

// Cache configuration
const DEFAULT_TTL = 30000 // 30 seconds
const GUEST_TTL = 60000   // 1 minute for guest sessions
const ERROR_TTL = 5000    // 5 seconds for errors (quick retry)

/**
 * Generate cache key based on request context
 */
function getCacheKey(): string {
  // For client-side, use a simple key since it's per-browser session
  if (typeof window !== 'undefined') {
    return 'client-auth'
  }
  
  // For server-side, we'd need request context, but we'll use a default for now
  return 'server-auth'
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: AuthCacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl
}

/**
 * Get cached authentication result if valid
 */
export function getCachedAuth(): AuthCheckResult | null {
  const cacheKey = getCacheKey()
  const entry = authCache.get(cacheKey)
  
  if (entry && isCacheValid(entry)) {
    console.log('🚀 Auth cache HIT - skipping network call')
    return entry.result
  }
  
  if (entry) {
    console.log('⏰ Auth cache EXPIRED - will refresh')
    authCache.delete(cacheKey)
  }
  
  return null
}

/**
 * Cache authentication result with appropriate TTL
 */
export function setCachedAuth(result: AuthCheckResult): void {
  const cacheKey = getCacheKey()
  
  // Determine TTL based on result type
  let ttl = DEFAULT_TTL
  if (result.error) {
    ttl = ERROR_TTL // Short cache for errors
  } else if (result.user?.id?.startsWith('guest-')) {
    ttl = GUEST_TTL // Longer cache for guest sessions
  }
  
  const entry: AuthCacheEntry = {
    result,
    timestamp: Date.now(),
    ttl
  }
  
  authCache.set(cacheKey, entry)
  console.log(`💾 Auth cached for ${ttl}ms - ${result.isAuthenticated ? 'authenticated' : 'guest'}`)
}

/**
 * Clear authentication cache (useful for logout)
 */
export function clearAuthCache(): void {
  authCache.clear()
  console.log('🧹 Auth cache cleared')
}

/**
 * Enhanced authentication check with caching
 * This replaces the original checkAuthentication function
 */
export async function checkAuthenticationCached(): Promise<AuthCheckResult> {
  // Try cache first
  const cached = getCachedAuth()
  if (cached) {
    return cached
  }
  
  console.log('🌐 Auth cache MISS - making network call')
  
  try {
    // Create AbortController for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // Reduced to 3 seconds
    
    try {
      // Make the actual authentication check
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      let result: AuthCheckResult
      
      if (response.ok) {
        const user = await response.json()
        result = {
          isAuthenticated: true,
          user: user
        }
      } else if (response.status === 401) {
        result = {
          isAuthenticated: false,
          user: null,
          error: 'Not authenticated'
        }
      } else {
        result = {
          isAuthenticated: false,
          user: null,
          error: 'Authentication check failed'
        }
      }
      
      // Cache the result
      setCachedAuth(result)
      return result
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // Handle abort/timeout specifically
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.warn('Authentication check timed out after 3 seconds')
        const result: AuthCheckResult = {
          isAuthenticated: false,
          user: null,
          error: 'Authentication check timed out'
        }
        
        // Cache timeout errors for short duration
        setCachedAuth(result)
        return result
      }
      
      throw fetchError
    }
  } catch (error) {
    console.error('Error checking authentication:', error)
    const result: AuthCheckResult = {
      isAuthenticated: false,
      user: null,
      error: 'Network error'
    }
    
    // Cache network errors for short duration
    setCachedAuth(result)
    return result
  }
}

/**
 * Non-blocking authentication check for UI components
 * Returns immediately with cached result or null, triggers background refresh
 */
export function checkAuthenticationNonBlocking(): AuthCheckResult | null {
  const startTime = Date.now()
  
  // Dispatch performance tracking event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-check-start'))
  }
  
  const cached = getCachedAuth()
  
  if (cached) {
    const duration = Date.now() - startTime
    console.log(`✅ Auth cache hit - returning cached result (${duration}ms)`)
    
    // Track cache hit performance
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-check-complete', { 
        detail: { duration, cached: true, result: 'hit' }
      }))
    }
    
    return cached
  }
  
  console.log('🔍 Auth cache miss - performing background check')
  
  // Trigger background authentication check without blocking
  checkAuthenticationCached().catch(error => {
    console.error('Background auth check failed:', error)
    
    // Track auth error
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-error', { 
        detail: { error: error.message, duration: Date.now() - startTime }
      }))
    }
  })
  
  // Track cache miss
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-check-complete', { 
      detail: { duration: Date.now() - startTime, cached: false, result: 'miss' }
    }))
  }
  
  // Return null immediately - UI should handle loading state
  return null
}

/**
 * Preload authentication for faster subsequent checks
 * Call this on app initialization
 */
export function preloadAuthentication(): void {
  if (typeof window !== 'undefined') {
    // Only preload on client side
    checkAuthenticationCached().catch(error => {
      console.error('Auth preload failed:', error)
    })
  }
}
