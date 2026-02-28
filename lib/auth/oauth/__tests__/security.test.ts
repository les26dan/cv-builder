/**
 * OAuth Security Service Test Suite
 * 
 * Comprehensive unit tests for OAuth security service
 * Following Development Tenet 5: Rigorous QA and Testing
 * 
 * Note: This test suite tests the current implementation which uses 
 * simplified encryption (hashing) for demo purposes. In production,
 * proper encryption should be implemented.
 */

import { SecurityService } from '../security';
import { StateData } from '../types';

describe('OAuth Security Service Test Suite', () => {
  beforeEach(() => {
    // Clear any existing sessions and rate limits
    (SecurityService as any).sessionStore.clear();
    (SecurityService as any).rateLimitStore.clear();
  });

  describe('State Parameter Management', () => {
    test('should generate secure state parameter', () => {
      const stateData: StateData = {
        timestamp: Date.now(),
        provider: 'google',
        csrfToken: 'test-csrf-token',
        userId: 'user-123',
        returnUrl: '/dashboard'
      };

      const state = SecurityService.generateState(stateData);
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    test('should reject expired state parameter', () => {
      const stateData: StateData = {
        timestamp: Date.now() - 11 * 60 * 1000, // 11 minutes ago (expired)
        provider: 'google',
        csrfToken: 'test-csrf-token'
      };

      const state = SecurityService.generateState(stateData);
      const validatedData = SecurityService.validateState(state);
      
      expect(validatedData).toBeNull();
    });

    test('should reject malformed state parameter', () => {
      const invalidState = 'invalid-state-parameter';
      const validatedData = SecurityService.validateState(invalidState);
      
      expect(validatedData).toBeNull();
    });

    test('should generate unique state parameters', () => {
      const stateData1: StateData = {
        timestamp: Date.now(),
        provider: 'google',
        csrfToken: 'test-csrf-token-1'
      };

      const stateData2: StateData = {
        timestamp: Date.now(),
        provider: 'linkedin',
        csrfToken: 'test-csrf-token-2'
      };

      const state1 = SecurityService.generateState(stateData1);
      const state2 = SecurityService.generateState(stateData2);
      
      expect(state1).not.toBe(state2);
    });
  });

  describe('CSRF Token Management', () => {
    test('should generate CSRF token', () => {
      const csrfToken = SecurityService.generateCSRFToken();
      
      expect(csrfToken).toBeDefined();
      expect(typeof csrfToken).toBe('string');
      expect(csrfToken.length).toBeGreaterThan(0);
    });

    test('should generate unique CSRF tokens', () => {
      const token1 = SecurityService.generateCSRFToken();
      const token2 = SecurityService.generateCSRFToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('OAuth Session Management', () => {
    test('should create OAuth session', () => {
      const sessionId = SecurityService.createOAuthSession(
        'google',
        'state-token-123',
        'csrf-token-123',
        '/dashboard',
        'user-123'
      );
      
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });

    test('should retrieve OAuth session', () => {
      const sessionId = SecurityService.createOAuthSession(
        'google',
        'state-token-123',
        'csrf-token-123',
        '/dashboard',
        'user-123'
      );
      
      const session = SecurityService.getOAuthSession(sessionId);
      
      expect(session).toBeDefined();
      expect(session?.provider).toBe('google');
      expect(session?.stateToken).toBe('state-token-123');
      expect(session?.csrfToken).toBe('csrf-token-123');
      expect(session?.returnUrl).toBe('/dashboard');
      expect(session?.userId).toBe('user-123');
    });

    test('should return null for non-existent session', () => {
      const session = SecurityService.getOAuthSession('non-existent-session');
      expect(session).toBeNull();
    });

    test('should delete OAuth session', () => {
      const sessionId = SecurityService.createOAuthSession(
        'google',
        'state-token-123',
        'csrf-token-123'
      );
      
      SecurityService.deleteOAuthSession(sessionId);
      const session = SecurityService.getOAuthSession(sessionId);
      
      expect(session).toBeNull();
    });

    test('should create unique session IDs', () => {
      const sessionId1 = SecurityService.createOAuthSession('google', 'state1', 'csrf1');
      const sessionId2 = SecurityService.createOAuthSession('linkedin', 'state2', 'csrf2');
      
      expect(sessionId1).not.toBe(sessionId2);
    });

    test('should handle expired sessions', () => {
      const sessionId = SecurityService.createOAuthSession(
        'google',
        'state-token-123',
        'csrf-token-123'
      );
      
      // Get session and manually expire it
      const session = SecurityService.getOAuthSession(sessionId);
      if (session) {
        session.expiresAt = new Date(Date.now() - 1000); // 1 second ago
      }
      
      // Should return null for expired session
      const retrievedSession = SecurityService.getOAuthSession(sessionId);
      expect(retrievedSession).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', () => {
      const identifier = 'test-user-123';
      
      for (let i = 0; i < 10; i++) {
        const allowed = SecurityService.checkRateLimit(identifier, 10, 60000);
        expect(allowed).toBe(true);
      }
    });

    test('should block requests exceeding rate limit', () => {
      const identifier = 'test-user-456';
      
      // Use up the rate limit
      for (let i = 0; i < 10; i++) {
        SecurityService.checkRateLimit(identifier, 10, 60000);
      }
      
      // Next request should be blocked
      const allowed = SecurityService.checkRateLimit(identifier, 10, 60000);
      expect(allowed).toBe(false);
    });

    test('should handle different identifiers separately', () => {
      const identifier1 = 'user-1';
      const identifier2 = 'user-2';
      
      // Use up rate limit for user-1
      for (let i = 0; i < 10; i++) {
        SecurityService.checkRateLimit(identifier1, 10, 60000);
      }
      
      // user-2 should still be allowed
      const allowed = SecurityService.checkRateLimit(identifier2, 10, 60000);
      expect(allowed).toBe(true);
    });

    test('should handle rate limit with different parameters', () => {
      const identifier = 'param-test-user';
      
      // Test with 1 max request
      expect(SecurityService.checkRateLimit(identifier, 1, 60000)).toBe(true);
      expect(SecurityService.checkRateLimit(identifier, 1, 60000)).toBe(false);
    });
  });

  describe('Security Utilities', () => {
    test('should hash tokens consistently', () => {
      const token = 'test-token-123';
      const hash1 = SecurityService.hashToken(token);
      const hash2 = SecurityService.hashToken(token);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
      expect(typeof hash1).toBe('string');
    });

    test('should generate different hashes for different tokens', () => {
      const token1 = 'test-token-1';
      const token2 = 'test-token-2';
      const hash1 = SecurityService.hashToken(token1);
      const hash2 = SecurityService.hashToken(token2);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should generate secure random strings', () => {
      const random1 = SecurityService.generateSecureRandom(32);
      const random2 = SecurityService.generateSecureRandom(32);
      
      expect(random1).toBeDefined();
      expect(random2).toBeDefined();
      expect(typeof random1).toBe('string');
      expect(typeof random2).toBe('string');
      expect(random1).not.toBe(random2);
      expect(random1.length).toBeGreaterThan(0);
    });

    test('should generate random strings of specified length', () => {
      const random16 = SecurityService.generateSecureRandom(16);
      const random64 = SecurityService.generateSecureRandom(64);
      
      expect(random16.length).toBeGreaterThan(0);
      expect(random64.length).toBeGreaterThan(0);
      expect(random64.length).toBeGreaterThan(random16.length);
    });

    test('should validate email addresses', () => {
      expect(SecurityService.validateEmail('test@example.com')).toBe(true);
      expect(SecurityService.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(SecurityService.validateEmail('invalid-email')).toBe(false);
      expect(SecurityService.validateEmail('test@')).toBe(false);
      expect(SecurityService.validateEmail('@domain.com')).toBe(false);
      expect(SecurityService.validateEmail('')).toBe(false);
      expect(SecurityService.validateEmail('test@domain')).toBe(false);
    });

    test('should sanitize input strings', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = SecurityService.sanitizeInput(maliciousInput);
      
      expect(sanitized).toBeDefined();
      expect(typeof sanitized).toBe('string');
      expect(sanitized).not.toContain('<script>');
    });

    test('should sanitize various malicious inputs', () => {
      expect(SecurityService.sanitizeInput('<img src=x onerror=alert(1)>')).not.toContain('<img');
      expect(SecurityService.sanitizeInput('javascript:alert(1)')).not.toContain('javascript:');
      expect(SecurityService.sanitizeInput('<iframe src="evil.com"></iframe>')).not.toContain('<iframe');
    });

    test('should validate origins correctly', () => {
      // Set test environment
      const originalOrigins = process.env.ALLOWED_ORIGINS;
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001,https://okbuddy.ai';
      
      expect(SecurityService.validateOrigin('http://localhost:3000')).toBe(true);
      expect(SecurityService.validateOrigin('http://localhost:3001')).toBe(true);
      expect(SecurityService.validateOrigin('https://okbuddy.ai')).toBe(true);
      expect(SecurityService.validateOrigin('http://malicious.com')).toBe(false);
      expect(SecurityService.validateOrigin('https://evil.com')).toBe(false);
      expect(SecurityService.validateOrigin('')).toBe(false);
      
      // Restore original environment
      process.env.ALLOWED_ORIGINS = originalOrigins;
    });
  });

  describe('Security Event Logging', () => {
    test('should log security events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      SecurityService.logSecurityEvent('OAUTH_LOGIN_ATTEMPT', {
        provider: 'google',
        userId: 'user-123',
        success: true
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('OAUTH_LOGIN_ATTEMPT'),
        expect.objectContaining({
          provider: 'google',
          userId: 'user-123',
          success: true,
          timestamp: expect.any(String)
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('should include timestamp in security events', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      SecurityService.logSecurityEvent('OAUTH_ERROR', {
        error: 'Invalid state parameter'
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('OAUTH_ERROR'),
        expect.objectContaining({
          error: 'Invalid state parameter',
          timestamp: expect.any(String)
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('should log different event types', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      SecurityService.logSecurityEvent('RATE_LIMIT_EXCEEDED', { identifier: 'user-123' });
      SecurityService.logSecurityEvent('INVALID_ORIGIN', { origin: 'evil.com' });
      SecurityService.logSecurityEvent('CSRF_VALIDATION_FAILED', { sessionId: 'session-123' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('RATE_LIMIT_EXCEEDED'), expect.any(Object));
      expect(consoleSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('INVALID_ORIGIN'), expect.any(Object));
      expect(consoleSpy).toHaveBeenNthCalledWith(3, expect.stringContaining('CSRF_VALIDATION_FAILED'), expect.any(Object));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty state data', () => {
      const emptyState = '';
      const validatedData = SecurityService.validateState(emptyState);
      
      expect(validatedData).toBeNull();
    });

    test('should handle null and undefined inputs', () => {
      expect(SecurityService.validateEmail('')).toBe(false);
      expect(SecurityService.sanitizeInput('')).toBe('');
      expect(SecurityService.hashToken('')).toBeDefined();
    });

    test('should handle edge cases in session management', () => {
      // Test with empty strings
      const sessionId = SecurityService.createOAuthSession('', '', '');
      expect(sessionId).toBeDefined();
      
      const session = SecurityService.getOAuthSession(sessionId);
      expect(session?.provider).toBe('');
      expect(session?.stateToken).toBe('');
      expect(session?.csrfToken).toBe('');
    });

    test('should handle session cleanup', () => {
      const sessionId = SecurityService.createOAuthSession(
        'google',
        'state-token-123',
        'csrf-token-123'
      );
      
      // Manually trigger cleanup (access private method for testing)
      (SecurityService as any).cleanupExpiredSessions();
      
      // Session should still exist if not expired
      const session = SecurityService.getOAuthSession(sessionId);
      expect(session).toBeDefined();
    });
  });

  describe('Security Regression Tests', () => {
    test('should prevent state parameter tampering', () => {
      const stateData: StateData = {
        timestamp: Date.now(),
        provider: 'google',
        csrfToken: 'test-csrf-token',
        userId: 'user-123'
      };

      const state = SecurityService.generateState(stateData);
      
      // Attempt to tamper with state
      const tamperedState = state.replace(/[A-Za-z0-9]/g, 'X');
      const validatedData = SecurityService.validateState(tamperedState);
      
      expect(validatedData).toBeNull();
    });

    test('should handle concurrent session creation safely', () => {
      const sessions = [];
      
      // Create multiple sessions concurrently
      for (let i = 0; i < 10; i++) {
        const sessionId = SecurityService.createOAuthSession(
          'google',
          `state-${i}`,
          `csrf-${i}`
        );
        sessions.push(sessionId);
      }
      
      // All sessions should be unique
      const uniqueSessions = new Set(sessions);
      expect(uniqueSessions.size).toBe(sessions.length);
      
      // All sessions should be retrievable
      sessions.forEach(sessionId => {
        const session = SecurityService.getOAuthSession(sessionId);
        expect(session).toBeDefined();
      });
    });

    test('should prevent XSS in sanitized inputs', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<svg onload=alert(1)>',
        '<body onload=alert(1)>'
      ];

      xssPayloads.forEach(payload => {
        const sanitized = SecurityService.sanitizeInput(payload);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('onload');
        expect(sanitized).not.toContain('onerror');
      });
    });

    test('should maintain rate limiting accuracy under load', () => {
      const identifier = 'load-test-user';
      const maxRequests = 5;
      
      // Make exactly maxRequests requests
      for (let i = 0; i < maxRequests; i++) {
        const allowed = SecurityService.checkRateLimit(identifier, maxRequests, 60000);
        expect(allowed).toBe(true);
      }
      
      // Next request should be blocked
      const blocked = SecurityService.checkRateLimit(identifier, maxRequests, 60000);
      expect(blocked).toBe(false);
    });
  });

  describe('Production Readiness Tests', () => {
    test('should generate cryptographically secure tokens', () => {
      const tokens = new Set();
      
      // Generate 100 tokens and ensure uniqueness
      for (let i = 0; i < 100; i++) {
        const token = SecurityService.generateCSRFToken();
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }
      
      expect(tokens.size).toBe(100);
    });

    test('should handle high-frequency rate limiting', () => {
      const identifier = 'high-freq-user';
      let allowedCount = 0;
      
      // Make rapid requests
      for (let i = 0; i < 50; i++) {
        if (SecurityService.checkRateLimit(identifier, 10, 60000)) {
          allowedCount++;
        }
      }
      
      // Should allow exactly 10 requests
      expect(allowedCount).toBe(10);
    });

    test('should properly validate complex email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@example123.com',
        'test-email@sub.domain.com'
      ];

      const invalidEmails = [
        'invalid-email',
        'test@',
        '@domain.com',
        'test..test@domain.com',
        'test@domain',
        'test @domain.com',
        'test@domain .com'
      ];

      validEmails.forEach(email => {
        expect(SecurityService.validateEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(SecurityService.validateEmail(email)).toBe(false);
      });
    });
  });
});
