import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '../../../../../lib/auth/oauth/OAuthService';
import { serverAnalytics } from '../../../../../shared/services/serverAnalyticsService';
import { STATSIG_EVENTS } from '../../../../../config/statsig';

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Track OAuth initiation
    serverAnalytics.track(STATSIG_EVENTS.API_REQUEST_RECEIVED, { userID: 'anonymous' }, {
      endpoint: '/api/auth/google/signin',
      method: 'GET',
      user_agent: request.headers.get('user-agent') || undefined,
    });

    // Initialize OAuth service
    OAuthService.initialize();
    
    // Get return URL from query parameters
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/';
    
    // Generate OAuth authorization URL
    const { authUrl, sessionId } = await OAuthService.initiateOAuth('google', returnUrl);
    
    // Track successful OAuth session creation
    serverAnalytics.trackAuthEvent(
      'session_created',
      { userID: 'pending_oauth' },
      'google',
      undefined,
      true
    );
    
    // Create response with redirect
    const response = NextResponse.redirect(authUrl);
    
    // Set OAuth session cookie
    response.cookies.set('oauth_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 // 30 minutes
    });
    
    // Track successful API completion
    serverAnalytics.trackAPIRequest(
      '/api/auth/google/signin',
      'GET',
      302,
      Date.now() - startTime,
      { userID: 'anonymous' },
      {
        auth_provider: 'google',
        return_url: returnUrl
      }
    );
    
    return response;
  } catch (error) {
    console.error('❌ Google OAuth initiation error:', error);
    
    // Track OAuth initiation failure
    serverAnalytics.trackAPIRequest(
      '/api/auth/google/signin',
      'GET',
      302,
      Date.now() - startTime,
      { userID: 'anonymous' },
      {
        error_type: 'oauth_init_failed',
        error_message: String(error),
        auth_provider: 'google'
      }
    );
    
    // Redirect back to login with error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_init_failed');
    
    return NextResponse.redirect(loginUrl);
  }
} 