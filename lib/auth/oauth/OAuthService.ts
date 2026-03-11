import { OAuthProvider, IOAuthProvider, OAuthResult, OAuthError, StateData } from './types';
import { SecurityService } from './security';
import { GoogleOAuthProvider } from './providers/GoogleOAuthProvider';
import { LinkedInOAuthProvider } from './providers/LinkedInOAuthProvider';
import { AccountLinkingService } from './AccountLinkingService';

export class OAuthService {
  private static providers: Map<string, IOAuthProvider> = new Map();
  private static accountLinkingService: AccountLinkingService;

  /**
   * Initialize OAuth service with providers
   */
  public static initialize(): void {
    // Initialize providers with graceful error handling
    
    // Try to initialize Google OAuth provider
    try {
      this.providers.set('google', new GoogleOAuthProvider());
      console.log('✅ Google OAuth provider initialized');
    } catch (error) {
      console.log('⚠️ Google OAuth provider not configured, skipping:', error instanceof Error ? error.message : String(error));
    }
    
    // Try to initialize LinkedIn OAuth provider
    try {
      this.providers.set('linkedin', new LinkedInOAuthProvider());
      console.log('✅ LinkedIn OAuth provider initialized');
    } catch (error) {
      console.log('⚠️ LinkedIn OAuth provider not configured, skipping:', error instanceof Error ? error.message : String(error));
    }
    
    // Initialize account linking service
    this.accountLinkingService = new AccountLinkingService();
    
    console.log('OAuth service initialized with providers:', Array.from(this.providers.keys()));
  }

  /**
   * Get OAuth provider by name
   */
  public static getProvider(providerName: string): IOAuthProvider | null {
    return this.providers.get(providerName) || null;
  }

