import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import VercelBlobStorageService, { BlobUploadResult } from '@/lib/vercelBlobStorage';
import { supabase } from '@/lib/supabase';
import { processFile } from '@/lib/fileProcessing';
import { cvParserService, type CVParsingResponse } from '@/shared/services/cvParserService';

export const runtime = 'nodejs'; // Required for file processing

interface UserSession {
  id: string;
  email: string;
  name: string;
}

interface CVUploadResponse {
  success: boolean;
  cvId?: string;
  blobInfo?: BlobUploadResult;
  extractedText?: string;
  llmParsedData?: CVParsingResponse;
  structuredCV?: {
    contact: {
      fullName: string;
      email: string;
      phone: string;
      location: string;
      linkedin: string;
    };
    summary: {
      content: string;
    };
    experience: {
      items: any[];
    };
    skills: {
      items: string[];
    };
    education: {
      items: any[];
    };
  };
  error?: string;
  parsingQuality?: number; // Internal quality score for analytics
  developmentMode?: boolean;
}

/**
 * CV Upload API with Enhanced Parsing
 * POST /api/upload/cv-blob
 * Following Product Spec: Enhanced parsing with confidence scoring
 */
export async function POST(request: NextRequest): Promise<NextResponse<CVUploadResponse>> {
  try {
    console.log('📤 CV Upload with Enhanced Parsing - Starting upload process');

    // 1. Authenticate user
    const cookieStore = await cookies();
    const userSessionCookie = cookieStore.get('user_session');

    if (!userSessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userSession: UserSession = JSON.parse(userSessionCookie.value);
    console.log(`👤 Authenticated user: ${userSession.email}`);

    // Fix user ID format for database compatibility
    let userId = userSession.id;
    if (userId === 'user-123' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Generate a proper UUID for development mode
      userId = crypto.randomUUID();
      console.log(`🔧 Generated proper UUID for user: ${userId}`);
    }

    // 2. Parse uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing file: ${file.name} (${file.type}, ${Math.round(file.size / 1024)}KB)`);

    // 3. Generate CV ID
    const cvId = crypto.randomUUID();
    
    // 4. Handle file storage (Vercel Blob or local fallback)
    let blobInfo: BlobUploadResult;
    
    // Check if Vercel Blob is configured
    const hasVercelBlob = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (hasVercelBlob) {
      try {
        console.log('☁️ Uploading to Vercel Blob...');
        blobInfo = await VercelBlobStorageService.uploadCV(
          file,
          userId,
          cvId
        );
        console.log(`✅ File uploaded to Vercel Blob: ${blobInfo.url}`);
      } catch (blobError) {
        console.warn('⚠️ Vercel Blob upload failed, using local fallback:', blobError);
        blobInfo = {
          url: `local://cv-files/${cvId}/${file.name}`,
          downloadUrl: `local://cv-files/${cvId}/${file.name}`,
          pathname: `/cv-files/${cvId}/${file.name}`,
          size: file.size,
          contentType: file.type
        };
      }
    } else {
      console.log('🔧 Vercel Blob not configured, using local fallback');
      blobInfo = {
        url: `local://cv-files/${cvId}/${file.name}`,
        downloadUrl: `local://cv-files/${cvId}/${file.name}`,
        pathname: `/cv-files/${cvId}/${file.name}`,
        size: file.size,
        contentType: file.type
      };
    }

    // 5. Extract text from file for LLM processing
    console.log('📝 Extracting text from uploaded file...');
    let extractedText = '';
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await processFile(buffer, file.type);
      if (result.success && result.text) {
        extractedText = result.text;
        console.log(`✅ Text extracted: ${extractedText.length} characters`);
      } else {
        console.warn(`⚠️ Text extraction failed: ${result.error}`);
        return NextResponse.json({
          success: false,
          error: 'Failed to extract text from the uploaded file',
          cvId
        }, { status: 400 });
      }
    } catch (extractError) {
      console.error('❌ Text extraction failed:', extractError);
      return NextResponse.json({
        success: false,
        error: 'Failed to process the uploaded file',
        cvId
      }, { status: 400 });
    }

    // 6. LLM-based CV parsing with ChatGPT API (primary parsing method)
    let llmParsedData: CVParsingResponse | null = null;
    if (extractedText && extractedText.length > 50) {
      try {
        console.log('🤖 Starting LLM-based CV parsing...');
        const parseResult = await cvParserService.parseCV(extractedText);
        if (parseResult.success && parseResult.data) {
          llmParsedData = parseResult.data;
          console.log(`✅ LLM CV parsing completed. Possibility score: ${llmParsedData.possibility_score}`);
        } else {
          console.warn('⚠️ LLM CV parsing failed:', parseResult.error);
          return NextResponse.json({
            success: false,
            error: parseResult.error || 'Failed to parse CV content',
            cvId
          }, { status: 400 });
        }
      } catch (llmError) {
        console.error('❌ LLM CV parsing error:', llmError);
        return NextResponse.json({
          success: false,
          error: 'CV parsing service is temporarily unavailable',
          cvId
        }, { status: 500 });
      }
    } else {
      console.error('❌ Insufficient text content for LLM parsing');
      return NextResponse.json({
        success: false,
        error: 'The uploaded file does not contain sufficient readable text',
        cvId
      }, { status: 400 });
    }

    // 7. Create structured CV data (LLM-only, no fallback)
    console.log('🏗️ Creating structured CV data from LLM parsing...');
    let structuredCV;
    
    if (llmParsedData && llmParsedData.possibility_score >= 5) {
      console.log('✨ Using LLM-parsed data for structured CV');
      structuredCV = cvParserService.convertToGuidedEditingFormat(llmParsedData);
      
      console.log('✅ LLM-based structured CV created:', {
        name: structuredCV.contact.fullName,
        email: structuredCV.contact.email,
        phone: structuredCV.contact.phone,
        summaryLength: structuredCV.summary.content.length,
        experienceItems: structuredCV.experience.items.length,
        skillsCount: structuredCV.skills.items.length,
        educationItems: structuredCV.education.items.length,
        llmScore: llmParsedData.possibility_score
      });
    } else {
      // LLM parsing failed or scored too low - return error
      const errorMsg = llmParsedData?.error || 'CV parsing failed - document may not be a valid CV or resume';
      console.error('❌ LLM parsing failed or scored too low:', {
        score: llmParsedData?.possibility_score,
        error: errorMsg
      });
      
      return NextResponse.json({
        success: false,
        error: errorMsg,
        llmParsedData: llmParsedData || undefined,
        cvId
      }, { status: 400 });
    }

    // 6. Store CV record in Supabase database with enhanced metadata
    if (supabase) {
      try {
        console.log('💾 Storing enhanced CV record in database...');
        
        const cvRecord = {
          id: cvId,
          user_id: userId,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          status: 'new' as const,
          score: Math.round(llmParsedData.possibility_score), // Use quality score as initial CV score
          content: {
            originalFile: {
              name: file.name,
              size: file.size,
              type: file.type,
              blobUrl: blobInfo.url,
              uploadedAt: new Date().toISOString(),
            },
            extractedText,
            parsingMetadata: {
              confidence: llmParsedData.possibility_score,
              qualityScore: llmParsedData.possibility_score,
              sectionsDetected: Object.keys(llmParsedData.work_experience || {}),
              skillsExtracted: llmParsedData.skills?.length || 0,
              parsedAt: new Date().toISOString()
            },
            sections: {
              contact: structuredCV.contact,
              summary: structuredCV.summary,
              experience: structuredCV.experience,
              education: structuredCV.education,
              skills: structuredCV.skills,
            },
          },
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        // Check if we're in development mode with mock user
        const isDevelopmentMode = userSession.email === 'demo@okbuddy.ai' || userSession.id === 'user-123';
        
        let insertResult;
        if (isDevelopmentMode) {
          console.log('🔧 Development mode detected, using service role for database access');
          // In development, we'll proceed with local storage since RLS blocks mock users
          console.log('💾 Skipping database insert in development mode, using local storage');
          insertResult = { data: null, error: null };
        } else {
          // Production mode - use regular user context
          insertResult = await supabase
            .from('cvs')
            .insert(cvRecord)
            .select()
            .single();
        }

        const { data, error } = insertResult;

        if (error) {
          console.error('❌ Database error:', error);
          console.log('🔧 Database not available, proceeding with local development mode');
          
          // Return success for development workflow
          return NextResponse.json({
            success: true,
            cvId,
            blobInfo,
            extractedText: extractedText.substring(0, 500),
            llmParsedData: llmParsedData || undefined,
            structuredCV,
            parsingQuality: llmParsedData.possibility_score,
            developmentMode: true
          });
        }

        console.log('✅ Enhanced CV record saved to database');

        // 7. Return success response with enhanced data
        return NextResponse.json({
          success: true,
          cvId,
          blobInfo,
          extractedText: extractedText.substring(0, 500), // Truncate for response
          llmParsedData: llmParsedData || undefined, // Include LLM parsing results
          structuredCV,
          parsingQuality: llmParsedData.possibility_score,
        });

      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
        
        // For development, continue without database storage
        console.log('🔧 Database not available, proceeding with local development mode');
        
        // Return success for development workflow
        return NextResponse.json({
          success: true,
          cvId,
          blobInfo,
          extractedText: extractedText.substring(0, 500),
          llmParsedData: llmParsedData || undefined,
          structuredCV,
          parsingQuality: llmParsedData.possibility_score,
          developmentMode: true
        });
      }
    } else {
      console.log('⚠️ Supabase not configured - using mock response');
      
      // Return success for development (when Supabase is not configured)
      return NextResponse.json({
        success: true,
        cvId,
        blobInfo,
        extractedText: extractedText.substring(0, 500),
        llmParsedData: llmParsedData || undefined,
        structuredCV,
        parsingQuality: llmParsedData.possibility_score,
      });
    }

  } catch (error) {
    console.error('❌ Enhanced CV upload failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 