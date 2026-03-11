import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '../../../../../lib/auth/oauth/OAuthService';

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('🚀 [LINKEDIN-SIGNIN] LinkedIn OAuth signin endpoint called');
  console.log('📋 [LINKEDIN-SIGNIN] Request details:', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });

  try {
    // Initialize OAuth service
    console.log('🔧 [LINKEDIN-SIGNIN] Initializing OAuth service...');
    OAuthService.initialize();
    console.log('✅ [LINKEDIN-SIGNIN] OAuth service initialized');
    
    // Get return URL and fallback flag from query parameters
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/';
    const fallback = searchParams.get('fallback') === 'true';
    console.log('🔗 [LINKEDIN-SIGNIN] Return URL:', returnUrl);
    console.log('🔄 [LINKEDIN-SIGNIN] Fallback mode:', fallback);
    
    // Generate OAuth authorization URL
    console.log('🔄 [LINKEDIN-SIGNIN] Generating OAuth authorization URL...');
    const { authUrl, sessionId } = await OAuthService.initiateOAuth('linkedin', returnUrl, undefined, fallback);
    console.log('✅ [LINKEDIN-SIGNIN] OAuth URL generated:', {
      authUrl: authUrl,
      sessionId: sessionId.substring(0, 10) + '...'
    });
    
    // Create response with redirect
    const response = NextResponse.redirect(authUrl);
    
    // Set OAuth session cookie
    response.cookies.set('oauth_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 // 30 minutes
    });
    
    console.log('🎉 [LINKEDIN-SIGNIN] Redirecting to LinkedIn OAuth:', authUrl);
    return response;
  } catch (error) {
    console.error('❌ [LINKEDIN-SIGNIN] LinkedIn OAuth initiation error:', error);
    console.error('💥 [LINKEDIN-SIGNIN] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Redirect back to login with error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_init_failed');
    
    console.log('🔗 [LINKEDIN-SIGNIN] Redirecting to login with error:', loginUrl.href);
    return NextResponse.redirect(loginUrl);
  }
} 