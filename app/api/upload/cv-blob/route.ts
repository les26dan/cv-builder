import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import VercelBlobStorageService, { BlobUploadResult } from '@/lib/vercelBlobStorage';
import { supabase } from '@/lib/supabase';
import { processFile } from '@/lib/fileProcessing';

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
  error?: string;
}

/**
 * CV Upload API with Vercel Blob Storage
 * POST /api/upload/cv-blob
 */
export async function POST(request: NextRequest): Promise<NextResponse<CVUploadResponse>> {
  try {
    console.log('📤 CV Upload with Vercel Blob - Starting upload process');

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
    
    // 4. Upload to Vercel Blob
    console.log('☁️ Uploading to Vercel Blob...');
    const blobInfo: BlobUploadResult = await VercelBlobStorageService.uploadCV(
      file,
      userSession.id,
      cvId
    );

    console.log(`✅ File uploaded to Vercel Blob: ${blobInfo.url}`);

    // 5. Extract text content from uploaded file
    let extractedText = '';
    try {
      console.log('📝 Extracting text from uploaded file...');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await processFile(buffer, file.type);
      if (result.success && result.text) {
        extractedText = result.text;
        console.log(`✅ Text extracted: ${extractedText.length} characters`);
      } else {
        console.warn(`⚠️ Text extraction failed: ${result.error}`);
      }
    } catch (extractError) {
      console.warn('⚠️ Text extraction failed:', extractError);
      // Continue without extracted text - not critical
    }

    // 6. Store CV record in Supabase database
    if (supabase) {
      try {
        console.log('💾 Storing CV record in database...');
        
        const cvRecord = {
          id: cvId,
          user_id: userSession.id,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
          status: 'new' as const,
          score: 0,
          content: {
            originalFile: {
              name: file.name,
              size: file.size,
              type: file.type,
              blobUrl: blobInfo.url,
              uploadedAt: new Date().toISOString(),
            },
            extractedText,
            sections: {
              contact: { fullName: '', email: '', phone: '' },
              summary: { content: '' },
              experience: { items: [] },
              education: { items: [] },
              skills: { items: [] },
            },
          },
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('cvs')
          .insert(cvRecord)
          .select()
          .single();

        if (error) {
          console.error('❌ Database error:', error);
          // Try to cleanup uploaded file if database fails
          try {
            await VercelBlobStorageService.deleteCV(blobInfo.url);
          } catch (cleanupError) {
            console.error('❌ Cleanup failed:', cleanupError);
          }
          
          return NextResponse.json(
            { success: false, error: 'Failed to save CV record' },
            { status: 500 }
          );
        }

        console.log('✅ CV record saved to database');

        // 7. Return success response
        return NextResponse.json({
          success: true,
          cvId,
          blobInfo,
          extractedText: extractedText.substring(0, 500), // Truncate for response
        });

      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
        
        // Cleanup uploaded file
        try {
          await VercelBlobStorageService.deleteCV(blobInfo.url);
        } catch (cleanupError) {
          console.error('❌ Cleanup failed:', cleanupError);
        }

        return NextResponse.json(
          { success: false, error: 'Database operation failed' },
          { status: 500 }
        );
      }
    } else {
      console.log('⚠️ Supabase not configured - using mock response');
      
      // Return success for development (when Supabase is not configured)
      return NextResponse.json({
        success: true,
        cvId,
        blobInfo,
        extractedText: extractedText.substring(0, 500),
      });
    }

  } catch (error) {
    console.error('❌ CV upload failed:', error);
    
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