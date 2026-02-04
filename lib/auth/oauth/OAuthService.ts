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
      console.log('⚠️ Google OAuth provider not configured, skipping:', error.message);
    }
    
    // Try to initialize LinkedIn OAuth provider
    try {
      this.providers.set('linkedin', new LinkedInOAuthProvider());
      console.log('✅ LinkedIn OAuth provider initialized');
    } catch (error) {
      console.log('⚠️ LinkedIn OAuth provider not configured, skipping:', error.message);
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
    userId?: string
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
      const authUrl = await oauthProvider.buildAuthUrl(stateToken);

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
    try {
      // Rate limiting check
      if (clientIp && !SecurityService.checkRateLimit(`oauth_callback_${clientIp}`, 5, 60000)) {
        throw new Error('Rate limit exceeded');
      }

      // Validate OAuth session
      const session = SecurityService.getOAuthSession(sessionId);
      if (!session) {
        throw new Error('Invalid or expired OAuth session');
      }

      // Validate state parameter
      const stateData = SecurityService.validateState(state, { provider });
      if (!stateData || stateData.csrfToken !== session.csrfToken) {
        throw new Error('Invalid state parameter');
      }

      // Get OAuth provider
      const oauthProvider = this.getProvider(provider);
      if (!oauthProvider) {
        throw new Error(`OAuth provider '${provider}' not found`);
      }

      // Exchange code for tokens
      const tokenResponse = await oauthProvider.exchangeCode(code);
      
      // Fetch user profile
      const userProfile = await oauthProvider.fetchUserProfile(tokenResponse.access_token);

      // Link or create account
      const accountResult = await this.accountLinkingService.resolveAccount(userProfile);

      // Clean up OAuth session
      SecurityService.deleteOAuthSession(sessionId);

      SecurityService.logSecurityEvent('oauth_callback_success', {
        provider,
        userId: accountResult.user.id,
        action: accountResult.action,
        isNewAccount: accountResult.isNewAccount
      });

      return {
        success: true,
        action: accountResult.action,
        user: accountResult.user,
        isNewAccount: accountResult.isNewAccount
      };

    } catch (error) {
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

      return {
        success: false,
        action: 'login',
        isNewAccount: false,
        error: oauthError
      };
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