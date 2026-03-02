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

/**
 * Check if user is authenticated by reading from server-side session
 * This should be used in server components or API routes
 */
export async function getServerSession(): Promise<UserSession | null> {
  try {
    // In server components, we can't directly access cookies
    // This will be handled by middleware and passed via headers
    return null
  } catch (error) {
    console.error('Error getting server session:', error)
    return null
  }
}

/**
 * Check authentication status on client side with timeout handling
 * This reads from the cookies set by the server
 */
export async function checkAuthentication(): Promise<AuthCheckResult> {
  try {
    // Create AbortController for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      // Try to get user info from a secure API endpoint with timeout
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const user = await response.json()
        return {
          isAuthenticated: true,
          user: user
        }
      } else if (response.status === 401) {
        return {
          isAuthenticated: false,
          user: null,
          error: 'Not authenticated'
        }
      } else {
        return {
          isAuthenticated: false,
          user: null,
          error: 'Authentication check failed'
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // Handle abort/timeout specifically
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.warn('Authentication check timed out')
        return {
          isAuthenticated: false,
          user: null,
          error: 'Authentication check timed out'
        }
      }
      
      throw fetchError // Re-throw for outer catch
    }
  } catch (error) {
    console.error('Error checking authentication:', error)
    return {
      isAuthenticated: false,
      user: null,
      error: 'Network error'
    }
  }
}

/**
 * Logout user by clearing session
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    
    // Redirect to login page
    window.location.href = '/login'
  } catch (error) {
    console.error('Error during logout:', error)
    // Force redirect even if API call fails
    window.location.href = '/login'
  }
}

/**
 * Get user session from client side (for components that need user info)
 * This is a lightweight check that doesn't hit the server
 */
export function getUserFromHeaders(): UserSession | null {
  try {
    // In client-side components, we can check if the middleware set user headers
    // This is not the primary authentication method, just for convenience
    const userId = document.querySelector('meta[name="x-user-id"]')?.getAttribute('content')
    const userEmail = document.querySelector('meta[name="x-user-email"]')?.getAttribute('content')
    
    if (userId && userEmail) {
      return {
        id: userId,
        email: userEmail,
        name: userEmail.split('@')[0], // Fallback name
        provider: 'unknown'
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting user from headers:', error)
    return null
  }
}

export type { UserSession, AuthCheckResult } 