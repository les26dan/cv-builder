import { GoogleOAuthProvider } from '../providers/GoogleOAuthProvider';
import { GoogleTokenResponse, GoogleUserProfile } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

// Mock JWT library
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn((token: string, options?: any) => {
    if (token === 'mock-id-token') {
      return {
        header: { alg: 'RS256', typ: 'JWT' },
        payload: {
          aud: 'test-google-client-id',
          iss: 'https://accounts.google.com',
          sub: 'google-user-123',
          email: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600
        }
      };
    }
    return null;
  })
}));

describe('GoogleOAuthProvider Test Suite', () => {
  let provider: GoogleOAuthProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/callback';
    
    provider = new GoogleOAuthProvider();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;
  });

  describe('Provider Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(provider.name).toBe('google');
    });

    test('should handle missing client ID', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      
      expect(() => new GoogleOAuthProvider())
        .toThrow('Google OAuth configuration is missing');
    });

    test('should handle missing client secret', () => {
      delete process.env.GOOGLE_CLIENT_SECRET;
      
      expect(() => new GoogleOAuthProvider())
        .toThrow('Google OAuth configuration is missing');
    });

    test('should use default redirect URI when not provided', () => {
      delete process.env.GOOGLE_REDIRECT_URI;
      
      expect(() => new GoogleOAuthProvider()).not.toThrow();
    });
  });

  describe('Authorization URL Building', () => {
    test('should build authorization URL with correct parameters', async () => {
      const state = 'test-state-token';
      
      const authUrl = await provider.buildAuthUrl(state);
      
      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain(`client_id=${process.env.GOOGLE_CLIENT_ID}`);
      expect(authUrl).toContain(`state=${state}`);
      expect(authUrl).toContain('response_type=code');
      // Accept both %20 and + encoding for spaces
      expect(authUrl).toMatch(/scope=(openid(\+|%20)email(\+|%20)profile|openid%20email%20profile)/);
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
    });

    test('should handle URL encoding correctly', async () => {
      process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/callback?test=value&other=param';
      const specialProvider = new GoogleOAuthProvider();
      
      const authUrl = await specialProvider.buildAuthUrl('state');
      
      expect(authUrl).toContain(encodeURIComponent(process.env.GOOGLE_REDIRECT_URI));
    });
  });

  describe('Token Exchange', () => {
    test('should exchange authorization code for tokens successfully', async () => {
      const mockTokenResponse: GoogleTokenResponse = {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        scope: 'openid email profile',
        id_token: 'mock-id-token'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse
      });

      const result = await provider.exchangeCode('auth-code');

      expect(result).toEqual(mockTokenResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: expect.stringContaining('code=auth-code')
        })
      );
    });

    test('should handle token exchange failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant' })
      });

      await expect(provider.exchangeCode('invalid-code'))
        .rejects.toThrow('Google token exchange failed');
    });

    test('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.exchangeCode('auth-code'))
        .rejects.toThrow('Google token exchange failed');
    });

    test('should include all required parameters in token request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token' })
      });

      await provider.exchangeCode('auth-code');

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const body = options.body;

      expect(body).toContain('grant_type=authorization_code');
      expect(body).toContain('code=auth-code');
      expect(body).toContain(`client_id=${process.env.GOOGLE_CLIENT_ID}`);
      expect(body).toContain(`client_secret=${process.env.GOOGLE_CLIENT_SECRET}`);
      expect(body).toContain(`redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI!)}`);
    });
  });

  describe('User Profile Fetching', () => {
    test('should fetch user profile successfully', async () => {
      const mockGoogleProfile: GoogleUserProfile = {
        sub: 'google-user-123',
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/avatar.jpg',
        locale: 'en'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleProfile
      });

      const result = await provider.fetchUserProfile('access-token');

      expect(result).toEqual({
        id: 'google-user-123',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        profilePicture: 'https://example.com/avatar.jpg',
        provider: 'google',
        providerData: mockGoogleProfile
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer access-token',
            'Accept': 'application/json'
          }
        })
      );
    });

    test('should handle profile fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'invalid_token' })
      });

      await expect(provider.fetchUserProfile('invalid-token'))
        .rejects.toThrow('Google profile fetch failed');
    });

    test('should handle missing profile data gracefully', async () => {
      const incompleteProfile = {
        sub: 'google-user-123',
        email: 'test@example.com'
        // Missing other fields
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => incompleteProfile
      });

      const result = await provider.fetchUserProfile('access-token');

      expect(result.id).toBe('google-user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('');
      expect(result.firstName).toBeUndefined();
      expect(result.lastName).toBeUndefined();
      expect(result.profilePicture).toBeUndefined();
    });

    test('should handle network errors in profile fetch', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.fetchUserProfile('access-token'))
        .rejects.toThrow('Google profile fetch failed');
    });
  });

  describe('Token Validation', () => {
    test('should validate token successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          aud: process.env.GOOGLE_CLIENT_ID,
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: 'https://accounts.google.com'
        })
      });

      const result = await provider.validateToken('valid-token');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/tokeninfo?access_token=valid-token'
      );
    });

    test('should handle invalid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_token' })
      });

      const result = await provider.validateToken('invalid-token');

      expect(result).toBe(false);
    });

    test('should handle expired token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          aud: process.env.GOOGLE_CLIENT_ID,
          exp: Math.floor(Date.now() / 1000) - 3600, // Expired
          iss: 'https://accounts.google.com'
        })
      });

      const result = await provider.validateToken('expired-token');

      expect(result).toBe(false);
    });

    test('should handle wrong audience', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          aud: 'wrong-client-id',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: 'https://accounts.google.com'
        })
      });

      const result = await provider.validateToken('token-with-wrong-audience');

      expect(result).toBe(false);
    });

    test('should handle network errors in token validation', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.validateToken('token');

      expect(result).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    test('should refresh token successfully', async () => {
      const mockRefreshResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse
      });

      const result = await provider.refreshToken('refresh-token');

      expect(result).toEqual(mockRefreshResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: expect.stringContaining('grant_type=refresh_token')
        })
      );
    });

    test('should handle refresh token failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant' })
      });

      await expect(provider.refreshToken('invalid-refresh-token'))
        .rejects.toThrow('Google token refresh failed');
    });
  });

  describe('Token Revocation', () => {
    test('should revoke token successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true
      });

      const result = await provider.revokeToken('access-token');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/revoke',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'token=access-token'
        })
      );
    });

    test('should handle token revocation failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const result = await provider.revokeToken('invalid-token');

      expect(result).toBe(false);
    });

    test('should handle network errors in token revocation', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await provider.revokeToken('token');

      expect(result).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty authorization code', async () => {
      await expect(provider.exchangeCode(''))
        .rejects.toThrow('Authorization code is required');
    });

    test('should handle null authorization code', async () => {
      await expect(provider.exchangeCode(null as any))
        .rejects.toThrow('Authorization code is required');
    });

    test('should handle empty access token in profile fetch', async () => {
      await expect(provider.fetchUserProfile(''))
        .rejects.toThrow('Access token is required');
    });

    test('should handle null access token in profile fetch', async () => {
      await expect(provider.fetchUserProfile(null as any))
        .rejects.toThrow('Access token is required');
    });

    test('should handle malformed JSON responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(provider.exchangeCode('auth-code'))
        .rejects.toThrow('Google token exchange failed');
    });

    test('should handle timeout errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(provider.exchangeCode('auth-code'))
        .rejects.toThrow('Google token exchange failed');
    });
  });

  describe('Security Considerations', () => {
    test('should use HTTPS endpoints only', async () => {
      const state = 'test-state';
      const authUrl = await provider.buildAuthUrl(state);
      
      expect(authUrl).toMatch(/^https:/);
    });

    test('should include security parameters in auth URL', async () => {
      const authUrl = await provider.buildAuthUrl('state');
      
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
    });

    test('should validate SSL certificates implicitly', async () => {
      // This test ensures we're using secure endpoints
      const tokenResponse = {
        access_token: 'token',
        token_type: 'Bearer',
        expires_in: 3600
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => tokenResponse
      });

      await provider.exchangeCode('code');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toMatch(/^https:/);
    });
  });
}); 