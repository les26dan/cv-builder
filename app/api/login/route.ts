import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from '@/lib/database';
import { verifyPassword } from '@/lib/password';
import { checkRateLimit, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rateLimit';

// Explicitly use Node.js runtime to avoid Edge Runtime warnings
export const runtime = 'nodejs'

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request, 'login');
  
  if (!rateLimitResult.allowed) {
    console.log('🚫 Rate limit exceeded for login:', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      retryAfter: rateLimitResult.retryAfter,
      timestamp: new Date().toISOString()
    });
    
    return createRateLimitResponse(
      `Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ${rateLimitResult.retryAfter} giây.`,
      rateLimitResult.retryAfter!
    );
  }

  // Helper function to add rate limit headers to responses
  const addHeaders = (response: NextResponse) => {
    return addRateLimitHeaders(response, rateLimitResult.remaining, rateLimitResult.resetTime);
  };

  try {
    const body: LoginRequest = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return addHeaders(NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      ));
    }

    // Handle special admin username "adminbuddy"
    let emailToLookup = body.email;
    if (body.email === 'adminbuddy') {
      emailToLookup = 'admin@example.com'; // Updated to Gmail address
      console.log('🔑 Admin username detected, converting to email:', emailToLookup);
    }

    // Validate email format (skip for adminbuddy username)
    if (body.email !== 'adminbuddy') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return addHeaders(NextResponse.json(
          { error: "Email không hợp lệ" },
          { status: 400 }
        ));
      }
    }

    // Find user in database
    let userResult = await DatabaseService.getUserByEmail(emailToLookup);
    
    // Auto-create admin account if using adminbuddy credentials or Gmail email
    if (!userResult.success || !userResult.user) {
      if ((body.email === 'adminbuddy' || body.email === 'admin@example.com') && body.password === '[REDACTED_PASSWORD]') {
        console.log('🔧 Auto-creating adminbuddy account with Gmail email...');
        try {
          const { hashPassword } = await import('@/lib/password');
          const passwordResult = await hashPassword(body.password);
          
          if (passwordResult.success && passwordResult.hashedPassword) {
            const createResult = await DatabaseService.createUser({
              full_name: 'Admin Buddy',
              email: 'admin@example.com', // Always use Gmail email
              password_hash: passwordResult.hashedPassword,
              email_verified: true
            });
            
            if (createResult.success) {
              console.log('✅ Admin Buddy account auto-created successfully with Gmail email');
              userResult = await DatabaseService.getUserByEmail('admin@example.com');
            }
          }
        } catch (error) {
          console.error('❌ Failed to auto-create adminbuddy account:', error);
        }
      }
      
      // Auto-create master admin account if needed (development mode only)
      if (emailToLookup === 'masteradmin@okbuddy.com' && process.env.NODE_ENV === 'development') {
        console.log('🔧 Auto-creating master admin account...');
        try {
          const { hashPassword } = await import('@/lib/password');
          const passwordResult = await hashPassword('[REDACTED_DEV_PASSWORD]');
          
          if (passwordResult.success && passwordResult.hashedPassword) {
            const createResult = await DatabaseService.createUser({
              full_name: 'Master Admin - Full Access',
              email: 'masteradmin@okbuddy.com',
              password_hash: passwordResult.hashedPassword,
              email_verified: true
            });
            
            if (createResult.success) {
              console.log('✅ Master admin account auto-created successfully');
              userResult = await DatabaseService.getUserByEmail(emailToLookup);
            }
          }
        } catch (error) {
          console.error('❌ Failed to auto-create master admin account:', error);
        }
      }
      
      if (!userResult.success || !userResult.user) {
        console.log('❌ Login failed - user not found:', body.email);
        return addHeaders(NextResponse.json(
          { error: "Email hoặc mật khẩu không chính xác" },
          { status: 401 }
        ));
      }
    }

    // Verify password
    const passwordVerification = await verifyPassword(body.password, userResult.user.password_hash);
    if (!passwordVerification.success || !passwordVerification.isValid) {
      console.log('❌ Login failed - invalid password for:', body.email);
      return addHeaders(NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác" },
        { status: 401 }
      ));
    }

    // Log successful login attempt
    console.log('✅ Login successful:', {
      userId: userResult.user.id,
      email: body.email,
      emailVerified: userResult.user.email_verified,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    });

    // Create session data
    const userRole = userResult.user.email === 'admin@example.com' ? 'admin' : 'user';
    const sessionData = {
      id: userResult.user.id,
      email: userResult.user.email,
      name: userResult.user.full_name,
      provider: 'email',
      role: userRole
    };

    // Return success with user information (excluding sensitive data)
    const successResponse = NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
      user: {
        id: userResult.user.id,
        fullName: userResult.user.full_name,
        email: userResult.user.email,
        emailVerified: userResult.user.email_verified,
        createdAt: userResult.user.created_at,
        role: userRole
      }
    }, { status: 200 });

    // Set session cookie for authentication
    successResponse.cookies.set('user_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    console.log(`🍪 Session cookie set for ${userRole}:`, userResult.user.email);

    return addRateLimitHeaders(successResponse, rateLimitResult.remaining, rateLimitResult.resetTime);

  } catch (error) {
    console.error("💥 Login error:", error);
    const errorResponse = NextResponse.json(
      { error: "Đăng nhập thất bại. Vui lòng kiểm tra thông tin." },
      { status: 500 }
    );
    
    return addRateLimitHeaders(errorResponse, rateLimitResult.remaining, rateLimitResult.resetTime);
  }
} 