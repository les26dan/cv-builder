interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations for different endpoints
const RATE_LIMIT_CONFIGS = {
  register: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  login: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 attempts per 15 minutes
  captcha: { windowMs: 5 * 60 * 1000, maxRequests: 20 }, // 20 attempts per 5 minutes
} as const;

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client IP address from request headers
 */
function getClientIP(request: Request): string {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  request: Request, 
  endpoint: keyof typeof RATE_LIMIT_CONFIGS
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const clientIP = getClientIP(request);
  const config = RATE_LIMIT_CONFIGS[endpoint];
  const key = `${endpoint}:${clientIP}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // If no entry exists or the window has expired, create a new one
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime
    };
  }
  
  // Check if limit is exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000); // seconds
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Create a rate limit response with appropriate headers
 */
export function createRateLimitResponse(
  message: string = "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  retryAfter: number
): Response {
  return new Response(
    JSON.stringify({ 
      error: message,
      retryAfter: retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': 'Exceeded',
        'X-RateLimit-Remaining': '0'
      }
    }
  );
}

/**
 * Add rate limit headers to a response
 */
export function addRateLimitHeaders(
  response: Response,
  remaining: number,
  resetTime: number
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Reset rate limit store (for testing purposes)
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(
  endpoint: keyof typeof RATE_LIMIT_CONFIGS,
  handler: (request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const rateLimitResult = checkRateLimit(request, endpoint);
    
    if (!rateLimitResult.allowed) {
      console.log(`🚫 Rate limit exceeded for ${endpoint}:`, {
        ip: getClientIP(request),
        endpoint,
        retryAfter: rateLimitResult.retryAfter,
        timestamp: new Date().toISOString()
      });
      
      return createRateLimitResponse(
        `Quá nhiều yêu cầu ${endpoint}. Vui lòng thử lại sau ${rateLimitResult.retryAfter} giây.`,
        rateLimitResult.retryAfter!
      );
    }
    
    // Execute the original handler
    const response = await handler(request);
    
    // Add rate limit headers to successful responses
    return addRateLimitHeaders(response, rateLimitResult.remaining, rateLimitResult.resetTime);
  };
}