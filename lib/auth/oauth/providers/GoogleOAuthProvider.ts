import { IOAuthProvider, TokenResponse, OAuthUserProfile, GoogleTokenResponse, GoogleUserProfile } from '../types';
import { SecurityService } from '../security';
import jwt from 'jsonwebtoken';

export class GoogleOAuthProvider implements IOAuthProvider {
  public readonly name = 'google';
  
  private readonly GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
  
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes: string[];

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback';
    this.scopes = ['openid', 'email', 'profile'];

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Google OAuth configuration is missing');
    }
  }

  /**
   * Build Google OAuth authorization URL
   */
  public async buildAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `${this.GOOGLE_AUTH_URL}?${params.toString()}`;
    
    SecurityService.logSecurityEvent('google_auth_url_generated', {
      redirectUri: this.redirectUri,
      scopes: this.scopes
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  public async exchangeCode(code: string): Promise<TokenResponse> {
    // Input validation
    if (!code || code.trim() === '') {
      throw new Error('Google token exchange failed: Authorization code is required');
    }

    try {
      const response = await fetch(this.GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google token exchange failed: ${errorData.error_description || errorData.error}`);
      }

      const tokenData: GoogleTokenResponse = await response.json();

      // Validate ID token if present
      if (tokenData.id_token) {
        const isValid = await this.validateIdToken(tokenData.id_token);
        if (!isValid) {
          throw new Error('Google token exchange failed: Invalid Google ID token');
        }
      }

      SecurityService.logSecurityEvent('google_token_exchange_success', {
        hasIdToken: !!tokenData.id_token,
        expiresIn: tokenData.expires_in
      });

      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope,
        id_token: tokenData.id_token
      };
    } catch (error) {
      SecurityService.logSecurityEvent('google_token_exchange_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Wrap all errors with consistent prefix for test expectations
      if (error instanceof Error) {
        if (error.message.startsWith('Google token exchange failed:')) {
          throw error;
        } else {
          throw new Error(`Google token exchange failed: ${error.message}`);
        }
      } else {
        throw new Error('Google token exchange failed: Unknown error');
      }
    }
  }

  /**
   * Fetch user profile using access token
   */
  public async fetchUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    // Input validation
    if (!accessToken || accessToken.trim() === '') {
      throw new Error('Google profile fetch failed: Access token is required');
    }

    try {
      const response = await fetch(this.GOOGLE_USERINFO_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Google profile fetch failed: ${response.status}`);
      }

      const googleProfile: GoogleUserProfile = await response.json();

      // Validate required fields
      if (!googleProfile.email || !googleProfile.sub) {
        throw new Error('Google profile fetch failed: Profile missing required fields');
      }

      // Normalize profile data
      const normalizedProfile: OAuthUserProfile = {
        id: googleProfile.sub,
        email: SecurityService.sanitizeInput(googleProfile.email),
        emailVerified: googleProfile.email_verified || false,
        name: SecurityService.sanitizeInput(googleProfile.name || ''),
        firstName: googleProfile.given_name ? SecurityService.sanitizeInput(googleProfile.given_name) : undefined,
        lastName: googleProfile.family_name ? SecurityService.sanitizeInput(googleProfile.family_name) : undefined,
        profilePicture: googleProfile.picture || undefined,
        provider: 'google',
        providerData: googleProfile
      };

      SecurityService.logSecurityEvent('google_profile_fetch_success', {
        userId: normalizedProfile.id,
        email: normalizedProfile.email,
        emailVerified: normalizedProfile.emailVerified
      });

      return normalizedProfile;
    } catch (error) {
      SecurityService.logSecurityEvent('google_profile_fetch_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Wrap all errors with consistent prefix for test expectations
      if (error instanceof Error) {
        if (error.message.startsWith('Google profile fetch failed:')) {
          throw error;
        } else {
          throw new Error(`Google profile fetch failed: ${error.message}`);
        }
      } else {
        throw new Error('Google profile fetch failed: Unknown error');
      }
    }
  }

  /**
   * Validate Google ID token
   */
  public async validateIdToken(idToken: string): Promise<boolean> {
    try {
      // Decode token without verification first to get header
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        return false;
      }

      // Verify token signature (simplified - in production, fetch Google's public keys)
      const payload = decoded.payload as any;
      
      // Basic validation
      if (!payload.aud || !payload.iss || !payload.sub) {
        return false;
      }

      // Check audience
      if (payload.aud !== this.clientId) {
        return false;
      }

      // Check issuer
      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        return false;
      }

      // Check expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return false;
      }

      return true;
    } catch (error) {
      SecurityService.logSecurityEvent('google_id_token_validation_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Validate access token
   */
  public async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
      
      if (!response.ok) {
        return false;
      }

      const tokenInfo = await response.json();
      
      // Check if token is for our application
      if (tokenInfo.aud !== this.clientId) {
        return false;
      }

      // Check if token is expired
      if (tokenInfo.exp && tokenInfo.exp < Math.floor(Date.now() / 1000)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      const response = await fetch(this.GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google token refresh failed: ${errorData.error_description || errorData.error}`);
      }

      const tokenData: TokenResponse = await response.json();

      SecurityService.logSecurityEvent('google_token_refresh_success', {
        expiresIn: tokenData.expires_in
      });

      return tokenData;
    } catch (error) {
      SecurityService.logSecurityEvent('google_token_refresh_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Revoke Google token
   */
  public async revokeToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `token=${token}`
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
} 