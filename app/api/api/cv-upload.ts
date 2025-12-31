import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { saveCVDraft, validateAuth } from '@/lib/database'

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'INVALID_METHOD'
    })
  }

  try {
    // Validate authentication
    const userId = await validateAuth(req)
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'UNAUTHORIZED'
      })
    }

    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
      uploadDir: path.join(process.cwd(), 'uploads'),
    })

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const [fields, files] = await form.parse(req)
    
    const file = Array.isArray(files.cv) ? files.cv[0] : files.cv
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
        error: 'NO_FILE'
      })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.mimetype || '')) {
      // Clean up uploaded file
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath)
      }
      
      return res.status(400).json({
        success: false,
        message: 'Định dạng file không được hỗ trợ. Vui lòng tải file PDF hoặc DOCX.',
        error: 'UNSUPPORTED_FORMAT'
      })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      // Clean up uploaded file
      if (fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath)
      }
      
      return res.status(400).json({
        success: false,
        message: 'File vượt quá 10MB. Vui lòng chọn file nhỏ hơn.',
        error: 'FILE_TOO_LARGE'
      })
    }

    // Generate unique file ID
    const fileId = `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fileExtension = path.extname(file.originalFilename || '')
    const newFileName = `${fileId}${fileExtension}`
    const newFilePath = path.join(uploadDir, newFileName)

    // Move file to permanent location
    fs.renameSync(file.filepath, newFilePath)

    // Save file reference to database
    await saveCVDraft({
      user_id: userId,
      file_id: fileId,
      file_name: file.originalFilename || '',
      file_size: file.size,
      file_path: newFilePath
    })

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      fileId,
      fileName: file.originalFilename || '',
      fileSize: file.size
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    if (error instanceof Error && error.message.includes('maxFileSize')) {
      return res.status(400).json({
        success: false,
        message: 'File vượt quá 10MB. Vui lòng chọn file nhỏ hơn.',
        error: 'FILE_TOO_LARGE'
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    })
  }
} 