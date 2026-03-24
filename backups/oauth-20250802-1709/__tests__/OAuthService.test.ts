import { OAuthService } from '../OAuthService';
import { GoogleOAuthProvider } from '../providers/GoogleOAuthProvider';
import { LinkedInOAuthProvider } from '../providers/LinkedInOAuthProvider';
import { SecurityService } from '../security';
import { AccountLinkingService } from '../AccountLinkingService';
import { OAuthResult, StateData, OAuthUserProfile } from '../types';

// Mock all dependencies
jest.mock('../providers/GoogleOAuthProvider');
jest.mock('../providers/LinkedInOAuthProvider');
jest.mock('../security');
jest.mock('../AccountLinkingService');

const mockGoogleProvider = GoogleOAuthProvider as jest.MockedClass<typeof GoogleOAuthProvider>;
const mockLinkedInProvider = LinkedInOAuthProvider as jest.MockedClass<typeof LinkedInOAuthProvider>;
const mockSecurityService = SecurityService as jest.MockedClass<typeof SecurityService>;
const mockAccountLinkingService = AccountLinkingService as jest.MockedClass<typeof AccountLinkingService>;

describe('OAuthService Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.LINKEDIN_CLIENT_ID = 'test-linkedin-client-id';
    process.env.LINKEDIN_CLIENT_SECRET = 'test-linkedin-client-secret';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3001';
    process.env.OAUTH_STATE_SECRET = 'test-oauth-state-secret';
    process.env.OAUTH_CSRF_SECRET = 'test-oauth-csrf-secret';
    
    // Setup default mocks for SecurityService static methods
    (SecurityService.generateState as jest.Mock).mockReturnValue('mock-state-token');
    (SecurityService.generateCSRFToken as jest.Mock).mockReturnValue('mock-csrf-token');
    (SecurityService.createOAuthSession as jest.Mock).mockReturnValue('mock-session-id');
    (SecurityService.validateState as jest.Mock).mockReturnValue({
      provider: 'google',
      sessionId: 'mock-session-id',
      csrfToken: 'mock-csrf-token'
    });
    (SecurityService.validateCSRFToken as jest.Mock).mockReturnValue(true);
    (SecurityService.getOAuthSession as jest.Mock).mockReturnValue({
      id: 'mock-session-id',
      provider: 'google',
      stateToken: 'mock-state-token',
      csrfToken: 'mock-csrf-token',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 600000)
    });
    (SecurityService.logSecurityEvent as jest.Mock).mockImplementation(() => {});
    (SecurityService.deleteOAuthSession as jest.Mock).mockImplementation(() => {});

    // Setup provider mocks
    const mockGoogleInstance = {
      buildAuthUrl: jest.fn().mockResolvedValue('https://accounts.google.com/oauth/authorize?client_id=test'),
      exchangeCode: jest.fn().mockResolvedValue({
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      }),
      fetchUserProfile: jest.fn().mockResolvedValue({
        id: 'oauth-user-123',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        profilePicture: 'https://example.com/avatar.jpg',
        provider: 'google',
        providerData: {}
      }),
      validateToken: jest.fn().mockResolvedValue(true)
    };
    
    const mockLinkedInInstance = {
      buildAuthUrl: jest.fn().mockResolvedValue('https://www.linkedin.com/oauth/v2/authorization?client_id=test'),
      exchangeCode: jest.fn().mockResolvedValue({
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      }),
      fetchUserProfile: jest.fn().mockResolvedValue({
        id: 'oauth-user-123',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        profilePicture: 'https://example.com/avatar.jpg',
        provider: 'linkedin',
        providerData: {}
      }),
      validateToken: jest.fn().mockResolvedValue(true)
    };

    mockGoogleProvider.mockImplementation(() => mockGoogleInstance as any);
    mockLinkedInProvider.mockImplementation(() => mockLinkedInInstance as any);

    // Setup AccountLinkingService mock
    const mockAccountLinkingInstance = {
      resolveAccount: jest.fn().mockResolvedValue({
        action: 'login',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          profilePicture: 'https://example.com/avatar.jpg',
          signupMethod: 'oauth',
          linkedProviders: ['google']
        },
        isNewAccount: false,
        linkedProviders: ['google']
      }),
      linkProvider: jest.fn().mockResolvedValue({
        action: 'link',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          profilePicture: 'https://example.com/avatar.jpg',
          signupMethod: 'oauth',
          linkedProviders: ['google', 'linkedin']
        },
        isNewAccount: false,
        linkedProviders: ['google', 'linkedin']
      }),
      unlinkProvider: jest.fn().mockResolvedValue(undefined),
      getLinkedProviders: jest.fn().mockResolvedValue(['google'])
    };

    mockAccountLinkingService.mockImplementation(() => mockAccountLinkingInstance as any);

    // Initialize the service
    OAuthService.initialize();
  });

  describe('OAuth Service Initialization', () => {
    test('should initialize with Google and LinkedIn providers', () => {
      expect(OAuthService.getProvider('google')).toBeDefined();
      expect(OAuthService.getProvider('linkedin')).toBeDefined();
    });

    test('should return null for unknown provider', () => {
      expect(OAuthService.getProvider('unknown')).toBeNull();
    });
  });

  describe('OAuth Flow Initiation', () => {
    test('should initiate Google OAuth flow successfully', async () => {
      const result = await OAuthService.initiateOAuth('google', 'http://localhost:3001/callback');

      expect(result.authUrl).toBe('https://accounts.google.com/oauth/authorize?client_id=test');
      expect(result.sessionId).toBe('mock-session-id');
      expect(SecurityService.generateState).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        provider: 'google',
        returnUrl: 'http://localhost:3001/callback',
        userId: undefined,
        csrfToken: 'mock-csrf-token'
      });
    });

    test('should initiate LinkedIn OAuth flow successfully', async () => {
      const result = await OAuthService.initiateOAuth('linkedin', 'http://localhost:3001/callback');

      expect(result.authUrl).toBe('https://www.linkedin.com/oauth/v2/authorization?client_id=test');
      expect(result.sessionId).toBe('mock-session-id');
    });

    test('should handle unsupported provider', async () => {
      await expect(OAuthService.initiateOAuth('unsupported', 'http://localhost:3001/callback'))
        .rejects.toThrow("OAuth provider 'unsupported' not found");
    });

    test('should include userId in state when provided', async () => {
      await OAuthService.initiateOAuth('google', 'http://localhost:3001/callback', 'user-123');

      expect(SecurityService.generateState).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        provider: 'google',
        returnUrl: 'http://localhost:3001/callback',
        userId: 'user-123',
        csrfToken: 'mock-csrf-token'
      });
    });

    test('should log security events', async () => {
      await OAuthService.initiateOAuth('google', 'http://localhost:3001/callback');

      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith('oauth_initiate', {
        provider: 'google',
        sessionId: 'mock-session-id',
        userId: undefined,
        returnUrl: 'http://localhost:3001/callback'
      });
    });

    test('should handle provider buildAuthUrl error', async () => {
      const mockGoogleInstance = {
        buildAuthUrl: jest.fn().mockRejectedValue(new Error('Auth URL build failed'))
      };
      mockGoogleProvider.mockImplementation(() => mockGoogleInstance as any);
      
      // Re-initialize with failing provider
      OAuthService.initialize();

      await expect(OAuthService.initiateOAuth('google', 'callback'))
        .rejects.toThrow('Auth URL build failed');

      expect(SecurityService.logSecurityEvent).toHaveBeenCalledWith('oauth_initiate_error', {
        provider: 'google',
        error: 'Auth URL build failed'
      });
    });
  });

  describe('OAuth Callback Handling', () => {
    test('should handle Google OAuth callback successfully', async () => {
      const result = await OAuthService.handleCallback('google', 'auth-code', 'mock-state-token', 'mock-session-id');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        profilePicture: 'https://example.com/avatar.jpg',
        signupMethod: 'oauth',
        linkedProviders: ['google']
      });
      expect(result.isNewAccount).toBe(false);
      expect(SecurityService.validateState).toHaveBeenCalledWith('mock-state-token', { provider: 'google' });
    });

    test('should handle LinkedIn OAuth callback successfully', async () => {
      (SecurityService.validateState as jest.Mock).mockReturnValue({
        provider: 'linkedin',
        sessionId: 'mock-session-id',
        csrfToken: 'mock-csrf-token'
      });

      const result = await OAuthService.handleCallback('linkedin', 'auth-code', 'mock-state-token', 'mock-session-id');

      expect(result.success).toBe(true);
    });

    test('should handle invalid state token', async () => {
      (SecurityService.validateState as jest.Mock).mockReturnValue(null);

      const result = await OAuthService.handleCallback('google', 'auth-code', 'invalid-state', 'session-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle provider callback failure', async () => {
      const mockGoogleInstance = {
        buildAuthUrl: jest.fn().mockResolvedValue('https://accounts.google.com/oauth/authorize'),
        exchangeCode: jest.fn().mockRejectedValue(new Error('Token exchange failed')),
        fetchUserProfile: jest.fn(),
        validateToken: jest.fn()
      };
      mockGoogleProvider.mockImplementation(() => mockGoogleInstance as any);
      
      // Re-initialize with failing provider
      OAuthService.initialize();

      const result = await OAuthService.handleCallback('google', 'auth-code', 'mock-state-token', 'mock-session-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle account linking failure', async () => {
      const mockAccountLinkingInstance = {
        resolveAccount: jest.fn().mockRejectedValue(new Error('Account linking failed')),
        linkProvider: jest.fn(),
        unlinkProvider: jest.fn(),
        getLinkedProviders: jest.fn()
      };
      mockAccountLinkingService.mockImplementation(() => mockAccountLinkingInstance as any);

      // Re-initialize with failing account linking
      OAuthService.initialize();

      const result = await OAuthService.handleCallback('google', 'auth-code', 'mock-state-token', 'mock-session-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Provider Linking', () => {
    test('should link provider successfully', async () => {
      // Reset AccountLinkingService to successful mock (in case previous test modified it)
      const mockAccountLinkingInstance = {
        resolveAccount: jest.fn().mockResolvedValue({
          action: 'login',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            fullName: 'Test User',
            profilePicture: 'https://example.com/avatar.jpg',
            signupMethod: 'oauth',
            linkedProviders: ['google']
          },
          isNewAccount: false,
          linkedProviders: ['google']
        }),
        linkProvider: jest.fn().mockResolvedValue({
          action: 'link',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            fullName: 'Test User',
            profilePicture: 'https://example.com/avatar.jpg',
            signupMethod: 'oauth',
            linkedProviders: ['google', 'linkedin']
          },
          isNewAccount: false,
          linkedProviders: ['google', 'linkedin']
        }),
        unlinkProvider: jest.fn().mockResolvedValue(undefined),
        getLinkedProviders: jest.fn().mockResolvedValue(['google'])
      };
      mockAccountLinkingService.mockImplementation(() => mockAccountLinkingInstance as any);

      // Mock the specific linking scenario
      (SecurityService.validateState as jest.Mock).mockReturnValue({
        provider: 'google',
        sessionId: 'mock-session-id',
        csrfToken: 'mock-csrf-token',
        userId: 'user-123'
      });

      // Mock session with userId
      (SecurityService.getOAuthSession as jest.Mock).mockReturnValue({
        id: 'mock-session-id',
        provider: 'google',
        stateToken: 'mock-state-token',
        csrfToken: 'mock-csrf-token',
        userId: 'user-123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 600000)
      });

      // Re-initialize with correct mocks
      OAuthService.initialize();

      const result = await OAuthService.linkProvider('user-123', 'google', 'auth-code', 'mock-state-token', 'mock-session-id');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        profilePicture: 'https://example.com/avatar.jpg',
        signupMethod: 'oauth',
        linkedProviders: ['google', 'linkedin']
      });
    });

    test('should handle provider linking failure', async () => {
      const mockAccountLinkingInstance = {
        resolveAccount: jest.fn(),
        linkProvider: jest.fn().mockRejectedValue(new Error('Linking failed')),
        unlinkProvider: jest.fn(),
        getLinkedProviders: jest.fn()
      };
      mockAccountLinkingService.mockImplementation(() => mockAccountLinkingInstance as any);

      // Re-initialize with failing account linking
      OAuthService.initialize();

      const result = await OAuthService.linkProvider('user-123', 'google', 'auth-code', 'mock-state-token', 'mock-session-id');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Provider Unlinking', () => {
    test('should unlink provider successfully', async () => {
      const result = await OAuthService.unlinkProvider('user-123', 'google');

      expect(result).toBe(true);
    });

    test('should handle provider unlinking failure', async () => {
      const mockAccountLinkingInstance = {
        resolveAccount: jest.fn(),
        linkProvider: jest.fn(),
        unlinkProvider: jest.fn().mockRejectedValue(new Error('Unlinking failed')),
        getLinkedProviders: jest.fn()
      };
      mockAccountLinkingService.mockImplementation(() => mockAccountLinkingInstance as any);

      // Re-initialize with failing account linking
      OAuthService.initialize();

      const result = await OAuthService.unlinkProvider('user-123', 'google');

      expect(result).toBe(false);
    });
  });

  describe('Linked Providers Retrieval', () => {
    test('should get linked providers successfully', async () => {
      const result = await OAuthService.getLinkedProviders('user-123');

      expect(result).toEqual(['google']);
    });

    test('should handle empty linked providers', async () => {
      const mockAccountLinkingInstance = {
        resolveAccount: jest.fn(),
        linkProvider: jest.fn(),
        unlinkProvider: jest.fn(),
        getLinkedProviders: jest.fn().mockResolvedValue([])
      };
      mockAccountLinkingService.mockImplementation(() => mockAccountLinkingInstance as any);

      // Re-initialize with different account linking
      OAuthService.initialize();

      const result = await OAuthService.getLinkedProviders('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('Configuration Validation', () => {
    test('should validate configuration successfully', () => {
      const result = OAuthService.validateConfiguration();

      expect(result).toBe(true);
    });

    test('should fail validation with missing environment variables', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.LINKEDIN_CLIENT_ID;
      delete process.env.LINKEDIN_CLIENT_SECRET;
      delete process.env.OAUTH_STATE_SECRET;
      delete process.env.OAUTH_CSRF_SECRET;

      const result = OAuthService.validateConfiguration();

      expect(result).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null/undefined parameters gracefully', async () => {
      await expect(OAuthService.initiateOAuth(null as any, 'callback'))
        .rejects.toThrow();
      
      // handleCallback returns an error result instead of throwing
      const result = await OAuthService.handleCallback(null as any, 'code', 'state', 'session');
      expect(result.success).toBe(false);
    });

    test('should handle empty string parameters', async () => {
      await expect(OAuthService.initiateOAuth('', 'callback'))
        .rejects.toThrow();
    });

    test('should handle provider instantiation errors gracefully', async () => {
      mockGoogleProvider.mockImplementation(() => {
        throw new Error('Provider instantiation failed');
      });

      // The service should handle provider instantiation errors gracefully
      expect(() => OAuthService.initialize()).toThrow('Provider instantiation failed');
    });
  });

  describe('Security Integration', () => {
    test('should generate secure state parameters', async () => {
      await OAuthService.initiateOAuth('google', 'callback');

      expect(SecurityService.generateState).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        provider: 'google',
        returnUrl: 'callback',
        userId: undefined,
        csrfToken: 'mock-csrf-token'
      });
    });

    test('should validate state parameters on callback', async () => {
      await OAuthService.handleCallback('google', 'auth-code', 'mock-state-token', 'mock-session-id');

      expect(SecurityService.validateState).toHaveBeenCalledWith('mock-state-token', { provider: 'google' });
    });

    test('should clean up sessions on callback', async () => {
      await OAuthService.handleCallback('google', 'auth-code', 'mock-state-token', 'mock-session-id');

      expect(SecurityService.deleteOAuthSession).toHaveBeenCalledWith('mock-session-id');
    });
  });
}); 