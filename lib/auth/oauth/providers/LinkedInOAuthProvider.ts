import { IOAuthProvider, TokenResponse, OAuthUserProfile, LinkedInTokenResponse, LinkedInProfile, LinkedInEmailResponse } from '../types';
import { SecurityService } from '../security';

export class LinkedInOAuthProvider implements IOAuthProvider {
  public readonly name = 'linkedin';
  
  private readonly LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
  private readonly LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
  private readonly LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/userinfo';
  private readonly LINKEDIN_EMAIL_URL = 'https://api.linkedin.com/v2/userinfo';
  
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes: string[];

  constructor() {
    console.log('🔧 [LINKEDIN-OAUTH] ========== INITIALIZING LINKEDIN OAUTH PROVIDER ==========');
    console.log('📋 [LINKEDIN-OAUTH] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasClientId: !!process.env.LINKEDIN_CLIENT_ID,
      hasClientSecret: !!process.env.LINKEDIN_CLIENT_SECRET,
      hasRedirectUri: !!process.env.LINKEDIN_REDIRECT_URI,
      clientIdPreview: process.env.LINKEDIN_CLIENT_ID?.substring(0, 10) + '...',
      currentTimestamp: new Date().toISOString()
    });

    this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI || (process.env.NODE_ENV === 'production' ? 'https://www.okbuddy.io/api/auth/linkedin/callback' : 'http://localhost:3000/api/auth/linkedin/callback');
    // Use LinkedIn's most basic scope that requires no special approval
    // Some LinkedIn apps need explicit scope approval even for basic scopes
    this.scopes = ['r_basicprofile'];

    console.log('⚙️ [LINKEDIN-OAUTH] Final configuration setup:', {
      clientId: this.clientId ? 'SET' : 'MISSING',
      clientIdLength: this.clientId.length,
      clientIdFirst10: this.clientId.substring(0, 10),
      redirectUri: this.redirectUri,
      redirectUriExpected: process.env.NODE_ENV === 'production' ? 'https://www.okbuddy.io/api/auth/linkedin/callback' : 'http://localhost:3000/api/auth/linkedin/callback',
      redirectUriFromEnv: process.env.LINKEDIN_REDIRECT_URI || 'NOT_SET',
      scopes: this.scopes,
      hasClientSecret: !!this.clientSecret,
      clientSecretLength: this.clientSecret.length
    });

    if (!this.clientId || !this.clientSecret) {
      console.error('❌ [LINKEDIN-OAUTH] CRITICAL ERROR: Missing required configuration!');
      console.error('💥 [LINKEDIN-OAUTH] Missing credentials:', {
        missingClientId: !this.clientId,
        missingClientSecret: !this.clientSecret,
        envVarsCheck: {
          LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID ? 'SET' : 'MISSING',
          LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? 'SET' : 'MISSING',
          LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || 'NOT_SET'
        }
      });
      throw new Error('LinkedIn OAuth configuration is missing - check environment variables');
    }