  /**
   * Initiate OAuth flow
   */
  public static async initiateOAuth(
    provider: string,
    returnUrl?: string,
    userId?: string,
    fallback = false
  ): Promise<{ authUrl: string; sessionId: string }> {
    const oauthProvider = this.getProvider(provider);
    if (!oauthProvider) {
      throw new Error(`OAuth provider '${provider}' not found`);
    }

    try {
      // Generate CSRF token and state
      const csrfToken = SecurityService.generateCSRFToken();
      const stateData: StateData = {
        timestamp: Date.now(),
        provider,
        returnUrl,
        userId,
        csrfToken
      };

      const stateToken = SecurityService.generateState(stateData);
      
      // Create OAuth session
      const sessionId = SecurityService.createOAuthSession(
        provider,
        stateToken,
        csrfToken,
        returnUrl,
        userId
      );

      // Build authorization URL
      const authUrl = await oauthProvider.buildAuthUrl(stateToken, fallback);

      SecurityService.logSecurityEvent('oauth_initiate', {
        provider,
        sessionId,
        userId,
        returnUrl
      });

      return { authUrl, sessionId };
    } catch (error) {
      SecurityService.logSecurityEvent('oauth_initiate_error', {
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle OAuth callback
   */
  public static async handleCallback(
    provider: string,
    code: string,
    state: string,
    sessionId: string,
    clientIp?: string
  ): Promise<OAuthResult> {
    console.log('🔄 [OAUTH-SERVICE] handleCallback started');
    console.log('📋 [OAUTH-SERVICE] Parameters:', {
      provider,
      codeLength: code.length,
      stateLength: state.length,
      sessionIdLength: sessionId.length,
      clientIp
    });
    
    try {
      // Rate limiting check
      console.log('🛡️ [OAUTH-SERVICE] Checking rate limits...');
      if (clientIp && !SecurityService.checkRateLimit(`oauth_callback_${clientIp}`, 5, 60000)) {
        console.error('❌ [OAUTH-SERVICE] Rate limit exceeded for IP:', clientIp);
        throw new Error('Rate limit exceeded');
      }
      console.log('✅ [OAUTH-SERVICE] Rate limit check passed');

      // Validate OAuth session
      console.log('🔍 [OAUTH-SERVICE] Validating OAuth session...');
      const session = SecurityService.getOAuthSession(sessionId);
      console.log('📋 [OAUTH-SERVICE] Session validation result:', {
        hasSession: !!session,
        sessionDetails: session ? {
          provider: session.provider,
          csrfToken: session.csrfToken?.substring(0, 10) + '...',
          returnUrl: session.returnUrl
        } : null
      });
      
      if (!session) {
        console.error('❌ [OAUTH-SERVICE] Invalid or expired OAuth session');
        throw new Error('Invalid or expired OAuth session');
      }

      // Validate state parameter
      console.log('🔍 [OAUTH-SERVICE] Validating state parameter...');
      const stateData = SecurityService.validateState(state, { provider });
      console.log('📋 [OAUTH-SERVICE] State validation result:', {
        hasStateData: !!stateData,
        stateProvider: stateData?.provider,
        csrfMatch: stateData?.csrfToken === session.csrfToken
      });
      
      if (!stateData || stateData.csrfToken !== session.csrfToken) {
        console.error('❌ [OAUTH-SERVICE] Invalid state parameter or CSRF mismatch');
        throw new Error('Invalid state parameter');
      }
      console.log('✅ [OAUTH-SERVICE] State parameter validation passed');

      // Get OAuth provider
      console.log('🔍 [OAUTH-SERVICE] Getting OAuth provider...');
      const oauthProvider = this.getProvider(provider);
      console.log('📋 [OAUTH-SERVICE] Provider status:', {
        hasProvider: !!oauthProvider,
        providerName: oauthProvider?.name
      });
      
      if (!oauthProvider) {
        console.error('❌ [OAUTH-SERVICE] OAuth provider not found:', provider);
        throw new Error(`OAuth provider '${provider}' not found`);
      }
      console.log('✅ [OAUTH-SERVICE] OAuth provider found');

      // Exchange code for tokens
      console.log('🔄 [OAUTH-SERVICE] Exchanging authorization code for tokens...');
      const tokenResponse = await oauthProvider.exchangeCode(code);
      console.log('✅ [OAUTH-SERVICE] Token exchange successful:', {
        hasAccessToken: !!tokenResponse.access_token,
        accessTokenLength: tokenResponse.access_token?.length || 0,
        hasRefreshToken: !!tokenResponse.refresh_token,
        tokenType: tokenResponse.token_type
      });
      
      // Fetch user profile
      console.log('👤 [OAUTH-SERVICE] Fetching user profile...');
      const userProfile = await oauthProvider.fetchUserProfile(tokenResponse.access_token);
      console.log('✅ [OAUTH-SERVICE] User profile fetched:', {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        provider: userProfile.provider,
        emailVerified: userProfile.emailVerified
      });

      // Link or create account
      console.log('🔗 [OAUTH-SERVICE] Resolving account with AccountLinkingService...');
      const accountResult = await this.accountLinkingService.resolveAccount(userProfile);
      console.log('✅ [OAUTH-SERVICE] Account resolution complete:', {
        action: accountResult.action,
        userId: accountResult.user?.id,
        userEmail: accountResult.user?.email,
        isNewAccount: accountResult.isNewAccount,
        linkedProviders: accountResult.linkedProviders
      });

      // Clean up OAuth session
      console.log('🧹 [OAUTH-SERVICE] Cleaning up OAuth session...');
      SecurityService.deleteOAuthSession(sessionId);
      console.log('✅ [OAUTH-SERVICE] OAuth session cleaned up');

      SecurityService.logSecurityEvent('oauth_callback_success', {
        provider,
        userId: accountResult.user.id,
        action: accountResult.action,
        isNewAccount: accountResult.isNewAccount
      });

      const result = {
        success: true,
        action: accountResult.action,
        user: accountResult.user,
        isNewAccount: accountResult.isNewAccount
      };
      
      console.log('🎉 [OAUTH-SERVICE] OAuth callback completed successfully!');
      console.log('📊 [OAUTH-SERVICE] Final result:', result);
      
      return result;

    } catch (error) {
      console.error('💥 [OAUTH-SERVICE] OAuth callback error occurred:', error);
      console.error('💥 [OAUTH-SERVICE] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        provider,
        sessionId
      });
      
      SecurityService.logSecurityEvent('oauth_callback_error', {
        provider,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      const oauthError: OAuthError = {
        code: 'OAUTH_CALLBACK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        provider,
        userMessage: this.getUserFriendlyErrorMessage(error instanceof Error ? error.message : 'Unknown error'),
        retryable: this.isRetryableError(error instanceof Error ? error.message : 'Unknown error')
      };

      const errorResult = {
        success: false,
        action: 'login',
        isNewAccount: false,
        error: oauthError
      };
      
      console.error('❌ [OAUTH-SERVICE] Returning error result:', errorResult);
      
      return errorResult as OAuthResult;
    }
  }

  /**
   * Link additional provider to existing account
   */
  public static async linkProvider(
    userId: string,
    provider: string,
    code: string,
    state: string,
    sessionId: string
  ): Promise<OAuthResult> {
    try {
      // Similar to handleCallback but for linking
      const session = SecurityService.getOAuthSession(sessionId);
      if (!session || session.userId !== userId) {
        throw new Error('Invalid OAuth session for linking');
      }

      const stateData = SecurityService.validateState(state, { provider, userId });
      if (!stateData || stateData.csrfToken !== session.csrfToken) {
        throw new Error('Invalid state parameter');
      }

      const oauthProvider = this.getProvider(provider);
      if (!oauthProvider) {
        throw new Error(`OAuth provider '${provider}' not found`);
      }

      const tokenResponse = await oauthProvider.exchangeCode(code);
      const userProfile = await oauthProvider.fetchUserProfile(tokenResponse.access_token);

      // Link provider to existing account
      const accountResult = await this.accountLinkingService.linkProvider(userId, userProfile);

      SecurityService.deleteOAuthSession(sessionId);

      SecurityService.logSecurityEvent('oauth_link_success', {
        provider,
        userId,
        linkedProviders: accountResult.linkedProviders
      });

      return {
        success: true,
        action: 'link',
        user: accountResult.user,
        isNewAccount: false
      };

    } catch (error) {
      SecurityService.logSecurityEvent('oauth_link_error', {
        provider,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      const oauthError: OAuthError = {
        code: 'OAUTH_LINK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        provider,
        userMessage: this.getUserFriendlyErrorMessage(error instanceof Error ? error.message : 'Unknown error'),
        retryable: false
      };

      return {
        success: false,
        action: 'link',
        isNewAccount: false,
        error: oauthError
      };
    }
  }

  /**
   * Unlink provider from account
   */
  public static async unlinkProvider(userId: string, provider: string): Promise<boolean> {
    try {
      await this.accountLinkingService.unlinkProvider(userId, provider);
      
      SecurityService.logSecurityEvent('oauth_unlink_success', {
        provider,
        userId
      });

      return true;
    } catch (error) {
      SecurityService.logSecurityEvent('oauth_unlink_error', {
        provider,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }

  /**
   * Get linked providers for user
   */
  public static async getLinkedProviders(userId: string): Promise<string[]> {
    try {
      return await this.accountLinkingService.getLinkedProviders(userId);
    } catch (error) {
      console.error('Error getting linked providers:', error);
      return [];
    }
  }

  /**
   * Validate OAuth configuration
   */
  public static validateConfiguration(): boolean {
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'LINKEDIN_CLIENT_ID',
      'LINKEDIN_CLIENT_SECRET',
      'OAUTH_STATE_SECRET',
      'OAUTH_CSRF_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:', missingVars);
      return false;
    }

    return true;
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyErrorMessage(error: string): string {
    if (error.includes('access_denied')) {
      return 'Đăng nhập đã bị hủy. Vui lòng thử lại.';
    }
    if (error.includes('invalid_grant')) {
      return 'Mã xác thực không hợp lệ. Vui lòng thử lại.';
    }
    if (error.includes('Rate limit')) {
      return 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
    }
    if (error.includes('network') || error.includes('timeout')) {
      return 'Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.';
    }
    return 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: string): boolean {
    const retryableErrors = ['network', 'timeout', 'temporary', 'rate limit'];
    return retryableErrors.some(retryable => error.toLowerCase().includes(retryable));
  }
} 