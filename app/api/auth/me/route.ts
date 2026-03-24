import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userSessionCookie = cookieStore.get('user_session')
    
    if (!userSessionCookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const userSession = JSON.parse(userSessionCookie.value)
    
    // Validate session data
    if (!userSession.id || !userSession.email) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      )
    }
    
    // Return user info (without sensitive data)
    return NextResponse.json({
      id: userSession.id,
      email: userSession.email,
      name: userSession.name || userSession.email.split('@')[0],
      provider: userSession.provider || 'unknown'
    })
    
  } catch (error) {
    console.error('Error checking user session:', error)
    return NextResponse.json(
      { error: 'Session check failed' },
      { status: 500 }
    )
  }
} 