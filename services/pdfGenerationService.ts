/**
 * PDF Generation Service for Real-time CV Preview
 * 
 * SAFETY DESIGN:
 * - Completely isolated service - no modifications to existing code
 * - Uses existing libraries (jspdf, pdf-lib, pdfjs-dist)
 * - Comprehensive error handling with fallbacks
 * - Caching to prevent unnecessary regeneration
 * - Follows OkBuddy tenet: "Working functionality over perfect types"
 */

import { CVData } from '../shared/types/workflow';

// PDF generation libraries (already installed)
let jsPDF: any = null;
let pdfLib: any = null;
let pdfjsLib: any = null;

// Cache for generated PDFs to prevent unnecessary regeneration
const pdfCache = new Map<string, { blob: Blob; timestamp: number; dataHash: string }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (same as existing system)

interface PDFGenerationResult {
  success: boolean;
  pdfBlob?: Blob;
  pdfUrl?: string;
  error?: string;
  cached?: boolean;
}

interface PDFGenerationOptions {
  useCache?: boolean;
  quality?: 'draft' | 'final';
  pageSize?: 'A4' | 'Letter';
}

/**
 * PDF Generation Service Class
 * Handles real-time PDF generation for CV preview
 */
export class PDFGenerationService {
  private static instance: PDFGenerationService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Singleton pattern for service instance
   */
  public static getInstance(): PDFGenerationService {
    if (!PDFGenerationService.instance) {
      PDFGenerationService.instance = new PDFGenerationService();
    }
    return PDFGenerationService.instance;
  }

