import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCVWithOwnership } from '@/lib/supabase'

// Explicitly use Node.js runtime to avoid Edge Runtime warnings
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
  try {
    // Get user session from cookies
    const cookieStore = await cookies()
    const userSessionCookie = cookieStore.get('user_session')
    
    if (!userSessionCookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const userSession = JSON.parse(userSessionCookie.value)
    
    if (!userSession.id) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    const resolvedParams = await params
    const cvId = resolvedParams.cvId
    
    // Get CV data with ownership validation
    const cvData = await getCVWithOwnership(cvId, userSession.id)
    
    if (!cvData) {
      return NextResponse.json(
        { error: 'CV not found or access denied' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(cvData)
    
  } catch (error) {
    console.error('Error fetching CV data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
  try {
    // Get user session from cookies
    const cookieStore = await cookies()
    const userSessionCookie = cookieStore.get('user_session')
    
    if (!userSessionCookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    const userSession = JSON.parse(userSessionCookie.value)
    
    if (!userSession.id) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    const resolvedParams = await params
    const cvId = resolvedParams.cvId
    const updateData = await request.json()
    
    // Validate CV ownership first
    const { validateCVOwnership } = await import('@/lib/supabase')
    const isOwner = await validateCVOwnership(cvId, userSession.id)
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'CV not found or access denied' },
        { status: 404 }
      )
    }
    
    // TODO: Implement CV update logic
    // For now, return success
    return NextResponse.json({ 
      message: 'CV updated successfully',
      cvId: cvId,
      updatedFields: Object.keys(updateData)
    })
    
  } catch (error) {
    console.error('Error updating CV data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 