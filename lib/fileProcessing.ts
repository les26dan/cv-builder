// Dynamic imports to avoid build issues
const pdfParse = async () => {
  try {
    const { default: parse } = await import('pdf-parse')
    return parse
  } catch (error) {
    console.error('Failed to load pdf-parse:', error)
    throw new Error('PDF processing library not available')
  }
}

const mammoth = async () => {
  try {
    const mammothLib = await import('mammoth')
    return mammothLib.default
  } catch (error) {
    console.error('Failed to load mammoth:', error)
    throw new Error('DOCX processing library not available')
  }
}

export interface ProcessedFileResult {
  success: boolean
  text?: string
  error?: string
  metadata?: {
    pageCount?: number
    wordCount?: number
    fileType: string
  }
}

/**
 * Extract text from PDF files using pdf-parse
 */
async function extractPDFText(buffer: Buffer): Promise<ProcessedFileResult> {
  try {
    const parse = await pdfParse()
    const data = await parse(buffer)
    
    return {
      success: true,
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        fileType: 'pdf'
      }
    }
  } catch (error) {
    console.error('PDF extraction error:', error)
    return {
      success: false,
      error: 'Failed to extract text from PDF file'
    }
  }
}

/**
 * Extract text from DOCX files using mammoth
 */
async function extractDOCXText(buffer: Buffer): Promise<ProcessedFileResult> {
  try {
    const mammothLib = await mammoth()
    const result = await mammothLib.extractRawText({ buffer })
    
    return {
      success: true,
      text: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        fileType: 'docx'
      }
    }
  } catch (error) {
    console.error('DOCX extraction error:', error)
    return {
      success: false,
      error: 'Failed to extract text from DOCX file'
    }
  }
}

/**
 * Extract text from DOC files using mammoth
 */
async function extractDOCText(buffer: Buffer): Promise<ProcessedFileResult> {
  try {
    const mammothLib = await mammoth()
    const result = await mammothLib.extractRawText({ buffer })
    
    return {
      success: true,
      text: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        fileType: 'doc'
      }
    }
  } catch (error) {
    console.error('DOC extraction error:', error)
    return {
      success: false,
      error: 'Failed to extract text from DOC file'
    }
  }
}

/**
 * Main file processing function that handles different file types
 */
export async function processFile(buffer: Buffer, mimeType: string): Promise<ProcessedFileResult> {
  switch (mimeType) {
    case 'application/pdf':
      return extractPDFText(buffer)
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDOCXText(buffer)
    
    case 'application/msword':
      return extractDOCText(buffer)
    
    default:
      return {
        success: false,
        error: `Unsupported file type: ${mimeType}`
      }
  }
}

/**
 * Basic CV text analysis to extract structured information
 */
export function analyzeExtractedText(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Basic extraction patterns
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const phonePattern = /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g
  
  const emails = text.match(emailPattern) || []
  const phones = text.match(phonePattern) || []
  
  return {
    emails,
    phones,
    lineCount: lines.length,
    estimatedSections: {
      hasContact: emails.length > 0 || phones.length > 0,
      hasExperience: text.toLowerCase().includes('experience') || text.toLowerCase().includes('work'),
      hasEducation: text.toLowerCase().includes('education') || text.toLowerCase().includes('university'),
      hasSkills: text.toLowerCase().includes('skills') || text.toLowerCase().includes('technical')
    }
  }
} 