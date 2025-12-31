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
      console.log('❌ LinkedIn OAuth error:', error);
      
      const loginUrl = new URL('/dang-nhap', request.url);
      loginUrl.searchParams.set('error', 'oauth_cancelled');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error('❌ Missing OAuth parameters:', { code: !!code, state: !!state });
      
      const loginUrl = new URL('/dang-nhap', request.url);
      loginUrl.searchParams.set('error', 'oauth_invalid_request');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Get session ID from cookies
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('oauth_session')?.value;
    
    if (!sessionId) {
      console.error('❌ Missing OAuth session');
      
      const loginUrl = new URL('/dang-nhap', request.url);
      loginUrl.searchParams.set('error', 'oauth_session_expired');
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Get client IP for security
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    // Handle OAuth callback
    const result = await OAuthService.handleCallback('linkedin', code, state, sessionId, clientIp);
    
    // Clear OAuth session cookie
    const response = NextResponse.redirect(new URL('/dang-nhap', request.url));
    response.cookies.delete('oauth_session');
    
    if (result.success && result.user) {
      // Set user session (you may want to use a proper session management system)
      response.cookies.set('user_session', JSON.stringify({
        id: result.user.id,
        email: result.user.email,
        name: result.user.fullName,
        provider: 'linkedin'
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
      
      // Redirect based on whether it's a new user or existing user
      if (result.isNewAccount) {
        // New users go to CV Upload page
        return NextResponse.redirect(new URL('http://localhost:4000', request.url));
      } else {
        // Existing users go to CV Workspace
        return NextResponse.redirect(new URL('http://localhost:3002/workspace', request.url));
      }
    } else {
      // OAuth failed
      const loginUrl = new URL('/dang-nhap', request.url);
      loginUrl.searchParams.set('error', 'oauth_failed');
      
      return NextResponse.redirect(loginUrl);
    }
    
  } catch (error) {
    console.error('❌ LinkedIn OAuth callback error:', error);
    
    const loginUrl = new URL('/dang-nhap', request.url);
    loginUrl.searchParams.set('error', 'oauth_error');
    
    return NextResponse.redirect(loginUrl);
  }
} 