    console.log('✅ [LINKEDIN-OAUTH] LinkedIn OAuth Provider initialized successfully');
    console.log('🔧 [LINKEDIN-OAUTH] ========== PROVIDER READY ==========');
  }

  /**
   * Build LinkedIn OAuth authorization URL
   */
  public async buildAuthUrl(state: string, fallback = false): Promise<string> {
    console.log('🔗 [LINKEDIN-OAUTH] ========== BUILDING AUTH URL ==========');
    console.log('📋 [LINKEDIN-OAUTH] Input parameters:', {
      stateProvided: !!state,
      stateLength: state.length,
      statePreview: state.substring(0, 20) + '...',
      fallbackMode: fallback,
      timestamp: new Date().toISOString()
    });
    
    console.log('📋 [LINKEDIN-OAUTH] Current configuration being used:', {
      clientId: this.clientId,
      clientIdLength: this.clientId.length,
      redirectUri: this.redirectUri,
      redirectUriLength: this.redirectUri.length,
      scopes: this.scopes,
      scopesString: this.scopes.join(' '),
      baseAuthUrl: this.LINKEDIN_AUTH_URL
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: this.scopes.join(' ')
    });

    console.log('🔧 [LINKEDIN-OAUTH] Base URL parameters created:', {
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state.substring(0, 20) + '...',
      scope: this.scopes.join(' ')
    });

    // LinkedIn OAuth authentication strategy - FINAL FIX
    if (!fallback) {
      // LINKEDIN SILENT AUTH: Don't use any prompt parameter
      // LinkedIn works best with no prompt parameter for silent auth
      console.log('🔒 [LINKEDIN-OAUTH] SILENT AUTH MODE: No prompt parameter (LinkedIn default behavior)');
      console.log('🔍 [LINKEDIN-OAUTH] Strategy: Let LinkedIn handle existing session automatically');
      console.log('🎯 [LINKEDIN-OAUTH] Expected behavior: Use existing session if available, else show login');
    } else {
      // Force fresh authentication in fallback mode
      params.set('prompt', 'login');
      console.log('🔓 [LINKEDIN-OAUTH] FALLBACK MODE: Adding prompt=login for forced authentication');
      console.log('🔍 [LINKEDIN-OAUTH] Strategy: Force fresh login even if user has existing session');
    }

    const authUrl = `${this.LINKEDIN_AUTH_URL}?${params.toString()}`;
    
    console.log('🔗 [LINKEDIN-OAUTH] FINAL AUTH URL GENERATED:');
    console.log('📍 [LINKEDIN-OAUTH] Full URL:', authUrl);
    console.log('📍 [LINKEDIN-OAUTH] URL breakdown:', {
      baseUrl: this.LINKEDIN_AUTH_URL,
      queryParams: params.toString(),
      paramCount: Array.from(params.keys()).length,
      allParams: Object.fromEntries(params.entries())
    });
    
    console.log('✅ [LINKEDIN-OAUTH] URL Generation Summary:', {
      authUrl: authUrl,
      redirectUri: this.redirectUri,
      scopes: this.scopes,
      silentAuth: !fallback,
      promptParameter: fallback ? 'login' : 'none (default)',
      expectedBehavior: fallback ? 'Force fresh login' : 'Use existing LinkedIn session'
    });
    
    SecurityService.logSecurityEvent('linkedin_auth_url_generated', {
      redirectUri: this.redirectUri,
      scopes: this.scopes,
      silentAuth: !fallback
    });

    console.log('🔗 [LINKEDIN-OAUTH] ========== URL READY FOR REDIRECT ==========');
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  public async exchangeCode(code: string): Promise<TokenResponse> {
    console.log('🔄 [LINKEDIN-OAUTH] Starting token exchange...');
    console.log('📋 [LINKEDIN-OAUTH] Token exchange parameters:', {
      codeLength: code.length,
      codePreview: code.substring(0, 20) + '...',
      redirectUri: this.redirectUri,
      clientId: this.clientId,
      hasClientSecret: !!this.clientSecret
    });

    try {
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      console.log('🌐 [LINKEDIN-OAUTH] Making token exchange request to:', this.LINKEDIN_TOKEN_URL);
      console.log('📤 [LINKEDIN-OAUTH] Request body:', tokenParams.toString());

      const response = await fetch(this.LINKEDIN_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: tokenParams.toString()
      });

      console.log('📥 [LINKEDIN-OAUTH] Token response status:', response.status);
      console.log('📥 [LINKEDIN-OAUTH] Token response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [LINKEDIN-OAUTH] Token exchange failed!');
        console.error('💥 [LINKEDIN-OAUTH] Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: 'parse_error', error_description: errorText };
        }
        
        throw new Error(`LinkedIn token exchange failed: ${errorData.error_description || errorData.error || errorText}`);
      }

      const responseText = await response.text();
      console.log('✅ [LINKEDIN-OAUTH] Raw token response:', responseText);

      let tokenData: LinkedInTokenResponse;
      try {
        tokenData = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ [LINKEDIN-OAUTH] Failed to parse token response:', e);
        throw new Error(`LinkedIn token exchange failed: Invalid JSON response`);
      }

      console.log('🎟️ [LINKEDIN-OAUTH] Parsed token data:', {
        hasAccessToken: !!tokenData.access_token,
        accessTokenLength: tokenData.access_token?.length || 0,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      });

      SecurityService.logSecurityEvent('linkedin_token_exchange_success', {
        expiresIn: tokenData.expires_in
      });

      return tokenData;
    } catch (error) {
      console.error('💥 [LINKEDIN-OAUTH] Token exchange error:', error);
      SecurityService.logSecurityEvent('linkedin_token_exchange_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Fetch user profile from LinkedIn using OpenID Connect userinfo endpoint
   */
  public async fetchUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    console.log('👤 [LINKEDIN-OAUTH] Starting user profile fetch...');
    console.log('📋 [LINKEDIN-OAUTH] Profile fetch parameters:', {
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken.length,
      accessTokenPreview: accessToken.substring(0, 20) + '...',
      profileUrl: this.LINKEDIN_PROFILE_URL
    });

    try {
      // Fetch user info from OpenID Connect userinfo endpoint
      console.log('🌐 [LINKEDIN-OAUTH] Making userinfo request to:', this.LINKEDIN_PROFILE_URL);
      
      const userInfoResponse = await fetch(this.LINKEDIN_PROFILE_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      console.log('📥 [LINKEDIN-OAUTH] Userinfo response status:', userInfoResponse.status);
      console.log('📥 [LINKEDIN-OAUTH] Userinfo response headers:', Object.fromEntries(userInfoResponse.headers.entries()));

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error('❌ [LINKEDIN-OAUTH] Userinfo request failed!');
        console.error('💥 [LINKEDIN-OAUTH] Error response:', errorText);
        throw new Error(`LinkedIn userinfo request failed: ${userInfoResponse.status} - ${errorText}`);
      }

      const responseText = await userInfoResponse.text();
      console.log('✅ [LINKEDIN-OAUTH] Raw userinfo response:', responseText);

      let userInfo;
      try {
        userInfo = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ [LINKEDIN-OAUTH] Failed to parse userinfo response:', e);
        throw new Error(`LinkedIn userinfo failed: Invalid JSON response`);
      }

      console.log('📋 [LINKEDIN-OAUTH] Parsed userinfo data:', {
        sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        picture: userInfo.picture,
        email_verified: userInfo.email_verified,
        allFields: Object.keys(userInfo)
      });

      // Validate required fields
      if (!userInfo.sub || !userInfo.email) {
        console.error('❌ [LINKEDIN-OAUTH] Missing required fields!');
        console.error('💥 [LINKEDIN-OAUTH] Available fields:', Object.keys(userInfo));
        throw new Error('LinkedIn profile missing required fields (sub or email)');
      }

      // Extract name information
      const firstName = userInfo.given_name || '';
      const lastName = userInfo.family_name || '';
      const fullName = userInfo.name || `${firstName} ${lastName}`.trim();

      console.log('📋 [LINKEDIN-OAUTH] Extracted name info:', {
        firstName,
        lastName,
        fullName
      });

      // Normalize profile data
      const normalizedProfile: OAuthUserProfile = {
        id: userInfo.sub,
        email: SecurityService.sanitizeInput(userInfo.email),
        emailVerified: userInfo.email_verified || true, // LinkedIn emails are generally verified
        name: SecurityService.sanitizeInput(fullName),
        firstName: SecurityService.sanitizeInput(firstName),
        lastName: SecurityService.sanitizeInput(lastName),
        profilePicture: userInfo.picture,
        provider: 'linkedin',
        providerData: userInfo
      };

      console.log('✅ [LINKEDIN-OAUTH] Normalized profile:', {
        id: normalizedProfile.id,
        email: normalizedProfile.email,
        name: normalizedProfile.name,
        emailVerified: normalizedProfile.emailVerified
      });

      SecurityService.logSecurityEvent('linkedin_profile_fetch_success', {
        userId: normalizedProfile.id,
        email: normalizedProfile.email,
        hasName: !!normalizedProfile.name
      });

      return normalizedProfile;
    } catch (error) {
      console.error('💥 [LINKEDIN-OAUTH] Profile fetch error:', error);
      SecurityService.logSecurityEvent('linkedin_profile_fetch_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Validate LinkedIn access token
   */
  public async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(this.LINKEDIN_PROFILE_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token (LinkedIn tokens are short-lived)
   */
  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      const response = await fetch(this.LINKEDIN_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LinkedIn token refresh failed: ${errorData.error_description || errorData.error}`);
      }

      const tokenData: TokenResponse = await response.json();

      SecurityService.logSecurityEvent('linkedin_token_refresh_success', {
        expiresIn: tokenData.expires_in
      });

      return tokenData;
    } catch (error) {
      SecurityService.logSecurityEvent('linkedin_token_refresh_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Revoke LinkedIn token
   */
  public async revokeToken(token: string): Promise<boolean> {
    try {
      // LinkedIn doesn't provide a standard revoke endpoint
      // Token will expire naturally based on expires_in
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract localized name from LinkedIn profile
   */
  private extractLocalizedName(nameObject: LinkedInProfile['firstName'] | LinkedInProfile['lastName']): string {
    if (!nameObject || !nameObject.localized) {
      return '';
    }

    // Try to get preferred locale first
    const preferredLocale = nameObject.preferredLocale;
    if (preferredLocale) {
      const localeKey = `${preferredLocale.language}_${preferredLocale.country}`;
      if (nameObject.localized[localeKey]) {
        return nameObject.localized[localeKey];
      }
    }

    // Fall back to first available localized name
    const localizedNames = Object.values(nameObject.localized);
    return localizedNames[0] || '';
  }

  /**
   * Get LinkedIn company information (if needed for professional context)
   */
  public async getCompanyInfo(accessToken: string): Promise<any> {
    try {
      // This would require additional LinkedIn API permissions
      // For now, return null as company info is not required for basic auth
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get LinkedIn professional headline (if needed)
   */
  public async getProfessionalHeadline(accessToken: string): Promise<string | null> {
    try {
      // This would require additional LinkedIn API permissions
      // For now, return null as headline is not required for basic auth
      return null;
    } catch (error) {
      return null;
    }
  }
} 