import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Define protected routes that require authentication
const protectedRoutes = [
  '/cv-workspace',
  '/cv-upload', 
  '/cv-guided-editing'
]

// Define admin routes (if any in future)
const adminRoutes = [
  '/admin'
]

// Routes that should redirect authenticated users away
const authRoutes = [
  '/login',
  '/register'
]

interface UserSession {
  id: string
  email: string
  name: string
  provider: string
}

// Get user session from cookie
async function getUserSession(request: NextRequest): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const userSessionCookie = cookieStore.get('user_session')
    
    if (!userSessionCookie?.value) {
      return null
    }
    
    const userSession = JSON.parse(userSessionCookie.value) as UserSession
    
    // Validate session data
    if (!userSession.id || !userSession.email) {
      return null
    }
    
    return userSession
  } catch (error) {
    console.error('Error parsing user session:', error)
    return null
  }
}

// Validate CV ownership for CV-specific routes
async function validateCVOwnership(cvId: string, userId: string): Promise<boolean> {
  try {
    // Import the validation function from supabase service
    const { validateCVOwnership: dbValidateCVOwnership } = await import('./lib/supabase')
    
    // Use the database validation function
    return await dbValidateCVOwnership(cvId, userId)
  } catch (error) {
    console.error('Error validating CV ownership:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow all API routes and static files to pass through
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Get user session
  const userSession = await getUserSession(request)
  const isAuthenticated = !!userSession
  
  // Handle authentication routes (login, register)
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      // Redirect authenticated users away from auth pages
      return NextResponse.redirect(new URL('/cv-workspace', request.url))
    }
    return NextResponse.next()
  }
  
  // Handle protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect unauthenticated users to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Handle CV-specific routes that require ownership validation
  if (pathname.startsWith('/cv-guided-editing/') && isAuthenticated) {
    const cvIdMatch = pathname.match(/\/cv-guided-editing\/([^\/]+)/)
    
    if (cvIdMatch) {
      const cvId = cvIdMatch[1]
      const isOwner = await validateCVOwnership(cvId, userSession.id)
      
      if (!isOwner) {
        // Redirect to workspace if user doesn't own the CV
        const workspaceUrl = new URL('/cv-workspace', request.url)
        workspaceUrl.searchParams.set('error', 'unauthorized_cv_access')
        return NextResponse.redirect(workspaceUrl)
      }
    }
  }
  
  // Handle admin routes (future feature)
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  if (isAdminRoute) {
    // TODO: Implement admin role checking
    // For now, redirect to workspace
    return NextResponse.redirect(new URL('/cv-workspace', request.url))
  }
  
  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Add user session to headers for client-side access (optional)
  if (userSession) {
    response.headers.set('x-user-id', userSession.id)
    response.headers.set('x-user-email', userSession.email)
  }
  
  return response
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 