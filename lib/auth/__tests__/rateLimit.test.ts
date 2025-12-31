import { checkRateLimit, createRateLimitResponse, addRateLimitHeaders, resetRateLimitStore } from '../rateLimit';

// Mock Request object for testing
function createMockRequest(ip: string = '192.168.1.1'): Request {
  const headers = new Headers();
  headers.set('x-forwarded-for', ip);
  
  return {
    headers,
  } as Request;
}

describe('Rate Limiting Service', () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    resetRateLimitStore();
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', () => {
      const request = createMockRequest('192.168.1.1');
      const result = checkRateLimit(request, 'register');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 max - 1 used = 4 remaining
      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.retryAfter).toBeUndefined();
    });

    it('should track separate limits for different endpoints', () => {
      const request = createMockRequest('192.168.1.1');
      
      // Use register endpoint
      const registerResult = checkRateLimit(request, 'register');
      expect(registerResult.allowed).toBe(true);
      expect(registerResult.remaining).toBe(4);
      
      // Use login endpoint - should have separate limit
      const loginResult = checkRateLimit(request, 'login');
      expect(loginResult.allowed).toBe(true);
      expect(loginResult.remaining).toBe(9); // 10 max - 1 used = 9 remaining
    });

    it('should track separate limits for different IP addresses', () => {
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');
      
      // First IP
      const result1 = checkRateLimit(request1, 'register');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);
      
      // Second IP should have separate limit
      const result2 = checkRateLimit(request2, 'register');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);
    });

    it('should block requests when rate limit is exceeded', () => {
      const request = createMockRequest('192.168.1.1');
      
      // Make 5 requests (the limit for register)
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(request, 'register');
        expect(result.allowed).toBe(true);
      }
      
      // 6th request should be blocked
      const blockedResult = checkRateLimit(request, 'register');
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
    });

    it('should handle different rate limits for different endpoints', () => {
      const request = createMockRequest('192.168.1.1');
      
      // Register has limit of 5
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(request, 'register');
        expect(result.allowed).toBe(true);
      }
      
      // Login has limit of 10, should still work
      const loginResult = checkRateLimit(request, 'login');
      expect(loginResult.allowed).toBe(true);
      expect(loginResult.remaining).toBe(9);
    });

    it('should handle requests with different IP header formats', () => {
      // Test x-forwarded-for with multiple IPs
      const headers1 = new Headers();
      headers1.set('x-forwarded-for', '192.168.1.1, 10.0.0.1');
      const request1 = { headers: headers1 } as Request;
      
      const result1 = checkRateLimit(request1, 'register');
      expect(result1.allowed).toBe(true);
      
      // Test x-real-ip
      const headers2 = new Headers();
      headers2.set('x-real-ip', '192.168.1.2');
      const request2 = { headers: headers2 } as Request;
      
      const result2 = checkRateLimit(request2, 'register');
      expect(result2.allowed).toBe(true);
      
      // Test cf-connecting-ip
      const headers3 = new Headers();
      headers3.set('cf-connecting-ip', '192.168.1.3');
      const request3 = { headers: headers3 } as Request;
      
      const result3 = checkRateLimit(request3, 'register');
      expect(result3.allowed).toBe(true);
    });

    it('should handle requests with no IP headers', () => {
      const headers = new Headers();
      const request = { headers } as Request;
      
      const result = checkRateLimit(request, 'register');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create proper rate limit response with default message', () => {
      const response = createRateLimitResponse('Test message', 60);
      
      expect(response.status).toBe(429);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('Exceeded');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should create response with custom message and retry time', () => {
      const response = createRateLimitResponse('Custom message', 120);
      
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('120');
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to existing response', () => {
      const originalResponse = new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const resetTime = Date.now() + 900000; // 15 minutes from now
      const modifiedResponse = addRateLimitHeaders(originalResponse, 5, resetTime);
      
      expect(modifiedResponse.status).toBe(200);
      expect(modifiedResponse.headers.get('Content-Type')).toBe('application/json');
      expect(modifiedResponse.headers.get('X-RateLimit-Remaining')).toBe('5');
      expect(modifiedResponse.headers.get('X-RateLimit-Reset')).toBe(Math.ceil(resetTime / 1000).toString());
    });

    it('should preserve original response body and status', () => {
      const originalResponse = new Response(
        JSON.stringify({ error: 'Test error' }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const resetTime = Date.now() + 900000;
      const modifiedResponse = addRateLimitHeaders(originalResponse, 3, resetTime);
      
      expect(modifiedResponse.status).toBe(400);
      expect(modifiedResponse.statusText).toBe('Bad Request');
      expect(modifiedResponse.headers.get('X-RateLimit-Remaining')).toBe('3');
    });
  });

  describe('Rate limit configurations', () => {
    it('should have correct limits for register endpoint', () => {
      const request = createMockRequest('192.168.1.1');
      
      // Should allow 5 requests
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(request, 'register');
        expect(result.allowed).toBe(true);
      }
      
      // 6th should be blocked
      const result = checkRateLimit(request, 'register');
      expect(result.allowed).toBe(false);
    });

    it('should have correct limits for login endpoint', () => {
      const request = createMockRequest('192.168.1.1');
      
      // Should allow 10 requests
      for (let i = 0; i < 10; i++) {
        const result = checkRateLimit(request, 'login');
        expect(result.allowed).toBe(true);
      }
      
      // 11th should be blocked
      const result = checkRateLimit(request, 'login');
      expect(result.allowed).toBe(false);
    });

    it('should have correct limits for captcha endpoint', () => {
      const request = createMockRequest('192.168.1.1');
      
      // Should allow 20 requests
      for (let i = 0; i < 20; i++) {
        const result = checkRateLimit(request, 'captcha');
        expect(result.allowed).toBe(true);
      }
      
      // 21st should be blocked
      const result = checkRateLimit(request, 'captcha');
      expect(result.allowed).toBe(false);
    });
  });

  describe('Security considerations', () => {
    it('should not leak information about other users in rate limit responses', () => {
      const request1 = createMockRequest('192.168.1.1');
      const request2 = createMockRequest('192.168.1.2');
      
      // Exhaust limit for first IP
      for (let i = 0; i < 5; i++) {
        checkRateLimit(request1, 'register');
      }
      
      // Second IP should not be affected
      const result2 = checkRateLimit(request2, 'register');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);
    });

    it('should provide appropriate retry times', () => {
      const request = createMockRequest('192.168.1.1');
      
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(request, 'register');
      }
      
      const blockedResult = checkRateLimit(request, 'register');
      expect(blockedResult.retryAfter).toBeGreaterThan(0);
      expect(blockedResult.retryAfter).toBeLessThanOrEqual(900); // Should be within 15 minutes
    });
  });
}); 