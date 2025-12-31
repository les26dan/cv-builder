import { NextRequest, NextResponse } from "next/server";

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Rate limit configurations for different endpoints
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 attempts per hour
  captcha: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  default: { windowMs: 60 * 1000, maxRequests: 60 } // 60 requests per minute for other endpoints
};

// In-memory storage for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { requests: number; resetTime: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([key, data]) => {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(request: NextRequest, endpoint: string): RateLimitResult {
  // Get client identifier (IP address)
  const clientIp = 
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const key = `${endpoint}:${clientIp}`;
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const now = Date.now();
  
  // Get current rate limit data
  let rateLimitData = rateLimitStore.get(key);
  
  // Initialize or reset if window has expired
  if (!rateLimitData || rateLimitData.resetTime < now) {
    rateLimitData = {
      requests: 0,
      resetTime: now + config.windowMs
    };
  }

  // Increment request count
  rateLimitData.requests++;
  rateLimitStore.set(key, rateLimitData);

  // Check if limit exceeded
  const allowed = rateLimitData.requests <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - rateLimitData.requests);
  const retryAfter = allowed ? undefined : Math.ceil((rateLimitData.resetTime - now) / 1000);

  return {
    allowed,
    remaining,
    resetTime: rateLimitData.resetTime,
    retryAfter
  };
}

/**
 * Create a rate limit exceeded response
 */
export function createRateLimitResponse(message: string, retryAfter: number): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      retryAfter 
    },
    { 
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString()
      }
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: NextResponse, 
  remaining: number, 
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
  
  return response;
} 