import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Define protected routes that require authentication
const protectedRoutes = [
  '/cv-workspace',
  '/cv-upload', 
  '/cv-guided-editing'
]

// Routes that can be accessed in development without authentication
const devAllowedRoutes = [
  '/cv-guided-editing',
  '/cv-workspace',
  '/cv-uploaded-test'
]

// Define admin routes
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
  role?: string // Add role support
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
    
    // Check if this is an admin user
    if (userSession.email === 'admin@example.com') {
      userSession.role = 'admin'
    }
    
    return userSession
  } catch (error) {
    console.error('Error parsing user session:', error)
    return null
  }
}

// Note: CV ownership validation moved to API routes to avoid Edge Runtime issues
// Middleware now only handles authentication, not CV ownership
async function validateCVOwnership(cvId: string, userId: string): Promise<boolean> {
  // For now, allow access and let the API routes handle detailed validation
  // This prevents Edge Runtime issues with Supabase imports in middleware
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Enhanced navigation error handling
  try {
    // Allow all API routes and static files to pass through
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/.well-known/') ||
      pathname.includes('.') ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml'
    ) {
      const response = NextResponse.next()
      
      // Add caching headers for static assets to prevent 500 errors
      if (pathname.startsWith('/_next/static/')) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      }
      
      return response
    }
    
    // Allow CV test routes to pass through without authentication (development tool)
    if (pathname.startsWith('/cv-uploaded-test')) {
      console.log(`🧪 Allowing test route access: ${pathname}`)
      return NextResponse.next()
    }
  } catch (error) {
    console.error('Middleware error for static assets:', error)
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
    // Allow CV guided editing in development for testing
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isDevAllowed = devAllowedRoutes.some(route => pathname.startsWith(route))
    
    if (isDevelopment && isDevAllowed) {
      console.log(`🔧 Development mode: Allowing access to ${pathname}`)
      return NextResponse.next()
    }
    
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
    if (!isAuthenticated) {
      // Redirect unauthenticated users to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Check if user has admin role
    if (userSession.role !== 'admin') {
      // Redirect non-admin users to workspace with error
      const workspaceUrl = new URL('/cv-workspace', request.url)
      workspaceUrl.searchParams.set('error', 'admin_access_required')
      return NextResponse.redirect(workspaceUrl)
    }
    
    // Allow admin access
    console.log('✅ Admin access granted to:', userSession.email)
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