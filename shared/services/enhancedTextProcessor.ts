/**
 * Enhanced Text Processor for CV Parsing
 * Handles poorly formatted PDF extractions with intelligent text processing
 * Addresses issues where 3rd party PDF extraction tools create messy text output
 */

export interface ProcessedText {
  cleanedText: string;
  detectedSections: Record<string, string>;
  textQuality: 'high' | 'medium' | 'low';
  processingReport: {
    originalLength: number;
    cleanedLength: number;
    sectionsFound: number;
    qualityIssues: string[];
  };
}

export class EnhancedTextProcessor {
  
  /**
   * Pre-process extracted CV text to improve section detection
   * Handles common issues from PDF extraction libraries
   */
  static preprocessCVText(rawText: string): ProcessedText {
    console.log('🔧 Enhanced Text Processor: Starting text preprocessing');
    
    const originalLength = rawText.length;
    const qualityIssues: string[] = [];
    
    // Step 1: Basic text cleaning
    let cleanedText = rawText
      // Remove excessive whitespace and normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
    
    // Step 2: Fix common PDF extraction issues
    cleanedText = this.fixPDFExtractionIssues(cleanedText, qualityIssues);
    
    // Step 3: Enhance section headers
    cleanedText = this.enhanceSectionHeaders(cleanedText, qualityIssues);
    
    // Step 4: Detect and extract sections
    const detectedSections = this.intelligentSectionDetection(cleanedText, qualityIssues);
    
    // Step 5: Assess text quality
    const textQuality = this.assessTextQuality(cleanedText, detectedSections, qualityIssues);
    
    console.log('✅ Enhanced Text Processor: Preprocessing complete', {
      originalLength,
      cleanedLength: cleanedText.length,
      sectionsFound: Object.keys(detectedSections).length,
      textQuality,
      qualityIssues: qualityIssues.length
    });
    
    return {
      cleanedText,
      detectedSections,
      textQuality,
      processingReport: {
        originalLength,
        cleanedLength: cleanedText.length,
        sectionsFound: Object.keys(detectedSections).length,
        qualityIssues
      }
    };
  }
  
