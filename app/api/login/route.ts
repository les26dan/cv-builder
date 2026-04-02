import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from '@/lib/database';
import { verifyPassword } from '@/lib/password';
import { checkRateLimit, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rateLimit';
import { getTexts } from '@/config/texts/index';
import { detectLanguage, type SupportedLanguage } from '@/config/languageConfig';

// Explicitly use Node.js runtime to avoid Edge Runtime warnings
export const runtime = 'nodejs'

interface LoginRequest {
  email: string;
  password: string;
}

// Helper function to detect language from request
async function getRequestLanguage(request: NextRequest): Promise<SupportedLanguage> {
  try {
    // Check for language preference in headers
    const acceptLanguage = request.headers.get('accept-language') || '';
    const detectedLanguage = detectLanguage({
      browserLocale: acceptLanguage
    });
    return detectedLanguage.language;
  } catch {
    return 'en'; // Default to English
  }
}

// Helper function to get localized texts
async function getLocalizedTexts(language: SupportedLanguage) {
  try {
    const texts = await getTexts('account', language);
    return texts;
  } catch {
    // Fallback to default texts
    const { account } = await import('@/config/texts/en/account');
    return account;
  }
}

export async function POST(request: NextRequest) {
  // Get localized texts
  const language = await getRequestLanguage(request);
  const texts = await getLocalizedTexts(language);

  // Apply rate limiting
  const rateLimitResult = checkRateLimit(request, 'login');
  
  if (!rateLimitResult.allowed) {
    console.log('🚫 Rate limit exceeded for login:', {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      retryAfter: rateLimitResult.retryAfter,
      timestamp: new Date().toISOString()
    });
    
    return createRateLimitResponse(
      texts.errors.rateLimitExceeded,
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
        { error: texts.errors.emailPasswordRequired },
        { status: 400 }
      ));
    }

    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const loginAlias = process.env.BOOTSTRAP_ADMIN_LOGIN_ALIAS?.trim() || 'adminbuddy';

    let emailToLookup = body.email;
    if (loginAlias && body.email === loginAlias && bootstrapEmail) {
      emailToLookup = bootstrapEmail;
      console.log('🔑 Admin login alias detected, resolving to configured admin email');
    }

    // Validate email format (skip for configured login alias)
    if (!(loginAlias && body.email === loginAlias && bootstrapEmail)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return addHeaders(NextResponse.json(
          { error: texts.errors.invalidEmailFormat },
          { status: 400 }
        ));
      }
    }

    // Initialize userResult variable
    let userResult;
    
    // Find user in database
    userResult = await DatabaseService.getUserByEmail(emailToLookup);
    
    // Auto-create bootstrap admin when env is set (local/staging only — never commit secrets)
    if (!userResult.success || !userResult.user) {
      const bootstrapLoginOk =
        Boolean(bootstrapEmail && bootstrapPassword) &&
        body.password === bootstrapPassword &&
        ((body.email === bootstrapEmail) || (loginAlias && body.email === loginAlias));

      if (bootstrapLoginOk) {
        console.log('🔧 Auto-creating bootstrap admin account from env...');
        try {
          const { hashPassword } = await import('@/lib/password');
          const passwordResult = await hashPassword(body.password);

          if (passwordResult.success && passwordResult.hashedPassword) {
            const createResult = await DatabaseService.createUser({
              full_name: 'Admin',
              email: bootstrapEmail!,
              password_hash: passwordResult.hashedPassword,
              email_verified: true
            });

            if (createResult.success) {
              console.log('✅ Bootstrap admin account auto-created');
              userResult = await DatabaseService.getUserByEmail(bootstrapEmail!);
            }
          }
        } catch (error) {
          console.error('❌ Failed to auto-create bootstrap admin account:', error);
        }
      }

      const devMasterEmail = process.env.DEV_MASTERADMIN_EMAIL?.trim() || 'masteradmin@okbuddy.com';
      const devMasterPassword = process.env.DEV_MASTERADMIN_PASSWORD;
      if (
        devMasterPassword &&
        emailToLookup === devMasterEmail &&
        process.env.NODE_ENV === 'development'
      ) {
        console.log('🔧 Auto-creating master admin account (development)...');
        try {
          const { hashPassword } = await import('@/lib/password');
          const passwordResult = await hashPassword(devMasterPassword);

          if (passwordResult.success && passwordResult.hashedPassword) {
            const createResult = await DatabaseService.createUser({
              full_name: 'Master Admin - Full Access',
              email: devMasterEmail,
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
          { error: texts.errors.loginFailed },
          { status: 401 }
        ));
      }
    }

    // Verify password
    const passwordVerification = await verifyPassword(body.password, userResult.user.password_hash);
    if (!passwordVerification.success || !passwordVerification.isValid) {
      console.log('❌ Login failed - invalid password for:', body.email);
      return addHeaders(NextResponse.json(
        { error: texts.errors.incorrectPassword },
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
    const userRole =
      bootstrapEmail && userResult.user.email === bootstrapEmail ? 'admin' : 'user';
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
      message: texts.success.loginComplete,
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
      { error: texts.errors.loginError },
      { status: 500 }
    );
    
    return addRateLimitHeaders(errorResponse, rateLimitResult.remaining, rateLimitResult.resetTime);
  }
} 