  /**
   * Initialize PDF libraries with error handling
   * SAFETY: Multiple fallback strategies, no breaking changes
   */
  private async initializeLibraries(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🔧 PDFGenerationService: Initializing PDF libraries...');

      // Initialize jsPDF (primary library for generation)
      try {
        const jsPDFModule = await import('jspdf');
        jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
        console.log('✅ jsPDF loaded successfully');
      } catch (error) {
        console.warn('⚠️ jsPDF failed to load:', error);
      }

      // Initialize pdf-lib (advanced PDF manipulation)
      try {
        pdfLib = await import('pdf-lib');
        console.log('✅ pdf-lib loaded successfully');
      } catch (error) {
        console.warn('⚠️ pdf-lib failed to load:', error);
      }

      // Initialize PDF.js (for rendering)
      try {
        pdfjsLib = await import('pdfjs-dist');
        console.log('✅ pdfjs-dist loaded successfully');
      } catch (error) {
        console.warn('⚠️ pdfjs-dist failed to load:', error);
      }

      this.isInitialized = true;
      console.log('✅ PDFGenerationService: All libraries initialized');

    } catch (error) {
      console.error('❌ PDFGenerationService: Initialization failed:', error);
      throw new Error('Failed to initialize PDF libraries');
    }
  }

  /**
   * Generate PDF from CV data with comprehensive error handling
   * SAFETY: Multiple fallback strategies, graceful degradation
   */
  public async generatePDF(
    cvData: CVData, 
    options: PDFGenerationOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      // Initialize libraries if needed
      await this.initializeLibraries();

      // Generate cache key for deduplication
      const dataHash = this.generateDataHash(cvData);
      const cacheKey = `${cvData.id || 'unknown'}-${dataHash}`;

      // Check cache first (if enabled)
      if (options.useCache !== false) {
        const cached = this.getCachedPDF(cacheKey);
        if (cached) {
          return {
            success: true,
            pdfBlob: cached.blob,
            pdfUrl: URL.createObjectURL(cached.blob),
            cached: true
          };
        }
      }

      // Primary generation strategy: jsPDF
      if (jsPDF) {
        try {
          console.log('📄 PDFGenerationService: Attempting jsPDF generation...');
          const result = await this.generateWithJsPDF(cvData, options);
          console.log('📄 PDFGenerationService: jsPDF result:', {
            success: result.success,
            hasPdfBlob: !!result.pdfBlob,
            blobSize: result.pdfBlob?.size || 0,
            error: result.error
          });
          
          if (result.success && result.pdfBlob) {
            // Cache successful result
            this.cachePDF(cacheKey, result.pdfBlob, dataHash);
            return result;
          }
        } catch (error) {
          console.warn('⚠️ jsPDF generation failed, trying fallback:', error);
        }
      } else {
        console.warn('⚠️ PDFGenerationService: jsPDF not available');
      }

      // Fallback strategy: pdf-lib
      if (pdfLib) {
        try {
          console.log('📄 PDFGenerationService: Attempting pdf-lib generation...');
          const result = await this.generateWithPdfLib(cvData, options);
          console.log('📄 PDFGenerationService: pdf-lib result:', {
            success: result.success,
            hasPdfBlob: !!result.pdfBlob,
            blobSize: result.pdfBlob?.size || 0,
            error: result.error
          });
          
          if (result.success && result.pdfBlob) {
            this.cachePDF(cacheKey, result.pdfBlob, dataHash);
            return result;
          }
        } catch (error) {
          console.warn('⚠️ pdf-lib generation failed:', error);
        }
      } else {
        console.warn('⚠️ PDFGenerationService: pdf-lib not available');
      }

      // Final fallback: Return error but don't break the system
      console.error('❌ PDFGenerationService: All generation methods failed');
      return {
        success: false,
        error: 'PDF generation libraries not available. Please refresh the page.'
      };

    } catch (error) {
      console.error('❌ PDFGenerationService: PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown PDF generation error'
      };
    }
  }

  /**
   * Generate PDF using jsPDF library
   * SAFETY: Comprehensive error handling, matches existing template exactly
   */
  private async generateWithJsPDF(
    cvData: CVData, 
    options: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      console.log('📄 jsPDF: Starting PDF generation with jsPDF...');
      console.log('📄 jsPDF: CV Data for generation (using DennisSchroderTemplate format):', {
        contactName: cvData.contact?.fullName,
        summaryContent: cvData.summary?.content,
        summaryLength: cvData.summary?.content?.length || 0,
        experienceItems: cvData.experience?.items?.length || 0,
        skillsItems: cvData.skills?.items?.length || 0,
        educationItems: cvData.education?.items?.length || 0
      });

      // Create new PDF document (A4 size, portrait)
      console.log('📄 jsPDF: Creating new PDF document...');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      console.log('📄 jsPDF: PDF document created successfully');

      // PDF dimensions (A4: 210mm x 297mm)
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 19; // Same as DennisSchroderTemplate
      const contentWidth = pageWidth - (2 * margin);
      
      let yPosition = margin;

      // Helper function to add text with wrapping
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const fontSize = options.fontSize || 12;
        const maxWidth = options.maxWidth || contentWidth;
        
        doc.setFontSize(fontSize);
        if (options.fontStyle) {
          doc.setFont(undefined, options.fontStyle);
        }
        
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        
        return y + (lines.length * fontSize * 0.35); // Line height calculation
      };

      // 1. CONTACT SECTION (exactly matching template)
      if (cvData.contact?.fullName) {
        // Name (centered, large, bold)
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        const nameWidth = doc.getTextWidth(cvData.contact.fullName);
        doc.text(cvData.contact.fullName, (pageWidth - nameWidth) / 2, yPosition);
        yPosition += 12;

        // Contact info (centered, smaller)
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        const contactInfo = [];
        if (cvData.contact.email) contactInfo.push(cvData.contact.email);
        if (cvData.contact.phone) contactInfo.push(cvData.contact.phone);
        if (cvData.contact.location) contactInfo.push(cvData.contact.location);
        if (cvData.contact.linkedin) contactInfo.push(cvData.contact.linkedin);
        
        contactInfo.forEach(info => {
          const infoWidth = doc.getTextWidth(info);
          doc.text(info, (pageWidth - infoWidth) / 2, yPosition);
          yPosition += 5;
        });
        
        yPosition += 10; // Space after contact
      }

      // 2. SUMMARY SECTION
      const summaryContent = cvData.summary?.content;
      
      if (summaryContent && summaryContent.trim()) {
        console.log('📄 jsPDF: Adding summary section:', summaryContent.substring(0, 50) + '...');
        yPosition = addText(summaryContent, margin, yPosition, {
          fontSize: 14,
          maxWidth: contentWidth
        });
        yPosition += 15;
      }

      // 3. WORK EXPERIENCE SECTION
      if (cvData.experience?.items?.length > 0) {
        // Section header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('WORK EXPERIENCE', margin, yPosition);
        
        // Underline
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition + 2, margin + contentWidth, yPosition + 2);
        yPosition += 12;

        // Experience items
        cvData.experience.items.forEach((exp: any) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          // Job title and company (bold)
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          const jobTitle = `${exp.title} at ${exp.company}`;
          yPosition = addText(jobTitle, margin, yPosition, { fontSize: 14 });
          
          // Date and location
          doc.setFontSize(12);
          doc.setFont(undefined, 'normal');
          const dateRange = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
          const locationText = exp.location ? ` | ${exp.location}` : '';
          yPosition = addText(dateRange + locationText, margin, yPosition, { fontSize: 12 });
          yPosition += 3;

          // Bullets
          if (exp.bullets?.length > 0) {
            exp.bullets.forEach((bullet: string) => {
              if (bullet.trim()) {
                yPosition = addText(`• ${bullet}`, margin + 5, yPosition, { 
                  fontSize: 12,
                  maxWidth: contentWidth - 5
                });
                yPosition += 2;
              }
            });
          }
          
          yPosition += 8; // Space between jobs
        });
      }

      // 4. SKILLS SECTION - EXACT SAME ACCESS AS DennisSchroderTemplate
      if (cvData.skills?.items?.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Section header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('SKILLS', margin, yPosition);
        
        // Underline
        doc.line(margin, yPosition + 2, margin + contentWidth, yPosition + 2);
        yPosition += 12;

        // Skills list - handle both string and object formats like DennisSchroderTemplate
        const skillsText = cvData.skills.items
          .map((skill: any) => typeof skill === 'string' ? skill : skill.name || skill)
          .filter(skill => skill && skill.trim())
          .join(' | ');
        
        if (skillsText) {
          yPosition = addText(skillsText, margin, yPosition, {
            fontSize: 12,
            maxWidth: contentWidth
          });
        }
        yPosition += 15;
      }

      // 5. EDUCATION SECTION
      if (cvData.education?.items?.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        // Section header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('EDUCATION', margin, yPosition);
        
        // Underline
        doc.line(margin, yPosition + 2, margin + contentWidth, yPosition + 2);
        yPosition += 12;

        // Education items
        cvData.education.items.forEach((edu: any) => {
          if (edu.degree || edu.institution) {
            // Degree and institution
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            const eduTitle = `${edu.degree} - ${edu.institution}`;
            yPosition = addText(eduTitle, margin, yPosition, { fontSize: 14 });
            
            // Date and location
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            const eduDetails = [];
            if (edu.graduationDate) eduDetails.push(edu.graduationDate);
            if (edu.location) eduDetails.push(edu.location);
            
            if (eduDetails.length > 0) {
              yPosition = addText(eduDetails.join(' | '), margin, yPosition, { fontSize: 12 });
            }
            
            yPosition += 8;
          }
        });
      }

      // 6. LANGUAGES SECTION - Handle dynamic sections like DennisSchroderTemplate
      const languagesSection = cvData.languages || cvData['languages-custom'] || cvData['languages-1'];
      if (languagesSection?.items?.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        console.log('📄 jsPDF: Adding languages section:', languagesSection.items.length, 'languages');
        
        // Section header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('LANGUAGES', margin, yPosition);
        
        // Underline
        doc.line(margin, yPosition + 2, margin + contentWidth, yPosition + 2);
        yPosition += 12;

        // Languages list - handle both string and object formats
        languagesSection.items.forEach((lang: any) => {
          let langText = '';
          if (typeof lang === 'string') {
            langText = lang;
          } else if (lang.name) {
            langText = lang.proficiency ? `${lang.name} (${lang.proficiency})` : lang.name;
          }
          
          if (langText.trim()) {
            yPosition = addText(`• ${langText}`, margin + 5, yPosition, {
              fontSize: 12,
              maxWidth: contentWidth - 5
            });
            yPosition += 3;
          }
        });
        yPosition += 10;
      }

      // 7. CERTIFICATIONS SECTION - Handle dynamic sections like DennisSchroderTemplate
      const certificationsSection = cvData.certifications || cvData['certifications-custom'] || cvData['certifications-1'];
      if (certificationsSection?.items?.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }

        console.log('📄 jsPDF: Adding certifications section:', certificationsSection.items.length, 'certifications');
        
        // Section header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('CERTIFICATIONS', margin, yPosition);
        
        // Underline
        doc.line(margin, yPosition + 2, margin + contentWidth, yPosition + 2);
        yPosition += 12;

        // Certifications list - handle both string and object formats
        certificationsSection.items.forEach((cert: any) => {
          if (typeof cert === 'string') {
            yPosition = addText(`• ${cert}`, margin + 5, yPosition, {
              fontSize: 12,
              maxWidth: contentWidth - 5
            });
            yPosition += 3;
          } else if (cert.name || cert.title) {
            // Certification name
            const certName = cert.name || cert.title;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            yPosition = addText(certName, margin, yPosition, { fontSize: 14 });
            
            // Issuer and date
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            const certDetails = [];
            if (cert.issuer) certDetails.push(cert.issuer);
            if (cert.date) certDetails.push(cert.date);
            
            if (certDetails.length > 0) {
              yPosition = addText(certDetails.join(' | '), margin, yPosition, { fontSize: 12 });
            }
            
            yPosition += 8;
          }
        });
        yPosition += 5;
      }

      // 8. CUSTOM SECTIONS
      // Process any additional dynamic sections
      Object.keys(cvData).forEach(sectionKey => {
        const section = cvData[sectionKey];
        
        // Skip known sections and non-section data
        if (['contact', 'summary', 'experience', 'skills', 'education', 'languages', 'certifications'].includes(sectionKey)) {
          return;
        }
        
        // Check if it's a section with items
        if (section && typeof section === 'object' && section.items && Array.isArray(section.items) && section.items.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          console.log('📄 jsPDF: Adding custom section:', sectionKey, 'with', section.items.length, 'items');
          
          // Section header (capitalize and clean up the key)
          const sectionTitle = sectionKey.replace(/[-_]/g, ' ').toUpperCase();
          doc.setFontSize(16);
          doc.setFont(undefined, 'bold');
          doc.text(sectionTitle, margin, yPosition);
          
          // Underline
          doc.line(margin, yPosition + 2, margin + contentWidth, yPosition + 2);
          yPosition += 12;

          // Section items
          section.items.forEach((item: any) => {
            if (item && typeof item === 'object') {
              // Handle different item structures
              if (item.name || item.title) {
                const itemTitle = item.name || item.title;
                yPosition = addText(`• ${itemTitle}`, margin + 5, yPosition, {
                  fontSize: 12,
                  maxWidth: contentWidth - 5
                });
                yPosition += 3;
              } else if (typeof item === 'string') {
                yPosition = addText(`• ${item}`, margin + 5, yPosition, {
                  fontSize: 12,
                  maxWidth: contentWidth - 5
                });
                yPosition += 3;
              }
            }
          });
          yPosition += 10;
        }
      });

      // Generate PDF blob - EXTENSIVE DEBUG
      console.log('📄 jsPDF: Generating PDF blob...');
      const pdfOutput = doc.output('blob');
      console.log('📄 jsPDF: Raw PDF output:', {
        type: typeof pdfOutput,
        size: pdfOutput?.size || 'unknown',
        constructor: pdfOutput?.constructor?.name
      });
      
      const pdfBlob = new Blob([pdfOutput], { type: 'application/pdf' });
      console.log('📄 jsPDF: PDF Blob created:', {
        size: pdfBlob.size,
        type: pdfBlob.type,
        isValid: pdfBlob.size > 0
      });
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      console.log('📄 jsPDF: PDF URL created:', {
        url: pdfUrl,
        urlLength: pdfUrl.length,
        urlPrefix: pdfUrl.substring(0, 50)
      });

      // CRITICAL DEBUG: Test if the blob is actually readable
      try {
        const testArrayBuffer = await pdfBlob.arrayBuffer();
        console.log('📄 jsPDF: PDF Blob validation:', {
          arrayBufferSize: testArrayBuffer.byteLength,
          firstBytes: new Uint8Array(testArrayBuffer.slice(0, 10)),
          isPDFHeader: new TextDecoder().decode(testArrayBuffer.slice(0, 4)) === '%PDF'
        });
      } catch (error) {
        console.error('❌ jsPDF: PDF Blob validation failed:', error);
      }

      console.log('✅ PDFGenerationService: PDF generated successfully with jsPDF');

      return {
        success: true,
        pdfBlob,
        pdfUrl
      };

    } catch (error) {
      console.error('❌ jsPDF generation error:', error);
      throw error;
    }
  }

  /**
   * Generate PDF using pdf-lib (fallback method)
   * SAFETY: Alternative implementation for reliability
   */
  private async generateWithPdfLib(
    cvData: CVData, 
    options: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    try {
      const { PDFDocument, rgb, StandardFonts } = pdfLib;
      
      // Create new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      
      // Load fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let yPosition = 800; // Start from top
      const margin = 50;
      const pageWidth = 595.28;
      const contentWidth = pageWidth - (2 * margin);

      // Helper function to add text
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        const fontSize = options.fontSize || 12;
        const textFont = options.bold ? boldFont : font;
        const color = options.color || rgb(0, 0, 0);
        
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font: textFont,
          color
        });
        
        return y - (fontSize + 4); // Move down for next line
      };

      // 1. Contact Section
      if (cvData.contact?.fullName) {
        // Name (centered, large, bold)
        const nameWidth = boldFont.widthOfTextAtSize(cvData.contact.fullName, 20);
        yPosition = addText(
          cvData.contact.fullName, 
          (pageWidth - nameWidth) / 2, 
          yPosition, 
          { fontSize: 20, bold: true }
        );
        yPosition -= 10;

        // Contact info
        const contactInfo = [];
        if (cvData.contact.email) contactInfo.push(cvData.contact.email);
        if (cvData.contact.phone) contactInfo.push(cvData.contact.phone);
        if (cvData.contact.location) contactInfo.push(cvData.contact.location);
        
        contactInfo.forEach(info => {
          const infoWidth = font.widthOfTextAtSize(info, 12);
          yPosition = addText(info, (pageWidth - infoWidth) / 2, yPosition, { fontSize: 12 });
        });
        
        yPosition -= 20;
      }

      // 2. Summary - EXACT SAME ACCESS AS DennisSchroderTemplate
      const pdfLibSummaryText = cvData.summary?.content;
      if (pdfLibSummaryText && typeof pdfLibSummaryText === 'string' && pdfLibSummaryText.trim()) {
        console.log('📄 pdf-lib: Adding summary section:', pdfLibSummaryText.substring(0, 50) + '...');
        // Simple text wrapping for summary
        const words = pdfLibSummaryText.split(' ');
        let line = '';
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const testWidth = font.widthOfTextAtSize(testLine, 14);
          
          if (testWidth > contentWidth && line !== '') {
            yPosition = addText(line.trim(), margin, yPosition, { fontSize: 14 });
            line = word + ' ';
          } else {
            line = testLine;
          }
        });
        
        if (line.trim()) {
          yPosition = addText(line.trim(), margin, yPosition, { fontSize: 14 });
        }
        
        yPosition -= 20;
      }

      // 3. Work Experience (simplified for fallback)
      if (cvData.experience?.items?.length > 0) {
        // Section header
        yPosition = addText('WORK EXPERIENCE', margin, yPosition, { fontSize: 16, bold: true });
        
        // Draw underline
        page.drawLine({
          start: { x: margin, y: yPosition + 5 },
          end: { x: margin + contentWidth, y: yPosition + 5 },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8)
        });
        
        yPosition -= 15;

        // Experience items (simplified)
        cvData.experience.items.forEach((exp: any) => {
          yPosition = addText(`${exp.title} at ${exp.company}`, margin, yPosition, { fontSize: 14, bold: true });
          
          const dateRange = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
          yPosition = addText(dateRange, margin, yPosition, { fontSize: 12 });
          
          yPosition -= 10;
        });
      }

      // Generate PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      console.log('✅ PDFGenerationService: PDF generated successfully with pdf-lib');

      return {
        success: true,
        pdfBlob,
        pdfUrl
      };

    } catch (error) {
      console.error('❌ pdf-lib generation error:', error);
      throw error;
    }
  }

  /**
   * Generate hash for CV data to enable caching
   * SAFETY: Simple, reliable hashing for cache keys
   */
  private generateDataHash(cvData: CVData): string {
    try {
      // Create a comprehensive hash based on ALL content sections - EXACT SAME ACCESS AS DennisSchroderTemplate
      const hashContent = {
        contact: cvData.contact,
        summary: cvData.summary?.content,
        experienceCount: cvData.experience?.items?.length || 0,
        skillsCount: cvData.skills?.items?.length || 0,
        educationCount: cvData.education?.items?.length || 0,
        languagesCount: cvData.languages?.items?.length || 0,
        certificationsCount: cvData.certifications?.items?.length || 0,
        // Include all dynamic sections
        dynamicSections: Object.keys(cvData)
          .filter(key => !['contact', 'summary', 'experience', 'skills', 'education', 'languages', 'certifications'].includes(key))
          .reduce((acc: any, key) => {
            const section = cvData[key];
            if (section && typeof section === 'object' && section.items && Array.isArray(section.items)) {
              acc[key] = section.items.length;
            }
            return acc;
          }, {}),
        timestamp: Math.floor(Date.now() / 60000) // Round to minute for cache efficiency
      };
      
      return btoa(JSON.stringify(hashContent)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    } catch (error) {
      console.warn('⚠️ Hash generation failed, using timestamp:', error);
      return Date.now().toString();
    }
  }

  /**
   * Cache PDF for performance optimization
   * SAFETY: Memory-conscious caching with automatic cleanup
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
      
      console.log(`📋 PDFGenerationService: PDF cached with key: ${key}`);
    } catch (error) {
      console.warn('⚠️ PDF caching failed:', error);
    }
  }

  /**
   * Retrieve cached PDF if available and valid
   * SAFETY: Robust cache validation with automatic cleanup
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
   * SAFETY: Automatic memory management
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
        console.log(`🧹 PDFGenerationService: Cleaned ${keysToDelete.length} expired cache entries`);
      }
    } catch (error) {
      console.warn('⚠️ Cache cleanup failed:', error);
    }
  }

  /**
   * Clear all cached PDFs (for memory management)
   * SAFETY: Manual cache reset capability
   */
  public clearCache(): void {
    try {
      pdfCache.clear();
      console.log('🧹 PDFGenerationService: All cache cleared');
    } catch (error) {
      console.warn('⚠️ Cache clear failed:', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   * SAFETY: Observability for performance monitoring
   */
  public getCacheStats(): { size: number; oldestEntry: number | null } {
    try {
      let oldestTimestamp: number | null = null;
      
      pdfCache.forEach(value => {
        if (oldestTimestamp === null || value.timestamp < oldestTimestamp) {
          oldestTimestamp = value.timestamp;
        }
      });

      return {
        size: pdfCache.size,
        oldestEntry: oldestTimestamp
      };
    } catch (error) {
      console.warn('⚠️ Cache stats failed:', error);
      return { size: 0, oldestEntry: null };
    }
  }
}

// Export singleton instance
export const pdfGenerationService = PDFGenerationService.getInstance();

// Export types for use in other components
export type { PDFGenerationResult, PDFGenerationOptions };
