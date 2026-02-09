import { IOAuthProvider, TokenResponse, OAuthUserProfile, LinkedInTokenResponse, LinkedInProfile, LinkedInEmailResponse } from '../types';
import { SecurityService } from '../security';

export class LinkedInOAuthProvider implements IOAuthProvider {
  public readonly name = 'linkedin';
  
  private readonly LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
  private readonly LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
  private readonly LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/me';
  private readonly LINKEDIN_EMAIL_URL = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))';
  
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes: string[];

  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
    this.redirectUri = process.env.LINKEDIN_REDIRECT_URI || (process.env.NODE_ENV === 'production' ? 'https://okbuddy.io/api/auth/linkedin/callback' : 'http://localhost:3000/api/auth/linkedin/callback');
    this.scopes = ['r_liteprofile', 'r_emailaddress'];

    if (!this.clientId || !this.clientSecret) {
      throw new Error('LinkedIn OAuth configuration is missing');
    }
  }

  /**
   * Build LinkedIn OAuth authorization URL
   */
  public async buildAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: this.scopes.join(' ')
    });

    const authUrl = `${this.LINKEDIN_AUTH_URL}?${params.toString()}`;
    
    SecurityService.logSecurityEvent('linkedin_auth_url_generated', {
      redirectUri: this.redirectUri,
      scopes: this.scopes
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  public async exchangeCode(code: string): Promise<TokenResponse> {
    try {
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      const response = await fetch(this.LINKEDIN_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: tokenParams.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LinkedIn token exchange failed: ${errorData.error_description || errorData.error}`);
      }

      const tokenData: LinkedInTokenResponse = await response.json();

      SecurityService.logSecurityEvent('linkedin_token_exchange_success', {
        expiresIn: tokenData.expires_in
      });

      return tokenData;
    } catch (error) {
      SecurityService.logSecurityEvent('linkedin_token_exchange_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Fetch user profile from LinkedIn
   */
  public async fetchUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    try {
      // Fetch profile data
      const profileResponse = await fetch(this.LINKEDIN_PROFILE_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!profileResponse.ok) {
        throw new Error(`LinkedIn profile request failed: ${profileResponse.status}`);
      }

      const linkedinProfile: LinkedInProfile = await profileResponse.json();

      // Fetch email data
      const emailResponse = await fetch(this.LINKEDIN_EMAIL_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!emailResponse.ok) {
        throw new Error(`LinkedIn email request failed: ${emailResponse.status}`);
      }

      const emailData: LinkedInEmailResponse = await emailResponse.json();

      // Extract email
      const email = emailData.elements?.[0]?.['handle~']?.emailAddress;
      if (!email) {
        throw new Error('LinkedIn email not found');
      }

      // Validate required fields
      if (!linkedinProfile.id) {
        throw new Error('LinkedIn profile missing required fields');
      }

      // Extract localized names
      const firstName = this.extractLocalizedName(linkedinProfile.firstName);
      const lastName = this.extractLocalizedName(linkedinProfile.lastName);
      const fullName = `${firstName} ${lastName}`.trim();

      // Normalize profile data
      const normalizedProfile: OAuthUserProfile = {
        id: linkedinProfile.id,
        email: SecurityService.sanitizeInput(email),
        emailVerified: true, // LinkedIn emails are generally verified
        name: SecurityService.sanitizeInput(fullName),
        firstName: SecurityService.sanitizeInput(firstName),
        lastName: SecurityService.sanitizeInput(lastName),
        profilePicture: linkedinProfile.profilePicture?.displayImage,
        provider: 'linkedin',
        providerData: {
          profile: linkedinProfile,
          email: emailData
        }
      };

      SecurityService.logSecurityEvent('linkedin_profile_fetch_success', {
        userId: normalizedProfile.id,
        email: normalizedProfile.email,
        hasName: !!normalizedProfile.name
      });

      return normalizedProfile;
    } catch (error) {
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