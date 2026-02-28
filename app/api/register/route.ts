import { NextRequest, NextResponse } from "next/server";
import { sendConfirmationEmail } from '@/lib/email';
import { hashPassword } from '@/lib/password';
import { DatabaseService } from '@/lib/database';
import { checkRateLimit, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rateLimit';

// Explicitly use Node.js runtime to avoid Edge Runtime warnings
export const runtime = 'nodejs'

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  tosAccepted: boolean;
  captchaAnswer: string;
  captchaSessionId: string;
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request, 'register');
  
  if (!rateLimitResult.allowed) {
    console.log('🚫 Rate limit exceeded for register:', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      retryAfter: rateLimitResult.retryAfter,
      timestamp: new Date().toISOString()
    });
    
    return createRateLimitResponse(
      `Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau ${rateLimitResult.retryAfter} giây.`,
      rateLimitResult.retryAfter!
    );
  }

  // Helper function to add rate limit headers to responses
  const addHeaders = (response: NextResponse) => {
    return addRateLimitHeaders(response, rateLimitResult.remaining, rateLimitResult.resetTime);
  };

  try {
    const data: RegisterData = await request.json();
    
    // Validate required fields
    if (!data.fullName || !data.email || !data.password || !data.confirmPassword) {
      return addHeaders(NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      ));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return addHeaders(NextResponse.json(
        { error: "Email không hợp lệ" },
        { status: 400 }
      ));
    }

    // Validate password match
    if (data.password !== data.confirmPassword) {
      return addHeaders(NextResponse.json(
        { error: "Mật khẩu không khớp" },
        { status: 400 }
      ));
    }

    // Validate password length (additional check before hashing)
    if (data.password.length < 6) {
      return addHeaders(NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      ));
    }

    // Validate Terms of Service acceptance
    if (!data.tosAccepted) {
      return addHeaders(NextResponse.json(
        { error: "Bạn phải đồng ý với điều khoản dịch vụ" },
        { status: 400 }
      ));
    }

    // Validate CAPTCHA with server-side verification
    if (!data.captchaAnswer || !data.captchaSessionId) {
      return addHeaders(NextResponse.json(
        { error: "Vui lòng hoàn thành CAPTCHA" },
        { status: 400 }
      ));
    }

    // Verify CAPTCHA with the CAPTCHA API
    try {
      const captchaResponse = await fetch(`${request.nextUrl.origin}/api/captcha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: data.captchaSessionId,
          answer: data.captchaAnswer,
        }),
      });

      if (!captchaResponse.ok) {
        const captchaError = await captchaResponse.json();
        return addHeaders(NextResponse.json(
          { error: captchaError.error || "CAPTCHA không hợp lệ" },
          { status: 400 }
        ));
      }

      const captchaResult = await captchaResponse.json();
      if (!captchaResult.valid) {
        return addHeaders(NextResponse.json(
          { error: "CAPTCHA không chính xác" },
          { status: 400 }
        ));
      }
    } catch (captchaError) {
      console.error('❌ CAPTCHA validation failed:', captchaError);
      return addHeaders(NextResponse.json(
        { error: "Có lỗi xảy ra khi xác thực CAPTCHA. Vui lòng thử lại." },
        { status: 500 }
      ));
    }

    // Hash password securely
    const passwordHashResult = await hashPassword(data.password);
    if (!passwordHashResult.success || !passwordHashResult.hashedPassword) {
      console.error('❌ Password hashing failed:', passwordHashResult.error);
      return addHeaders(NextResponse.json(
        { error: "Có lỗi xảy ra khi xử lý mật khẩu. Vui lòng thử lại." },
        { status: 500 }
      ));
    }

    // Save user to database
    const createUserResult = await DatabaseService.createUser({
      full_name: data.fullName,
      email: data.email,
      password_hash: passwordHashResult.hashedPassword,
      email_verified: false
    });

    if (!createUserResult.success) {
      console.error('❌ Database user creation failed:', createUserResult.error);
      return addHeaders(NextResponse.json(
        { error: createUserResult.error },
        { status: 400 }
      ));
    }

    // Log registration attempt (with hashed password for security)
    console.log('📝 Registration attempt:', {
      userId: createUserResult.user?.id,
      fullName: data.fullName,
      email: data.email,
      hashedPassword: passwordHashResult.hashedPassword,
      captchaValidated: true,
      databaseSaved: true,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    });

    // Send confirmation email (still with plain password for MVP - user needs to know their password)
    // In production, consider sending a temporary password or password reset link instead
    const emailResult = await sendConfirmationEmail({
      fullName: data.fullName,
      email: data.email,
      password: data.password // Plain password for user reference (MVP only)
    });

    if (!emailResult.success) {
      console.error('❌ Email sending failed:', emailResult.message);
      // User is already created in database, so we should still return success
      // but inform about email issue
      return addHeaders(NextResponse.json({
        success: true,
        message: "Đăng ký thành công! Tuy nhiên, không thể gửi email xác nhận. Bạn vẫn có thể đăng nhập bằng thông tin đã đăng ký.",
        emailSent: false,
        user: {
          id: createUserResult.user?.id,
          fullName: createUserResult.user?.full_name,
          email: createUserResult.user?.email,
          emailVerified: createUserResult.user?.email_verified,
          createdAt: createUserResult.user?.created_at
        },
        securityNote: "Tài khoản đã được tạo và mật khẩu đã được mã hóa an toàn"
      }));
    }

    console.log('✅ Registration successful:', {
      userId: createUserResult.user?.id,
      email: data.email,
      emailSent: emailResult.success,
      messageId: emailResult.messageId,
      passwordHashed: true,
      captchaValidated: true,
      databaseSaved: true
    });

    const successResponse = NextResponse.json({
      success: true,
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
      emailSent: emailResult.success,
      messageId: emailResult.messageId,
      user: {
        id: createUserResult.user?.id,
        fullName: createUserResult.user?.full_name,
        email: createUserResult.user?.email,
        emailVerified: createUserResult.user?.email_verified,
        createdAt: createUserResult.user?.created_at
      },
      securityNote: "Mật khẩu đã được mã hóa an toàn và CAPTCHA đã được xác thực"
    });

    return addRateLimitHeaders(successResponse, rateLimitResult.remaining, rateLimitResult.resetTime);

  } catch (error) {
    console.error("💥 Registration error:", error);
    
    const errorResponse = NextResponse.json(
      { error: "Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại." },
      { status: 500 }
    );

    return addRateLimitHeaders(errorResponse, rateLimitResult.remaining, rateLimitResult.resetTime);
  }
} 