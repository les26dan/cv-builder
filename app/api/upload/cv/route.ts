import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'
import { saveCVDraft } from '@/lib/supabase'
import { processFile, analyzeExtractedText } from '@/lib/fileProcessing'

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
  try {
    // Check authentication
    const cookieStore = await cookies()
    const userSessionCookie = cookieStore.get('user_session')
    
    if (!userSessionCookie?.value) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated', error: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    const userSession = JSON.parse(userSessionCookie.value)
    if (!userSession.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid session', error: 'INVALID_SESSION' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('cv') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded', error: 'NO_FILE' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
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
    const processingResult = await processFile(buffer, file.type)
    
    let extractedText = ''
    let analysisData = null
    
    if (processingResult.success && processingResult.text) {
      extractedText = processingResult.text
      analysisData = analyzeExtractedText(extractedText)
    }

    // Save file reference and extracted data to database
    await saveCVDraft({
      user_id: userSession.id,
      file_id: fileId,
      file_name: file.name,
      file_size: file.size,
      file_path: filePath,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

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