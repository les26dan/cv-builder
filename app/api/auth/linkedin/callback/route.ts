import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '../../../../../lib/auth/oauth/OAuthService';
import { cookies } from 'next/headers';

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('🔙 [LINKEDIN-CALLBACK] ========== LINKEDIN OAUTH CALLBACK STARTED ==========');
  console.log('📋 [LINKEDIN-CALLBACK] Callback initiated at:', timestamp);
  console.log('🚨 [LINKEDIN-CALLBACK] CALLBACK ENDPOINT HIT - LinkedIn is calling us!');
  console.log('📋 [LINKEDIN-CALLBACK] Full callback request:', {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer')
  });

  try {
    // Initialize OAuth service
    console.log('🔧 [LINKEDIN-CALLBACK] Step 1: Initializing OAuth service...');
    OAuthService.initialize();
    console.log('✅ [LINKEDIN-CALLBACK] OAuth service initialized');
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const errorCode = searchParams.get('error_code');
    
    console.log('🔍 [LINKEDIN-CALLBACK] Step 2: Analyzing callback parameters:', {
      hasCode: !!code,
      codeLength: code?.length || 0,
      codePreview: code?.substring(0, 20) + '...' || 'null',
      hasState: !!state,
      stateLength: state?.length || 0,
      statePreview: state?.substring(0, 20) + '...' || 'null',
      hasError: !!error,
      errorValue: error,
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    // Handle OAuth errors (user cancelled or other errors)
    if (error) {
      console.log('❌ [LINKEDIN-CALLBACK] LinkedIn OAuth error detected:', {
        error: error,
        errorDescription: errorDescription,
        errorCode: errorCode,
        allErrorParams: { error, errorDescription, errorCode }
      });
      
      // Handle prompt=consent failures - retry with normal OAuth flow
      if (error === 'login_required' || error === 'interaction_required' || error === 'access_denied') {
        console.log('🔄 [LINKEDIN-CALLBACK] Silent auth failed, retrying with fallback...');
        console.log('🎯 [LINKEDIN-CALLBACK] Error indicates user interaction needed');
        
        // Initiate fallback OAuth flow (with prompt=login)
        const fallbackOAuthUrl = new URL('/api/auth/linkedin/signin', request.url);
        fallbackOAuthUrl.searchParams.set('fallback', 'true');
        
        console.log('🔄 [LINKEDIN-CALLBACK] Redirecting to fallback OAuth:', fallbackOAuthUrl.toString());
        return NextResponse.redirect(fallbackOAuthUrl);
      }
      
      console.log('❌ [LINKEDIN-CALLBACK] Unrecoverable OAuth error, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_cancelled');
      loginUrl.searchParams.set('details', error);
      
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
    const result = await OAuthService.handleCallback('linkedin', code, state, sessionId, clientIp);
    
    if (result.success && result.user) {
      // Check if this is an admin user and set role
      let userRole = 'user';
      if (result.user.email === 'admin@example.com') {
        userRole = 'admin';
        console.log('🔑 Admin user detected via LinkedIn OAuth:', result.user.email);
      }
      
      // Determine redirect URL based on user role and account status
      let redirectUrl;
      if (userRole === 'admin') {
        // Admin users go to CV Workspace
        redirectUrl = new URL('/cv-workspace', request.url);
      } else if (result.isNewAccount) {
        // New users go to CV Upload page (unified app)
        redirectUrl = new URL('/cv-upload', request.url);
      } else {
        // Existing users go to CV Workspace (unified app)
        redirectUrl = new URL('/cv-workspace', request.url);
      }
      
      // Create successful redirect response
      const response = NextResponse.redirect(redirectUrl);
      
      // Clear OAuth session cookie
      response.cookies.delete('oauth_session');
      
      // Set user session
      response.cookies.set('user_session', JSON.stringify({
        id: result.user.id,
        email: result.user.email,
        name: result.user.fullName,
        provider: 'linkedin',
        role: userRole
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      return response;
    } else {
      // OAuth failed - create failure redirect response
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_failed');
      const response = NextResponse.redirect(loginUrl);
      
      // Clear OAuth session cookie
      response.cookies.delete('oauth_session');
      
      return response;
    }
    
  } catch (error) {
    console.error('❌ LinkedIn OAuth callback error:', error);
    
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_error');
    
    return NextResponse.redirect(loginUrl);
  }
} 