  /**
   * Fix common PDF extraction issues
   */
  private static fixPDFExtractionIssues(text: string, qualityIssues: string[]): string {
    let cleaned = text;
    
    // Fix scattered letters (common in PDF.js extraction)
    if (/[A-Za-z]\s+[A-Za-z]\s+[A-Za-z]/.test(text)) {
      qualityIssues.push('Scattered letters detected');
      // Attempt to merge scattered letters in names and words
      cleaned = cleaned.replace(/\b([A-Z])\s+([A-Z])\s+([A-Z]+)\b/g, '$1$2$3');
      cleaned = cleaned.replace(/\b([A-Z][a-z])\s+([A-Z][a-z]+)\b/g, '$1$2');
    }
    
    // Fix broken phone numbers
    cleaned = cleaned.replace(/(\+\d{1,3})\s+(\(\d+\))\s+(\d+)\s+(\d+)\s+(\d+)/g, '$1 $2 $3 $4 $5');
    cleaned = cleaned.replace(/(\+\d{1,3})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/g, '$1 $2 $3 $4 $5');
    
    // Fix broken email addresses
    cleaned = cleaned.replace(/([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/g, '$1@$2.$3');
    
    // Fix broken URLs (LinkedIn, etc.)
    cleaned = cleaned.replace(/(linkedin\.com)\s*\/\s*(in)\s*\/\s*([a-zA-Z0-9-]+)/g, '$1/$2/$3');
    
    // Fix broken dates
    cleaned = cleaned.replace(/(\d{4})\s*-\s*(\d{4})/g, '$1-$2');
    cleaned = cleaned.replace(/(\d{4})\s*–\s*(\d{4})/g, '$1-$2');
    cleaned = cleaned.replace(/(\d{4})\s*to\s*(\d{4})/gi, '$1-$2');
    
    return cleaned;
  }
  
  /**
   * Enhance section headers that might be poorly detected
   */
  private static enhanceSectionHeaders(text: string, qualityIssues: string[]): string {
    let enhanced = text;
    
    // Common section headers that might be scattered or poorly formatted
    const sectionMappings = [
      // Experience variations
      { pattern: /\b(W\s*O\s*R\s*K\s*E\s*X\s*P\s*E\s*R\s*I\s*E\s*N\s*C\s*E|WORK\s+EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|EMPLOYMENT\s+HISTORY|CAREER\s+HISTORY)\b/gi, replacement: '\n\nWORK EXPERIENCE\n' },
      { pattern: /\b(E\s*X\s*P\s*E\s*R\s*I\s*E\s*N\s*C\s*E|EXPERIENCE)\b/gi, replacement: '\n\nEXPERIENCE\n' },
      
      // Education variations
      { pattern: /\b(E\s*D\s*U\s*C\s*A\s*T\s*I\s*O\s*N|EDUCATION|ACADEMIC\s+BACKGROUND|QUALIFICATIONS)\b/gi, replacement: '\n\nEDUCATION\n' },
      
      // Skills variations
      { pattern: /\b(S\s*K\s*I\s*L\s*L\s*S|SKILLS|TECHNICAL\s+SKILLS|CORE\s+COMPETENCIES|EXPERTISE)\b/gi, replacement: '\n\nSKILLS\n' },
      
      // Summary variations
      { pattern: /\b(S\s*U\s*M\s*M\s*A\s*R\s*Y|SUMMARY|PROFESSIONAL\s+SUMMARY|OBJECTIVE|PROFILE|PERSONAL\s+STATEMENT)\b/gi, replacement: '\n\nSUMMARY\n' },
      
      // Contact variations
      { pattern: /\b(C\s*O\s*N\s*T\s*A\s*C\s*T|CONTACT\s+INFORMATION|PERSONAL\s+DETAILS)\b/gi, replacement: '\n\nCONTACT\n' },
      
      // Vietnamese headers
      { pattern: /\b(KINH\s+NGHIỆM\s+LÀM\s+VIỆC|KINH\s+NGHIỆM|K I N H  N G H I Ệ M)\b/gi, replacement: '\n\nKINH NGHIỆM LÀM VIỆC\n' },
      { pattern: /\b(HỌC\s+VẤN|H Ọ C  V Ấ N)\b/gi, replacement: '\n\nHỌC VẤN\n' },
      { pattern: /\b(KỸ\s+NĂNG|K Ỹ  N Ă N G)\b/gi, replacement: '\n\nKỸ NĂNG\n' },
      { pattern: /\b(TÓM\s+TẮT|T Ó M  T Ắ T)\b/gi, replacement: '\n\nTÓM TẮT\n' }
    ];
    
    let headersFixed = 0;
    sectionMappings.forEach(({ pattern, replacement }) => {
      const before = enhanced;
      enhanced = enhanced.replace(pattern, replacement);
      if (before !== enhanced) headersFixed++;
    });
    
    if (headersFixed > 0) {
      qualityIssues.push(`Fixed ${headersFixed} scattered section headers`);
    }
    
    return enhanced;
  }
  
  /**
   * Intelligent section detection with fallback strategies
   */
  private static intelligentSectionDetection(text: string, qualityIssues: string[]): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Strategy 1: Look for clear section headers
    const sectionPatterns = {
      contact: /^(CONTACT|CONTACT INFORMATION|PERSONAL DETAILS|THÔNG TIN LIÊN HỆ)$/i,
      summary: /^(SUMMARY|PROFESSIONAL SUMMARY|OBJECTIVE|PROFILE|PERSONAL STATEMENT|TÓM TẮT|MỤC TIÊU)$/i,
      experience: /^(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT|CAREER|KINH NGHIỆM|KINH NGHIỆM LÀM VIỆC)$/i,
      education: /^(EDUCATION|ACADEMIC BACKGROUND|QUALIFICATIONS|HỌC VẤN|BẰNG CẤP)$/i,
      skills: /^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES|EXPERTISE|KỸ NĂNG|CHUYÊN MÔN)$/i
    };
    
    let currentSection = '';
    let currentContent: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line is a section header
      let foundSection = '';
      for (const [section, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          foundSection = section;
          break;
        }
      }
      
      if (foundSection) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = foundSection;
        currentContent = [];
      } else if (currentSection) {
        // Add content to current section
        currentContent.push(line);
      } else {
        // No section identified yet, might be contact info or summary
        if (i < 10) { // First 10 lines likely contain contact or summary
          if (/@/.test(line) || /\+\d/.test(line) || /linkedin/i.test(line)) {
            if (!sections.contact) sections.contact = '';
            sections.contact += (sections.contact ? '\n' : '') + line;
          } else if (line.length > 30 && !sections.summary) {
            // Likely summary content
            sections.summary = line;
          }
        }
      }
    }
    
    // Save final section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
    
    // Strategy 2: If no clear sections found, use content-based detection
    if (Object.keys(sections).length === 0) {
      qualityIssues.push('No clear section headers found, using content-based detection');
      return this.contentBasedSectionDetection(text, qualityIssues);
    }
    
    return sections;
  }
  
  /**
   * Fallback: Content-based section detection when headers are unclear
   */
  private static contentBasedSectionDetection(text: string, qualityIssues: string[]): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Find contact information (emails, phones, LinkedIn)
    const contactLines = lines.filter(line => 
      /@/.test(line) || 
      /\+\d/.test(line) || 
      /linkedin/i.test(line) ||
      /\(\d{3}\)/.test(line)
    );
    if (contactLines.length > 0) {
      sections.contact = contactLines.join('\n');
    }
    
    // Find education (degree, university keywords)
    const educationLines = lines.filter(line => 
      /\b(bachelor|master|phd|degree|university|college|graduated|diploma|certificate)\b/i.test(line)
    );
    if (educationLines.length > 0) {
      sections.education = educationLines.join('\n');
    }
    
    // Find work experience (company, job title patterns)
    const experienceLines = lines.filter(line => 
      /\b(manager|engineer|developer|analyst|director|coordinator|specialist|lead|senior|junior)\b/i.test(line) ||
      /\b(company|corp|inc|ltd|llc|technologies|solutions|systems)\b/i.test(line) ||
      /\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*present|present|now/i.test(line)
    );
    if (experienceLines.length > 0) {
      sections.experience = experienceLines.join('\n');
    }
    
    // Find skills (technical terms, programming languages)
    const skillLines = lines.filter(line => 
      /\b(javascript|python|java|react|angular|vue|node|sql|aws|docker|git|agile|scrum)\b/i.test(line) ||
      /\b(programming|development|management|leadership|communication|analysis)\b/i.test(line)
    );
    if (skillLines.length > 0) {
      sections.skills = skillLines.join('\n');
    }
    
    // Remaining content as summary
    const usedLines = [
      ...(sections.contact?.split('\n') || []),
      ...(sections.education?.split('\n') || []),
      ...(sections.experience?.split('\n') || []),
      ...(sections.skills?.split('\n') || [])
    ];
    
    const summaryLines = lines.filter(line => 
      !usedLines.includes(line) && 
      line.length > 20 &&
      !/^[A-Z\s]+$/.test(line) // Not all caps (likely not a header)
    );
    
    if (summaryLines.length > 0) {
      sections.summary = summaryLines.slice(0, 3).join('\n');
    }
    
    qualityIssues.push('Used content-based detection due to poor text structure');
    return sections;
  }
  
  /**
   * Assess the quality of extracted text
   */
  private static assessTextQuality(
    text: string, 
    sections: Record<string, string>, 
    qualityIssues: string[]
  ): 'high' | 'medium' | 'low' {
    let score = 100;
    
    // Deduct points for quality issues
    score -= qualityIssues.length * 10;
    
    // Deduct points for poor structure
    if (Object.keys(sections).length < 3) score -= 20;
    if (text.length < 500) score -= 15;
    if (!/\n\n/.test(text)) score -= 10; // No paragraph breaks
    
    // Bonus points for good structure
    if (Object.keys(sections).length >= 4) score += 10;
    if (/@.*\.\w+/.test(text)) score += 5; // Valid email
    if (/\+?\d{1,3}[- ]?\(?\d{3}\)?[- ]?\d{3,4}[- ]?\d{4}/.test(text)) score += 5; // Valid phone
    
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
  
  /**
   * Extract specific section with intelligent fallbacks
   */
  static extractSection(text: string, sectionType: 'contact' | 'summary' | 'experience' | 'education' | 'skills'): string {
    const processed = this.preprocessCVText(text);
    
    // First try to get from detected sections
    if (processed.detectedSections[sectionType]) {
      return processed.detectedSections[sectionType];
    }
    
    // Fallback to pattern-based extraction
    switch (sectionType) {
      case 'contact':
        return this.extractContactFallback(processed.cleanedText);
      case 'summary':
        return this.extractSummaryFallback(processed.cleanedText);
      case 'experience':
        return this.extractExperienceFallback(processed.cleanedText);
      case 'education':
        return this.extractEducationFallback(processed.cleanedText);
      case 'skills':
        return this.extractSkillsFallback(processed.cleanedText);
      default:
        return '';
    }
  }
  
  private static extractContactFallback(text: string): string {
    const lines = text.split('\n');
    const contactLines = lines.filter(line => 
      /@/.test(line) || 
      /\+\d/.test(line) || 
      /linkedin/i.test(line) ||
      /\(\d{3}\)/.test(line) ||
      (line.length < 50 && /\b(vietnam|viet nam|ho chi minh|hanoi)\b/i.test(line))
    );
    return contactLines.join('\n');
  }
  
  private static extractSummaryFallback(text: string): string {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Look for lines that seem like summary content
    const summaryLines = lines.filter(line => 
      line.length > 50 && 
      line.length < 300 &&
      !/[@+\d]/.test(line) &&
      !/(university|college|degree|bachelor|master)/i.test(line) &&
      !/(company|corp|inc|ltd|manager|engineer|developer)/i.test(line)
    );
    
    return summaryLines.slice(0, 2).join(' ');
  }
  
  private static extractExperienceFallback(text: string): string {
    const lines = text.split('\n');
    const experienceLines = lines.filter(line => 
      /\b(manager|engineer|developer|analyst|director|coordinator|specialist|lead|senior|junior)\b/i.test(line) ||
      /\b(company|corp|inc|ltd|llc|technologies|solutions|systems)\b/i.test(line) ||
      /\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*present|present|now/i.test(line) ||
      /\b(worked|responsible|managed|developed|led|created|implemented)\b/i.test(line)
    );
    return experienceLines.join('\n');
  }
  
  private static extractEducationFallback(text: string): string {
    const lines = text.split('\n');
    const educationLines = lines.filter(line => 
      /\b(bachelor|master|phd|degree|university|college|graduated|diploma|certificate|school)\b/i.test(line)
    );
    return educationLines.join('\n');
  }
  
  private static extractSkillsFallback(text: string): string {
    const lines = text.split('\n');
    const skillLines = lines.filter(line => 
      /\b(javascript|typescript|python|java|react|angular|vue|node|sql|aws|docker|git|agile|scrum)\b/i.test(line) ||
      /\b(programming|development|management|leadership|communication|analysis|design)\b/i.test(line) ||
      /\b(project management|product management|data analysis|interpersonal skill)\b/i.test(line)
    );
    return skillLines.join('\n');
  }
}