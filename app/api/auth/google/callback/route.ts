import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '../../../../../lib/auth/oauth/OAuthService';
import { cookies } from 'next/headers';

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Initialize OAuth service
    OAuthService.initialize();
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle OAuth errors (user cancelled or other errors)
    if (error) {
      console.log('❌ Google OAuth error:', error);
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_cancelled');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error('❌ Missing OAuth parameters:', { code: !!code, state: !!state });
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_invalid_request');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Get session ID from cookies
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('oauth_session')?.value;
    
    if (!sessionId) {
      console.error('❌ Missing OAuth session');
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_session_expired');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Get client IP for security
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Handle OAuth callback
    const result = await OAuthService.handleCallback('google', code, state, sessionId, clientIp);
    
    // Clear OAuth session cookie
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('oauth_session');
    
    if (result.success && result.user) {
      // Check if this is an admin user and set role
      let userRole = 'user';
      if (result.user.email === 'admin@example.com') {
        userRole = 'admin';
        console.log('🔑 Admin user detected via Google OAuth:', result.user.email);
      }
      
      // Set user session (you may want to use a proper session management system)
      response.cookies.set('user_session', JSON.stringify({
        id: result.user.id,
        email: result.user.email,
        name: result.user.fullName,
        provider: 'google',
        role: userRole
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      // Redirect based on user role and account status
      if (userRole === 'admin') {
        // Admin users go to admin dashboard
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (result.isNewAccount) {
        // New users go to CV Upload page (unified app)
        return NextResponse.redirect(new URL('/cv-upload', request.url));
      } else {
        // Existing users go to CV Workspace (unified app)
        return NextResponse.redirect(new URL('/cv-workspace', request.url));
      }
    } else {
      // OAuth failed
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_failed');
      
      return NextResponse.redirect(loginUrl);
    }
    
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_error');
    
    return NextResponse.redirect(loginUrl);
  }
} 