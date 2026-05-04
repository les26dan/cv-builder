import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'
import { saveCVDraft } from '@/lib/supabase'
import { processFile, analyzeExtractedText } from '@/lib/fileProcessing'
import { serverAnalytics } from '@/shared/services/serverAnalyticsService'
import { STATSIG_EVENTS } from '@/config/statsig'

// Explicitly use Node.js runtime to avoid Edge Runtime warnings
export const runtime = 'nodejs'

interface UploadResponse {
  success: boolean
  message: string
  fileId?: string
  fileName?: string
  fileSize?: number
  error?: string
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let user = { userID: 'anonymous' };
  
  try {
    // Track API request start
    serverAnalytics.track(STATSIG_EVENTS.API_REQUEST_RECEIVED, user, {
      endpoint: '/api/upload/cv',
      method: 'POST',
      user_agent: request.headers.get('user-agent') || undefined,
    });

    // Check authentication
    const cookieStore = await cookies()
    const userSessionCookie = cookieStore.get('user_session')
    
    if (!userSessionCookie?.value) {
      serverAnalytics.trackAPIRequest(
        '/api/upload/cv',
        'POST',
        401,
        Date.now() - startTime,
        user,
        { error_type: 'UNAUTHORIZED' }
      );
      return NextResponse.json(
        { success: false, message: 'Not authenticated', error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    const userSession = JSON.parse(userSessionCookie.value)
    if (!userSession.id) {
      serverAnalytics.trackAPIRequest(
        '/api/upload/cv',
        'POST',
        401,
        Date.now() - startTime,
        user,
        { error_type: 'INVALID_SESSION' }
      );
      return NextResponse.json(
        { success: false, message: 'Invalid session', error: 'INVALID_SESSION' },
        { status: 401 }
      )
    }

    // Update user context for tracking
    user = { 
      userID: userSession.id
    };

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('cv') as File
    
    if (!file) {
      serverAnalytics.trackAPIRequest(
        '/api/upload/cv',
        'POST',
        400,
        Date.now() - startTime,
        user,
        { error_type: 'NO_FILE' }
      );
      return NextResponse.json(
        { success: false, message: 'No file uploaded', error: 'NO_FILE' },
        { status: 400 }
      )
    }

    // Track CV upload started
    serverAnalytics.trackCVProcessing(
      'upload',
      true,
      user,
      undefined,
      file.size,
      undefined,
      undefined,
      undefined
    );

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      serverAnalytics.trackAPIRequest(
        '/api/upload/cv',
        'POST',
        400,
        Date.now() - startTime,
        user,
        { 
          error_type: 'UNSUPPORTED_FORMAT',
          file_type: file.type,
          file_size_bytes: file.size
        }
      );
      return NextResponse.json(
        { 
          success: false, 
          message: 'Định dạng file không được hỗ trợ. Vui lòng tải file PDF hoặc DOCX.',
          error: 'UNSUPPORTED_FORMAT' 
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      serverAnalytics.trackAPIRequest(
        '/api/upload/cv',
        'POST',
        400,
        Date.now() - startTime,
        user,
        { 
          error_type: 'FILE_TOO_LARGE',
          file_size_bytes: file.size,
          max_allowed_size: MAX_FILE_SIZE
        }
      );
      return NextResponse.json(
        { 
          success: false, 
          message: 'File vượt quá 10MB. Vui lòng chọn file nhỏ hơn.',
          error: 'FILE_TOO_LARGE' 
        },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Generate unique file ID and path
    const fileId = `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fileExtension = path.extname(file.name)
    const newFileName = `${fileId}${fileExtension}`
    const filePath = path.join(uploadDir, newFileName)

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)

    // Process file to extract text
    const processingStartTime = Date.now();
    const processingResult = await processFile(buffer, file.type)
    const processingDuration = Date.now() - processingStartTime;
    
    let extractedText = ''
    let analysisData = null
    
    if (processingResult.success && processingResult.text) {
      extractedText = processingResult.text
      
      // Track successful parsing
      serverAnalytics.trackCVProcessing(
        'parsing',
        true,
        user,
        processingDuration,
        file.size,
        undefined,
        undefined,
        undefined
      );
      
      // Analyze extracted text
      const analysisStartTime = Date.now();
      analysisData = analyzeExtractedText(extractedText);
      const analysisDuration = Date.now() - analysisStartTime;
      
      // Track analysis completion
      serverAnalytics.trackCVProcessing(
        'analysis',
        true,
        user,
        analysisDuration,
        file.size,
        'local_analysis',
        undefined,
        undefined
      );
    } else {
      // Track parsing failure
      serverAnalytics.trackCVProcessing(
        'parsing',
        false,
        user,
        processingDuration,
        file.size,
        undefined,
        undefined,
        processingResult.error
      );
    }

    // Track database operation
    const dbStartTime = Date.now();
    try {
      await saveCVDraft({
        user_id: userSession.id,
        file_id: fileId,
        file_name: file.name,
        file_size: file.size,
        file_path: filePath,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      serverAnalytics.trackDatabaseOperation(
        'INSERT',
        'cv_drafts',
        Date.now() - dbStartTime,
        true,
        user
      );
    } catch (dbError) {
      serverAnalytics.trackDatabaseOperation(
        'INSERT',
        'cv_drafts',
        Date.now() - dbStartTime,
        false,
        user,
        { error_message: String(dbError) }
      );
      console.warn('⚠️ DB save failed, continuing without DB:', String(dbError))
      // Don't throw - allow upload to succeed without DB
    }

    // Track successful API completion
    serverAnalytics.trackAPIRequest(
      '/api/upload/cv',
      'POST',
      200,
      Date.now() - startTime,
      user,
      {
        file_size_bytes: file.size,
        processing_duration_ms: processingDuration,
        text_extracted: processingResult.success,
        word_count: processingResult.metadata?.wordCount
      }
    );

    // Return success with processing results
    return NextResponse.json({
      success: true,
      message: 'File uploaded and processed successfully',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      processing: {
        textExtracted: processingResult.success,
        wordCount: processingResult.metadata?.wordCount,
        fileType: processingResult.metadata?.fileType,
        analysis: analysisData,
        error: processingResult.error
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    // Track server error
    serverAnalytics.trackAPIRequest(
      '/api/upload/cv',
      'POST',
      500,
      Date.now() - startTime,
      user,
      {
        error_type: 'INTERNAL_ERROR',
        error_message: String(error)
      }
    );
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: 'INTERNAL_ERROR' 
      },
      { status: 500 }
    )
  }
} 