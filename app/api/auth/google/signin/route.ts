import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '../../../../../lib/auth/oauth/OAuthService';

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Initialize OAuth service
    OAuthService.initialize();
    
    // Get return URL from query parameters
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/';
    
    // Generate OAuth authorization URL
    const { authUrl, sessionId } = await OAuthService.initiateOAuth('google', returnUrl);
    
    // Create response with redirect
    const response = NextResponse.redirect(authUrl);
    
    // Set OAuth session cookie
    response.cookies.set('oauth_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error('❌ Google OAuth initiation error:', error);
    
    // Redirect back to login with error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_init_failed');
    
    return NextResponse.redirect(loginUrl);
  }
} 