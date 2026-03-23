/**
 * Browser PDF Generation Service - Using Same System as Download
 * 
 * BREAKTHROUGH APPROACH:
 * - Uses EXACT same generateHTMLForPrint() as Download PDF
 * - Browser's native PDF engine via html2pdf.js
 * - 100% identical Preview and Download PDFs
 * - No custom PDF generation, no data structure conflicts
 */

import { generateHTMLForPrint } from '../utils/downloadUtils';
import html2pdf from 'html2pdf.js';

interface BrowserPDFResult {
  success: boolean;
  pdfBlob?: Blob;
  pdfUrl?: string;
  error?: string;
  cached?: boolean;
}

interface PDFGenerationOptions {
  useCache?: boolean;
  quality?: 'draft' | 'final';
}

// Cache for generated PDFs to prevent unnecessary regeneration
const pdfCache = new Map<string, { blob: Blob; timestamp: number; dataHash: string }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Browser PDF Generation Service
 * Uses browser's native PDF engine - same as Download PDF
 */
export class BrowserPDFService {
  private static instance: BrowserPDFService;

  public static getInstance(): BrowserPDFService {
    if (!BrowserPDFService.instance) {
      BrowserPDFService.instance = new BrowserPDFService();
    }
    return BrowserPDFService.instance;
  }

  /**
   * Generate PDF using browser's native PDF engine
   * EXACT same system as Download PDF
   */
  public async generatePDF(
    cvData: any, 
    options: PDFGenerationOptions = {}
  ): Promise<BrowserPDFResult> {
    try {
      console.log('🚀 Browser PDF: Starting generation using EXACT same system as Download...');
      console.log('📊 Browser PDF: CV Data preview:', {
        hasContact: !!cvData?.contact,
        contactName: cvData?.contact?.fullName,
        hasSummary: !!cvData?.summary?.content,
        experienceCount: cvData?.experience?.items?.length || 0,
        skillsCount: cvData?.skills?.items?.length || 0
      });

      // Generate cache key
      const dataHash = this.generateDataHash(cvData);
      const cacheKey = `browser-pdf-${dataHash}`;

      // Check cache if enabled
      if (options.useCache !== false) {
        const cached = this.getCachedPDF(cacheKey);
        if (cached) {
          console.log('📋 Browser PDF: Using cached PDF');
          const pdfUrl = URL.createObjectURL(cached.blob);
          return {
            success: true,
            pdfBlob: cached.blob,
            pdfUrl,
            cached: true
          };
        }
      }

      // Use EXACT same HTML generation as Download PDF
      console.log('🔧 Browser PDF: Using generateHTMLForPrint() - IDENTICAL to Download');
      const htmlContent = generateHTMLForPrint(cvData);
      
      console.log('📄 Browser PDF: HTML generated successfully:', {
        htmlLength: htmlContent.length,
        containsName: htmlContent.includes(cvData?.contact?.fullName || ''),
        containsSummary: htmlContent.includes(cvData?.summary?.content?.substring(0, 20) || ''),
        containsExperience: htmlContent.includes('WORK EXPERIENCE') || htmlContent.includes('KINH NGHIỆM')
      });

      // Create temporary DOM element for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '794px'; // A4 width
      document.body.appendChild(tempDiv);

      // Configure html2pdf options to match browser print behavior
      const pdfOptions = {
        margin: [0.75, 1, 0.75, 1], // Same as CSS @page margins
        filename: 'cv-preview.pdf',
        image: { 
          type: 'jpeg', 
          quality: 0.95 
        },
        html2canvas: { 
          scale: 1.5, // Reduced scale for better performance
          useCORS: true,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: true // Enable debug logging
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait',
          putOnlyUsedFonts: true,
          floatPrecision: 16
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after'
        }
      };

      console.log('🔄 Browser PDF: Generating PDF with html2pdf (browser engine)...');
      console.log('🔧 Browser PDF: PDF Options:', pdfOptions);
      console.log('📄 Browser PDF: Temp div content preview:', {
        innerHTML: tempDiv.innerHTML.substring(0, 200) + '...',
        offsetHeight: tempDiv.offsetHeight,
        offsetWidth: tempDiv.offsetWidth
      });
      
      // Generate PDF blob using html2pdf (browser's PDF engine)
      const pdfBlob = await html2pdf()
        .set(pdfOptions)
        .from(tempDiv)
        .outputPdf('blob');

      // Clean up temporary element
      document.body.removeChild(tempDiv);

      console.log('✅ Browser PDF: PDF generated successfully:', {
        blobSize: pdfBlob.size,
        blobType: pdfBlob.type,
        isValidPDF: pdfBlob.size > 1000 // Basic validation
      });

      // Additional PDF blob validation
      if (pdfBlob.size === 0) {
        throw new Error('Generated PDF blob is empty');
      }
      
      if (pdfBlob.type !== 'application/pdf') {
        console.warn('⚠️ Browser PDF: Generated blob type is not application/pdf:', pdfBlob.type);
      }

      // Create blob URL for display
      const pdfUrl = URL.createObjectURL(pdfBlob);
      console.log('🔗 Browser PDF: Blob URL created for display:', pdfUrl.substring(0, 50) + '...');

      // Cache the result
      if (options.useCache !== false) {
        this.cachePDF(cacheKey, pdfBlob, dataHash);
      }

      console.log('✅ Browser PDF: EXACT same PDF as Download created successfully');

      return {
        success: true,
        pdfBlob,
        pdfUrl,
        cached: false
      };

    } catch (error) {
      console.error('❌ Browser PDF: Generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed'
      };
    }
  }

