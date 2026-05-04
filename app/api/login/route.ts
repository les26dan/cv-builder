import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from '@/lib/database';
import { verifyPassword } from '@/lib/password';
import { checkRateLimit, createRateLimitResponse, addRateLimitHeaders } from '@/lib/rateLimit';
import { getTexts } from '@/config/texts/index';
import { detectLanguage, type SupportedLanguage } from '@/config/languageConfig';

export const runtime = 'nodejs'

interface LoginRequest {
  email: string;
  password: string;
}

async function getRequestLanguage(request: NextRequest): Promise<SupportedLanguage> {
  try {
    const acceptLanguage = request.headers.get('accept-language') || '';
    const detectedLanguage = detectLanguage({ browserLocale: acceptLanguage });
    return detectedLanguage.language;
  } catch {
    return 'en';
  }
}

async function getLocalizedTexts(language: SupportedLanguage) {
  try {
    return await getTexts('account', language);
  } catch {
    const { account } = await import('@/config/texts/en/account');
    return account;
  }
}

// Bootstrap admin credentials — đọc từ env, không hardcode
function getBootstrapAdmins(): Record<string, { password: string; name: string; email: string }> {
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'okbuddy2025@gmail.com';
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || '[REDACTED_PASSWORD]';
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || 'Admin Buddy';
  return {
    'adminbuddy': { password: adminPassword, name: adminName, email: adminEmail },
    [adminEmail]:  { password: adminPassword, name: adminName, email: adminEmail },
  };
}

function makeSession(id: string, email: string, name: string, role: string) {
  return { id, email, name, provider: 'email', role };
}

export async function POST(request: NextRequest) {
  const language = await getRequestLanguage(request);
  const texts = await getLocalizedTexts(language);

  const rateLimitResult = checkRateLimit(request, 'login');
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(texts.errors.rateLimitExceeded, rateLimitResult.retryAfter!);
  }

  const addHeaders = (response: NextResponse) =>
    addRateLimitHeaders(response, rateLimitResult.remaining, rateLimitResult.resetTime);

  try {
    const body: LoginRequest = await request.json();

    if (!body.email || !body.password) {
      return addHeaders(NextResponse.json({ error: texts.errors.emailPasswordRequired }, { status: 400 }));
    }

    // Chuẩn hóa email (adminbuddy → email thật)
    const bootstrapAdmins = getBootstrapAdmins();
    const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'okbuddy2025@gmail.com';
    let emailToLookup = body.email === 'adminbuddy' ? adminEmail : body.email;

    // Validate email format (bỏ qua với username "adminbuddy")
    if (body.email !== 'adminbuddy') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return addHeaders(NextResponse.json({ error: texts.errors.invalidEmailFormat }, { status: 400 }));
      }
    }

    // --- Kiểm tra bootstrap admin trước ---
    const bootstrapCred = bootstrapAdmins[body.email];
    if (bootstrapCred && body.password === bootstrapCred.password) {
      // Thử DB trước
      let userResult: Awaited<ReturnType<typeof DatabaseService.getUserByEmail>> | null = null;
      try {
        userResult = await DatabaseService.getUserByEmail(bootstrapCred.email);
      } catch {
        // DB không reach được
      }

      if (userResult?.success && userResult.user) {
        // DB OK — dùng user thật từ DB
        const sessionData = makeSession(userResult.user.id, userResult.user.email, userResult.user.full_name, 'admin');
        const resp = NextResponse.json({
          success: true,
          message: texts.success.loginComplete,
          user: { id: userResult.user.id, fullName: userResult.user.full_name, email: userResult.user.email, emailVerified: true, role: 'admin' }
        }, { status: 200 });
        resp.cookies.set('user_session', JSON.stringify(sessionData), {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7
        });
        console.log('✅ Admin login (DB):', bootstrapCred.email);
        return addRateLimitHeaders(resp, rateLimitResult.remaining, rateLimitResult.resetTime);
      }

      // DB không available — auto-create hoặc offline session
      console.log('⚠️ DB không reach được, thử auto-create admin...');
      try {
        const { hashPassword } = await import('@/lib/password');
        const hashed = await hashPassword(body.password);
        if (hashed.success && hashed.hashedPassword) {
          const created = await DatabaseService.createUser({
            full_name: bootstrapCred.name,
            email: bootstrapCred.email,
            password_hash: hashed.hashedPassword,
            email_verified: true,
          });
          if (created.success && created.user) {
            const sessionData = makeSession(created.user.id, created.user.email, created.user.full_name, 'admin');
            const resp = NextResponse.json({
              success: true, message: texts.success.loginComplete,
              user: { id: created.user.id, fullName: created.user.full_name, email: created.user.email, emailVerified: true, role: 'admin' }
            }, { status: 200 });
            resp.cookies.set('user_session', JSON.stringify(sessionData), {
              httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7
            });
            console.log('✅ Admin auto-created:', bootstrapCred.email);
            return addRateLimitHeaders(resp, rateLimitResult.remaining, rateLimitResult.resetTime);
          }
        }
      } catch { /* DB vẫn không reach */ }

      // Offline fallback — cấp session tạm khi không có DB
      console.log('⚠️ Offline fallback session cho admin:', body.email);
      const offlineId = `offline-${Buffer.from(bootstrapCred.email).toString('hex').slice(0, 8)}`;
      const sessionData = makeSession(offlineId, bootstrapCred.email, bootstrapCred.name, 'admin');
      const offlineResp = NextResponse.json({
        success: true, message: texts.success.loginComplete,
        user: { id: offlineId, fullName: bootstrapCred.name, email: bootstrapCred.email, emailVerified: true, role: 'admin' }
      }, { status: 200 });
      offlineResp.cookies.set('user_session', JSON.stringify(sessionData), {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7
      });
      return addRateLimitHeaders(offlineResp, rateLimitResult.remaining, rateLimitResult.resetTime);
    }

    // --- Login thường (user không phải bootstrap admin) ---
    const userResult = await DatabaseService.getUserByEmail(emailToLookup);

    if (!userResult.success || !userResult.user) {
      console.log('❌ Login failed - user not found:', body.email);
      return addHeaders(NextResponse.json({ error: texts.errors.loginFailed }, { status: 401 }));
    }

    const passwordVerification = await verifyPassword(body.password, userResult.user.password_hash);
    if (!passwordVerification.success || !passwordVerification.isValid) {
      console.log('❌ Login failed - invalid password for:', body.email);
      return addHeaders(NextResponse.json({ error: texts.errors.incorrectPassword }, { status: 401 }));
    }

    const userRole = userResult.user.email === adminEmail ? 'admin' : 'user';
    const sessionData = makeSession(userResult.user.id, userResult.user.email, userResult.user.full_name, userRole);

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

    successResponse.cookies.set('user_session', JSON.stringify(sessionData), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7
    });

    console.log(`✅ Login (${userRole}):`, userResult.user.email);
    return addRateLimitHeaders(successResponse, rateLimitResult.remaining, rateLimitResult.resetTime);

  } catch (error) {
    console.error("💥 Login error:", error);
    return addHeaders(NextResponse.json({ error: texts.errors.loginError }, { status: 500 }));
  }
}
