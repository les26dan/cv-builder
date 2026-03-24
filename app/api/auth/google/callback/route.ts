import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '../../../../../lib/auth/oauth/OAuthService';
import { cookies } from 'next/headers';

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('🚀 [OAUTH] Google OAuth callback initiated');
  try {
    // Initialize OAuth service
    console.log('🔧 [OAUTH] Initializing OAuth service...');
    OAuthService.initialize();
    console.log('✅ [OAUTH] OAuth service initialized successfully');
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('📋 [OAUTH] Callback parameters received:', {
      hasCode: !!code,
      codeLength: code?.length || 0,
      hasState: !!state,
      stateLength: state?.length || 0,
      error: error,
      fullUrl: request.url
    });
    
    // Handle OAuth errors (user cancelled or other errors)
    if (error) {
      console.log('❌ [OAUTH] Google OAuth error from provider:', error);
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_cancelled');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error('❌ [OAUTH] Missing OAuth parameters:', { 
        code: !!code, 
        state: !!state,
        codePreview: code?.substring(0, 20) + '...',
        statePreview: state?.substring(0, 20) + '...'
      });
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_invalid_request');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Get session ID from cookies
    console.log('🍪 [OAUTH] Retrieving OAuth session cookie...');
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('oauth_session')?.value;
    
    console.log('🍪 [OAUTH] Session cookie status:', {
      hasSessionId: !!sessionId,
      sessionIdLength: sessionId?.length || 0,
      sessionIdPreview: sessionId?.substring(0, 10) + '...'
    });
    
    if (!sessionId) {
      console.error('❌ [OAUTH] Missing OAuth session cookie');
      
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_session_expired');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Get client IP for security
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log('🌐 [OAUTH] Client IP detected:', clientIp);
    
    // Handle OAuth callback
    console.log('🔄 [OAUTH] Processing OAuth callback with OAuthService.handleCallback...');
    console.log('📝 [OAUTH] Callback parameters:', {
      provider: 'google',
      codePreview: code.substring(0, 20) + '...',
      statePreview: state.substring(0, 20) + '...',
      sessionIdPreview: sessionId.substring(0, 10) + '...',
      clientIp
    });
    
    const result = await OAuthService.handleCallback('google', code, state, sessionId, clientIp);
    
    console.log('📊 [OAUTH] OAuth callback result:', {
      success: result.success,
      hasUser: !!result.user,
      userEmail: result.user?.email,
      isNewAccount: result.isNewAccount,
      errorMessage: result.error
    });
    
    if (result.success && result.user) {
      console.log('✅ [OAUTH] OAuth callback successful!');
      console.log('👤 [OAUTH] User details:', {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        isNewAccount: result.isNewAccount
      });
      
      // Check if this is an admin user and set role
      let userRole = 'user';
      if (result.user.email === 'admin@example.com') {
        userRole = 'admin';
        console.log('🔑 [OAUTH] Admin user detected via Google OAuth:', result.user.email);
      }
      
      // Determine redirect URL based on user role and account status
      let redirectUrl;
      if (userRole === 'admin') {
        // Admin users go to CV Workspace
        redirectUrl = new URL('/cv-workspace', request.url);
        console.log('🔗 [OAUTH] Admin user redirecting to:', redirectUrl.pathname);
      } else if (result.isNewAccount) {
        // New users go to CV Upload page (unified app)
        redirectUrl = new URL('/cv-upload', request.url);
        console.log('🔗 [OAUTH] New user redirecting to:', redirectUrl.pathname);
      } else {
        // Existing users go to CV Workspace (unified app)
        redirectUrl = new URL('/cv-workspace', request.url);
        console.log('🔗 [OAUTH] Existing user redirecting to:', redirectUrl.pathname);
      }
      
      // Create successful redirect response
      console.log('📦 [OAUTH] Creating redirect response...');
      const response = NextResponse.redirect(redirectUrl);
      
      // Clear OAuth session cookie
      console.log('🍪 [OAUTH] Clearing OAuth session cookie...');
      response.cookies.delete('oauth_session');
      
      // Set user session
      const sessionData = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.fullName,
        provider: 'google',
        role: userRole
      };
      console.log('🍪 [OAUTH] Setting user session cookie:', {
        userId: sessionData.id,
        email: sessionData.email,
        role: sessionData.role
      });
      
      response.cookies.set('user_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      console.log('🎉 [OAUTH] OAuth flow completed successfully! Redirecting user...');
      return response;
    } else {
      console.error('❌ [OAUTH] OAuth callback failed!');
      console.error('💥 [OAUTH] Failure details:', {
        success: result.success,
        hasUser: !!result.user,
        error: result.error,
        fullResult: result
      });
      
      // OAuth failed - create failure redirect response
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_failed');
      console.log('🔗 [OAUTH] Redirecting to login with error:', loginUrl.href);
      
      const response = NextResponse.redirect(loginUrl);
      
      // Clear OAuth session cookie
      console.log('🍪 [OAUTH] Clearing OAuth session cookie after failure...');
      response.cookies.delete('oauth_session');
      
      return response;
    }
    
  } catch (error) {
    console.error('💥 [OAUTH] Unexpected error in Google OAuth callback:', error);
    console.error('💥 [OAUTH] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      errorObject: error
    });
    
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_error');
    console.log('🔗 [OAUTH] Redirecting to login after unexpected error:', loginUrl.href);
    
    return NextResponse.redirect(loginUrl);
  }
} 