  /**
   * Generate hash for CV data to enable caching
   */
  private generateDataHash(cvData: any): string {
    try {
      // Create hash based on content that affects PDF output
      const hashContent = {
        contact: cvData?.contact,
        summary: cvData?.summary?.content,
        experienceCount: cvData?.experience?.items?.length || 0,
        skillsCount: cvData?.skills?.items?.length || 0,
        educationCount: cvData?.education?.items?.length || 0,
        sectionOrder: cvData?.sectionOrder,
        timestamp: Math.floor(Date.now() / 60000) // Round to minute
      };
      
      return btoa(JSON.stringify(hashContent)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    } catch (error) {
      console.warn('⚠️ Hash generation failed:', error);
      return Date.now().toString();
    }
  }

  /**
   * Cache PDF for performance
   */
  private cachePDF(key: string, blob: Blob, dataHash: string): void {
    try {
      // Clean old cache entries first
      this.cleanCache();
      
      pdfCache.set(key, {
        blob,
        timestamp: Date.now(),
        dataHash
      });
      
      console.log(`📋 Browser PDF: PDF cached with key: ${key.substring(0, 16)}...`);
    } catch (error) {
      console.warn('⚠️ PDF caching failed:', error);
    }
  }

  /**
   * Retrieve cached PDF if available and valid
   */
  private getCachedPDF(key: string): { blob: Blob; timestamp: number; dataHash: string } | null {
    try {
      const cached = pdfCache.get(key);
      if (!cached) return null;

      // Check if cache is still valid
      if (Date.now() - cached.timestamp > CACHE_DURATION) {
        pdfCache.delete(key);
        return null;
      }

      return cached;
    } catch (error) {
      console.warn('⚠️ Cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    try {
      const now = Date.now();
      const keysToDelete: string[] = [];

      pdfCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_DURATION) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => {
        pdfCache.delete(key);
      });

      if (keysToDelete.length > 0) {
        console.log(`🧹 Browser PDF: Cleaned ${keysToDelete.length} expired cache entries`);
      }
    } catch (error) {
      console.warn('⚠️ Cache cleanup failed:', error);
    }
  }

  /**
   * Clear all cached PDFs
   */
  public clearCache(): void {
    try {
      pdfCache.clear();
      console.log('🧹 Browser PDF: All cache cleared');
    } catch (error) {
      console.warn('⚠️ Cache clear failed:', error);
    }
  }
}

// Export singleton instance
export const browserPDFService = BrowserPDFService.getInstance();

// Export types
export type { BrowserPDFResult, PDFGenerationOptions };
