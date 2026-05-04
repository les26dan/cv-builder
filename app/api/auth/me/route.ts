import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userSessionCookie = cookieStore.get('user_session')

    if (!userSessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userSession = JSON.parse(userSessionCookie.value)

    if (!userSession.id || !userSession.email) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 401 })
    }

    // Nếu session dùng offline ID — tự refresh bằng UUID thật từ DB
    if (!UUID_RE.test(userSession.id)) {
      try {
        const { DatabaseService } = await import('@/lib/database')
        const userResult = await DatabaseService.getUserByEmail(userSession.email)
        if (userResult.success && userResult.user?.id) {
          const refreshed = {
            ...userSession,
            id: userResult.user.id,
            name: userResult.user.full_name || userSession.name,
          }
          const response = NextResponse.json({
            id: refreshed.id,
            email: refreshed.email,
            name: refreshed.name,
            provider: refreshed.provider || 'email',
          })
          // Ghi đè cookie với session mới
          response.cookies.set('user_session', JSON.stringify(refreshed), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
          })
          console.log('🔄 Session refreshed with real UUID:', refreshed.id)
          return response
        }
      } catch {
        // DB không reach — trả session offline như cũ
      }
    }

    return NextResponse.json({
      id: userSession.id,
      email: userSession.email,
      name: userSession.name || userSession.email.split('@')[0],
      provider: userSession.provider || 'unknown',
    })

  } catch (error) {
    console.error('Error checking user session:', error)
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 })
  }
}
