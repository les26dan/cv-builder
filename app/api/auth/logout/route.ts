import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )
    
    // Clear the user session cookie
    response.cookies.delete('user_session')
    
    // Also clear any OAuth session cookie if it exists
    response.cookies.delete('oauth_session')
    
    return response
    
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
} 