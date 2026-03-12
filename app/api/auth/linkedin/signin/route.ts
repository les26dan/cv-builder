import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '../../../../../lib/auth/oauth/OAuthService';

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('🚀 [LINKEDIN-SIGNIN] ========== LINKEDIN OAUTH SIGNIN STARTED ==========');
  console.log('📋 [LINKEDIN-SIGNIN] Request initiated at:', timestamp);
  console.log('📋 [LINKEDIN-SIGNIN] Full request details:', {
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    host: request.headers.get('host'),
    origin: request.headers.get('origin'),
    allHeaders: Object.fromEntries(request.headers.entries())
  });

  try {
    // Initialize OAuth service
    console.log('🔧 [LINKEDIN-SIGNIN] Step 1: Initializing OAuth service...');
    OAuthService.initialize();
    console.log('✅ [LINKEDIN-SIGNIN] OAuth service initialized successfully');
    
    // Parse and validate request parameters
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get('returnUrl') || '/';
    const fallback = searchParams.get('fallback') === 'true';
    
    console.log('🔍 [LINKEDIN-SIGNIN] Step 2: Analyzing request parameters:');
    console.log('📋 [LINKEDIN-SIGNIN] Parameter analysis:', {
      returnUrl: returnUrl,
      returnUrlProvided: !!searchParams.get('returnUrl'),
      fallback: fallback,
      fallbackString: searchParams.get('fallback'),
      silentAuthAttempt: !fallback,
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    console.log('🎯 [LINKEDIN-SIGNIN] Authentication strategy determined:', {
      mode: fallback ? 'FALLBACK_MODE' : 'SILENT_AUTH_MODE',
      description: fallback ? 'Force fresh LinkedIn login' : 'Use existing LinkedIn session if available',
      expectedUserExperience: fallback ? 'User will see LinkedIn login screen' : 'User should be redirected automatically'
    });
    
    // Generate OAuth authorization URL
    console.log('🔄 [LINKEDIN-SIGNIN] Step 3: Generating OAuth authorization URL...');
    const { authUrl, sessionId } = await OAuthService.initiateOAuth('linkedin', returnUrl, undefined, fallback);
    
    console.log('✅ [LINKEDIN-SIGNIN] OAuth URL generation completed:', {
      authUrl: authUrl,
      authUrlLength: authUrl.length,
      sessionId: sessionId.substring(0, 10) + '...',
      sessionIdLength: sessionId.length,
      containsRedirectUri: authUrl.includes('redirect_uri'),
      containsClientId: authUrl.includes('client_id'),
      containsScopes: authUrl.includes('scope')
    });
    
    // Analyze the generated URL
    const urlAnalysis = new URL(authUrl);
    console.log('🔍 [LINKEDIN-SIGNIN] Generated URL analysis:', {
      protocol: urlAnalysis.protocol,
      host: urlAnalysis.host,
      pathname: urlAnalysis.pathname,
      searchParams: Object.fromEntries(urlAnalysis.searchParams.entries()),
      hasPromptParam: urlAnalysis.searchParams.has('prompt'),
      promptValue: urlAnalysis.searchParams.get('prompt'),
      clientId: urlAnalysis.searchParams.get('client_id'),
      redirectUri: urlAnalysis.searchParams.get('redirect_uri'),
      scope: urlAnalysis.searchParams.get('scope')
    });
    
    // Create response with redirect
    console.log('🔄 [LINKEDIN-SIGNIN] Step 4: Creating redirect response...');
    const response = NextResponse.redirect(authUrl);
    
    // Set OAuth session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 30 * 60 // 30 minutes
    };
    
    response.cookies.set('oauth_session', sessionId, cookieOptions);
    
    console.log('🍪 [LINKEDIN-SIGNIN] OAuth session cookie set:', {
      sessionId: sessionId.substring(0, 10) + '...',
      cookieOptions: cookieOptions,
      environment: process.env.NODE_ENV
    });
    
    console.log('🎉 [LINKEDIN-SIGNIN] SUCCESS: Ready to redirect to LinkedIn OAuth');
    console.log('📍 [LINKEDIN-SIGNIN] Redirect destination:', authUrl);
    console.log('🔄 [LINKEDIN-SIGNIN] Next step: User will be redirected to LinkedIn for authentication');
    console.log('🚀 [LINKEDIN-SIGNIN] ========== SIGNIN PROCESS COMPLETE ==========');
    
    return response;
    
  } catch (error) {
    console.error('❌ [LINKEDIN-SIGNIN] ========== SIGNIN ERROR OCCURRED ==========');
    console.error('💥 [LINKEDIN-SIGNIN] Error timestamp:', new Date().toISOString());
    console.error('💥 [LINKEDIN-SIGNIN] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorString: String(error)
    });
    
    // Redirect back to login with error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'oauth_init_failed');
    
    console.error('🔗 [LINKEDIN-SIGNIN] Error recovery: Redirecting to login page');
    console.error('📍 [LINKEDIN-SIGNIN] Error redirect URL:', loginUrl.href);
    console.error('❌ [LINKEDIN-SIGNIN] ========== SIGNIN FAILED ==========');
    
    return NextResponse.redirect(loginUrl);
  }
} 