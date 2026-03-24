import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from '@/lib/database';
import { verifyPassword } from '@/lib/auth/password';
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
          { error: texts.errors.invalidEmailFormat },
          { status: 400 }
        ));
      }
    }

    // Initialize userResult variable
    let userResult;
    
    // DEVELOPMENT MODE: Direct admin bypass
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && (body.email === 'adminbuddy' || body.email === 'admin@example.com') && body.password === '[REDACTED_PASSWORD]') {
      console.log('🔧 DEVELOPMENT MODE: Direct admin bypass for', body.email);
      userResult = {
        success: true,
        user: {
          id: 'dev-admin-1',
          full_name: 'Admin Buddy',
          email: 'admin@example.com',
          password_hash: '$2a$12$mock.hash.for.development.only',
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } else {
      // Find user in database
      userResult = await DatabaseService.getUserByEmail(emailToLookup);
    }
    
    // Auto-create admin account if using adminbuddy credentials or Gmail email
    if (!userResult.success || !userResult.user) {
      
      if ((body.email === 'adminbuddy' || body.email === 'admin@example.com') && body.password === '[REDACTED_PASSWORD]') {
        if (isDevelopment) {
          console.log('🔧 DEVELOPMENT MODE: Using mock admin account');
          // In development mode, the getUserByEmail will return the mock user, so try again
          userResult = await DatabaseService.getUserByEmail('admin@example.com');
        } else {
          console.log('🔧 Auto-creating adminbuddy account with Gmail email...');
          try {
            const { hashPassword } = await import('@/lib/auth/password');
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
      }
      
      // Auto-create master admin account if needed (development mode only)
      if (emailToLookup === 'masteradmin@okbuddy.com' && process.env.NODE_ENV === 'development') {
        console.log('🔧 Auto-creating master admin account...');
        try {
          const { hashPassword } = await import('@/lib/auth/password');
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
        console.log('🔍 UserResult debug:', { 
          success: userResult.success, 
          hasUser: !!userResult.user, 
          error: userResult.error 
        });
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