import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rateLimit';

// In-memory storage for CAPTCHA sessions (in production, use Redis or database)
const captchaSessions = new Map<string, { answer: number; expires: number }>();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  Array.from(captchaSessions.entries()).forEach(([sessionId, session]) => {
    if (session.expires < now) {
      captchaSessions.delete(sessionId);
    }
  });
}, 5 * 60 * 1000);

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request, 'captcha');
  
  if (!rateLimitResult.allowed) {
    console.log('🚫 Rate limit exceeded for CAPTCHA generation:', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      retryAfter: rateLimitResult.retryAfter,
      timestamp: new Date().toISOString()
    });
    
    return createRateLimitResponse(
      `Quá nhiều yêu cầu CAPTCHA. Vui lòng thử lại sau ${rateLimitResult.retryAfter} giây.`,
      rateLimitResult.retryAfter!
    );
  }

  try {
    // Generate random math problem
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    
    // Generate unique session ID
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Store session with 10-minute expiration
    captchaSessions.set(sessionId, {
      answer,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    const successResponse = NextResponse.json({
      sessionId,
      problem: {
        num1,
        num2,
        operation: '+'
      }
    });

    return addRateLimitHeaders(successResponse, rateLimitResult.remaining, rateLimitResult.resetTime);

  } catch (error) {
    console.error("💥 CAPTCHA generation error:", error);
    const errorResponse = NextResponse.json(
      { error: "Có lỗi xảy ra khi tạo CAPTCHA" },
      { status: 500 }
    );
    
    return addRateLimitHeaders(errorResponse, rateLimitResult.remaining, rateLimitResult.resetTime);
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request, 'captcha');
  
  if (!rateLimitResult.allowed) {
    console.log('🚫 Rate limit exceeded for CAPTCHA validation:', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      retryAfter: rateLimitResult.retryAfter,
      timestamp: new Date().toISOString()
    });
    
    return createRateLimitResponse(
      `Quá nhiều yêu cầu xác thực CAPTCHA. Vui lòng thử lại sau ${rateLimitResult.retryAfter} giây.`,
      rateLimitResult.retryAfter!
    );
  }

  // Helper function to add rate limit headers to responses
  const addHeaders = (response: NextResponse) => {
    return addRateLimitHeaders(response, rateLimitResult.remaining, rateLimitResult.resetTime);
  };

  try {
    const { sessionId, answer } = await request.json();

    if (!sessionId || answer === undefined) {
      return addHeaders(NextResponse.json(
        { error: "Thiếu thông tin CAPTCHA" },
        { status: 400 }
      ));
    }

    const session = captchaSessions.get(sessionId);
    
    if (!session) {
      return addHeaders(NextResponse.json(
        { error: "CAPTCHA đã hết hạn hoặc không hợp lệ" },
        { status: 400 }
      ));
    }

    if (session.expires < Date.now()) {
      captchaSessions.delete(sessionId);
      return addHeaders(NextResponse.json(
        { error: "CAPTCHA đã hết hạn" },
        { status: 400 }
      ));
    }

    const userAnswer = parseInt(answer);
    const isValid = !isNaN(userAnswer) && userAnswer === session.answer;

    if (isValid) {
      // Remove session after successful validation to prevent reuse
      captchaSessions.delete(sessionId);
    }

    const successResponse = NextResponse.json({
      valid: isValid,
      message: isValid ? "CAPTCHA hợp lệ" : "CAPTCHA không chính xác"
    });

    return addRateLimitHeaders(successResponse, rateLimitResult.remaining, rateLimitResult.resetTime);

  } catch (error) {
    console.error("💥 CAPTCHA validation error:", error);
    const errorResponse = NextResponse.json(
      { error: "Có lỗi xảy ra khi xác thực CAPTCHA" },
      { status: 500 }
    );
    
    return addRateLimitHeaders(errorResponse, rateLimitResult.remaining, rateLimitResult.resetTime);
  }
} 