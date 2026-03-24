import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import VercelBlobStorageService, { BlobUploadResult } from '@/lib/vercelBlobStorage';
import { supabase, getCVWithOwnership } from '@/lib/supabase';

export const runtime = 'nodejs'; // Required for PDF generation

interface UserSession {
  id: string;
  email: string;
  name: string;
}

interface CVDownloadResponse {
  success: boolean;
  downloadUrl?: string;
  blobInfo?: BlobUploadResult;
  error?: string;
}

/**
 * CV Download API with Vercel Blob Storage
 * POST /api/download/cv-blob
 */
export async function POST(request: NextRequest): Promise<NextResponse<CVDownloadResponse>> {
  try {
    console.log('📥 CV Download with Vercel Blob - Starting download process');

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

    // 2. Parse request data
    const body = await request.json();
    const { cvId, format = 'pdf' } = body;

    if (!cvId) {
      return NextResponse.json(
        { success: false, error: 'CV ID is required' },
        { status: 400 }
      );
    }

    if (!['pdf', 'docx', 'latex'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Only pdf, docx, and latex are supported' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing download request: CV ${cvId} as ${format}`);

    // 3. Verify CV ownership and get CV data
    const cvData = await getCVWithOwnership(cvId, userSession.id);
    
    if (!cvData) {
      return NextResponse.json(
        { success: false, error: 'CV not found or access denied' },
        { status: 404 }
      );
    }

    console.log(`✅ CV found: ${cvData.title}`);

    // 4. Generate CV content
    console.log('🔄 Generating CV file...');
    const cvBlob = await generateCVFile(cvData, format);

    if (!cvBlob) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate CV file' },
        { status: 500 }
      );
    }

    console.log(`✅ CV file generated (${Math.round(cvBlob.size / 1024)}KB)`);

    // 5. Store generated CV in Vercel Blob
    console.log('☁️ Storing generated CV in Vercel Blob...');
    const blobInfo: BlobUploadResult = await VercelBlobStorageService.storeGeneratedCV(
      cvBlob,
      userSession.id,
      cvId,
      format as 'pdf' | 'docx' | 'latex'
    );

    console.log(`✅ Generated CV stored: ${blobInfo.url}`);

    // 6. Update CV record with download info (optional)
    if (supabase) {
      try {
        const currentContent = cvData.content || {};
        const currentGeneratedFiles = (currentContent as any)?.generatedFiles || {};
        
        const updateData = {
          content: {
            ...currentContent,
            generatedFiles: {
              ...currentGeneratedFiles,
              [`${format}_${Date.now()}`]: {
                format,
                blobUrl: blobInfo.url,
                size: blobInfo.size,
                generatedAt: new Date().toISOString(),
              },
            },
          },
          last_updated: new Date().toISOString(),
        };

        await supabase
          .from('cvs')
          .update(updateData)
          .eq('id', cvId);

        console.log('✅ CV record updated with download info');
      } catch (updateError) {
        console.warn('⚠️ Failed to update CV record:', updateError);
        // Don't fail the download if update fails
      }
    }

    // 7. Return download URL
    return NextResponse.json({
      success: true,
      downloadUrl: blobInfo.downloadUrl || blobInfo.url,
      blobInfo,
    });

  } catch (error) {
    console.error('❌ CV download failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Download failed' 
      },
      { status: 500 }
    );
  }
}

/**
 * Generate CV file as Blob
 * @param cvData CV data from database
 * @param format File format (pdf or docx)
 * @returns Generated file as Blob
 */
async function generateCVFile(cvData: any, format: string): Promise<Blob | null> {
  try {
    if (format === 'pdf') {
      return await generatePDFCV(cvData);
    } else if (format === 'docx') {
      return await generateDOCXCV(cvData);
    } else if (format === 'latex') {
      return await generateLatexCV(cvData);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error generating CV file:', error);
    return null;
  }
}

/**
 * Generate PDF CV (simplified version for demo)
 */
async function generatePDFCV(cvData: any): Promise<Blob> {
  // For now, create a simple text-based PDF
  // In production, you'd use a library like jsPDF or Puppeteer
  
  const content = `
CV: ${cvData.title}

Contact Information:
${cvData.content?.sections?.contact?.fullName || 'Not provided'}
${cvData.content?.sections?.contact?.email || 'Not provided'}
${cvData.content?.sections?.contact?.phone || 'Not provided'}

Summary:
${cvData.content?.sections?.summary?.content || 'Not provided'}

Experience:
${cvData.content?.sections?.experience?.items?.map((exp: any) => 
  `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})`
).join('\n') || 'Not provided'}

Education:
${cvData.content?.sections?.education?.items?.map((edu: any) => 
  `- ${edu.degree} from ${edu.institution} (${edu.year})`
).join('\n') || 'Not provided'}

Skills:
${cvData.content?.sections?.skills?.items?.map((skill: any) => 
  `- ${skill.name} (${skill.level})`
).join('\n') || 'Not provided'}

Generated on: ${new Date().toLocaleString()}
  `.trim();

  // Create a simple PDF-like blob (in reality, you'd use proper PDF generation)
  return new Blob([content], { type: 'application/pdf' });
}

/**
 * Generate DOCX CV using proper docx library
 */
async function generateDOCXCV(cvData: any): Promise<Blob> {
  // Use the same DOCX generation from downloadUtils
  const { generateDOCXContent } = await import('@/utils/downloadUtils');
  
  // Transform the server CV data format to match client format
  const clientFormatData = transformServerDataToClientFormat(cvData);
  
  return await generateDOCXContent(clientFormatData);
}

/**
 * Transform server CV data format to client format
 */
function transformServerDataToClientFormat(cvData: any): any {
  const sections = cvData.content?.sections || {};
  
  return {
    sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
    sectionTitles: {
      contact: 'Contact Information',
      summary: 'Professional Summary', 
      experience: 'Work Experience',
      skills: 'Skills',
      education: 'Education'
    },
    contact: {
      fullName: sections.contact?.fullName || sections.contact?.name,
      email: sections.contact?.email,
      phone: sections.contact?.phone,
      location: sections.contact?.location,
      linkedin: sections.contact?.linkedin
    },
    summary: {
      content: sections.summary?.content
    },
    experience: {
      items: sections.experience?.items?.map((exp: any) => ({
        title: exp.position || exp.title,
        company: exp.company,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        current: exp.current,
        bullets: exp.bullets || []
      })) || []
    },
    skills: {
      items: sections.skills?.items || []
    },
    education: {
      items: sections.education?.items?.map((edu: any) => ({
        degree: edu.degree,
        institution: edu.institution,
        location: edu.location,
        graduationDate: edu.year || edu.graduationDate
      })) || []
    },
    projects: {
      items: sections.projects?.items || []
    }
  };
}

/**
 * Generate LaTeX CV
 */
async function generateLatexCV(cvData: any): Promise<Blob> {
  // Import the LaTeX generation function from utils
  const { generateLatexContent } = await import('@/utils/downloadUtils');
  
  const latexContent = generateLatexContent(cvData);
  
  return new Blob([latexContent], { 
    type: 'text/x-tex' 
  });
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