/**
 * OAuth Types Test Suite
 * 
 * Comprehensive unit tests for OAuth types and interfaces
 * Following Development Tenet 5: Rigorous QA and Testing
 */

import {
  OAuthProvider,
  OAuthUserProfile,
  OAuthResult,
  OAuthError,
  TokenResponse,
  StateData,
  AccountLinkingResult,
  IOAuthProvider,
  GoogleTokenResponse,
  GoogleUserProfile,
  LinkedInTokenResponse,
  LinkedInProfile,
  LinkedInEmailResponse,
  UserOAuthProvider,
  OAuthSession
} from '../types';

describe('OAuth Types Test Suite', () => {
  describe('OAuthProvider Interface', () => {
    test('should define valid OAuth provider structure', () => {
      const googleProvider: OAuthProvider = {
        name: 'google',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3001/api/auth/callback/google',
        scopes: ['openid', 'email', 'profile'],
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token'
      };

      expect(googleProvider.name).toBe('google');
      expect(googleProvider.clientId).toBe('test-client-id');
      expect(googleProvider.scopes).toContain('openid');
      expect(googleProvider.authUrl).toContain('google');
    });

    test('should define valid LinkedIn provider structure', () => {
      const linkedinProvider: OAuthProvider = {
        name: 'linkedin',
        clientId: 'test-linkedin-client-id',
        clientSecret: 'test-linkedin-client-secret',
        redirectUri: 'http://localhost:3001/api/auth/callback/linkedin',
        scopes: ['r_liteprofile', 'r_emailaddress'],
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken'
      };

      expect(linkedinProvider.name).toBe('linkedin');
      expect(linkedinProvider.scopes).toContain('r_liteprofile');
      expect(linkedinProvider.authUrl).toContain('linkedin');
    });
  });

  describe('OAuthUserProfile Interface', () => {
    test('should define normalized user profile structure', () => {
      const userProfile: OAuthUserProfile = {
        id: 'test-user-123',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        profilePicture: 'https://example.com/avatar.jpg',
        provider: 'google',
        providerData: {
          locale: 'en',
          sub: 'google-user-123'
        }
      };

      expect(userProfile.id).toBe('test-user-123');
      expect(userProfile.email).toBe('test@example.com');
      expect(userProfile.emailVerified).toBe(true);
      expect(userProfile.provider).toBe('google');
      expect(userProfile.providerData).toHaveProperty('locale');
    });
  });

  describe('OAuthResult Interface', () => {
    test('should define successful login result', () => {
      const loginResult: OAuthResult = {
        success: true,
        action: 'login',
        user: {
          id: 'user-123',
          email: 'user@example.com',
          fullName: 'Test User',
          profilePicture: 'https://example.com/avatar.jpg',
          signupMethod: 'google',
          linkedProviders: ['google']
        },
        isNewAccount: false
      };

      expect(loginResult.success).toBe(true);
      expect(loginResult.action).toBe('login');
      expect(loginResult.user?.id).toBe('user-123');
      expect(loginResult.isNewAccount).toBe(false);
      expect(loginResult.error).toBeUndefined();
    });
  });

  describe('Type Safety Validation', () => {
    test('should enforce strict typing for provider names', () => {
      const validProviders = ['google', 'linkedin'] as const;
      
      validProviders.forEach(provider => {
        const profile: OAuthUserProfile = {
          id: 'user-123',
          email: 'user@example.com',
          emailVerified: true,
          name: 'Test User',
          provider: provider,
          providerData: {}
        };

        expect(['google', 'linkedin']).toContain(profile.provider);
      });
    });
  });
});
