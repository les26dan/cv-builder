import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

// 🔧 SKILLS NORMALIZATION UTILITY - Central function to handle mixed skill data structures
const normalizeSkills = (skills: any[], context: string = 'export'): string[] => {
  if (!Array.isArray(skills)) {
    console.warn(`🚨 ${context}: Skills data is not an array:`, skills);
    return [];
  }

  const normalized = skills.map((skill: any, index: number) => {
    if (typeof skill === 'object' && skill !== null && skill.name) {
      return skill.name;
    }
    if (typeof skill === 'string') {
      return skill;
    }
    console.warn(`🚨 ${context}: Unknown skill type at index ${index}:`, skill);
    return String(skill);
  }).filter(Boolean);

  console.log(`🔧 ${context}: Normalized ${skills.length} skills to ${normalized.length} valid strings`);
  return normalized;
};

interface CVData {
  contact: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  summary?: {
    content?: string;
  };
  experience?: {
    items: Array<{
      id: string;
      title: string;
      company: string;
      location?: string;
      startDate: string;
      endDate?: string;
      current?: boolean;
      bullets?: string[];
    }>;
  };
  skills?: {
    items: string[];
  };
  education?: {
    items: Array<{
      id: string;
      degree: string;
      institution: string;
      location?: string;
      graduationDate: string;
      description?: string;
    }>;
  };
  sectionOrder?: string[];
  sectionTitles?: Record<string, string>;
  [key: string]: any;
}

// Default section titles - EXACTLY matching preview
const defaultSectionTitles: Record<string, string> = {
  summary: '', // Summary doesn't show a title in PDF
  experience: 'KINH NGHIỆM LÀM VIỆC',
  skills: 'KỸ NĂNG',
  education: 'HỌC VẤN',
  projects: 'DỰ ÁN',
  volunteer: 'HOẠT ĐỘNG TÌNH NGUYỆN',
  certifications: 'CHỨNG CHỈ',
  languages: 'NGÔN NGỮ',
  hobbies: 'SỞ THÍCH'
};

// Get section title (custom or default) - EXACTLY matching preview
const getSectionTitle = (sectionId: string, sectionTitles?: Record<string, string>) => {
  if (sectionTitles?.[sectionId]) {
    return sectionTitles[sectionId].toUpperCase();
  }
  
  // For custom sections, extract base type
  if (sectionId.startsWith('projects-')) return defaultSectionTitles.projects;
  if (sectionId.startsWith('volunteer-')) return defaultSectionTitles.volunteer;
  if (sectionId.startsWith('certifications-')) return defaultSectionTitles.certifications;
  if (sectionId.startsWith('languages-')) return defaultSectionTitles.languages;
  if (sectionId.startsWith('hobbies-')) return defaultSectionTitles.hobbies;
  if (sectionId.startsWith('custom-')) return 'PHẦN TÙY CHỈNH';
  
  return defaultSectionTitles[sectionId] || 'PHẦN KHÁC';
};

// Check if section has content
const hasContent = (sectionId: string, data: any) => {
  if (!data) return false;
  
  switch (sectionId) {
    case 'contact':
      return data.fullName || data.email || data.phone || data.location;
    case 'summary':
      return data.content && data.content.trim();
    case 'experience':
      return data.items && data.items.length > 0 && data.items.some((item: any) => item.title || item.company);
    case 'skills':
      return data.items && data.items.length > 0;
    case 'education':
      return data.items && data.items.length > 0 && data.items.some((item: any) => item.degree || item.institution);
    default:
      // For custom sections
      if (data.items) {
        return data.items.length > 0;
      }
      if (data.content) {
        return data.content.trim();
      }
      return false;
  }
};

// Convert CV data to plain text format
export const generateTxtContent = (cvData: CVData): string => {
  let content = '';
  
  const sectionOrder = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'];
  
  for (const sectionId of sectionOrder) {
    const sectionData = cvData[sectionId];
    
    if (!hasContent(sectionId, sectionData)) continue;
    
    switch (sectionId) {
      case 'contact': {
        if (sectionData.fullName) {
          content += `${sectionData.fullName}\n`;
          content += '='.repeat(sectionData.fullName.length) + '\n\n';
        }
        
        const contactInfo = [];
        if (sectionData.email) contactInfo.push(`Email: ${sectionData.email}`);
        if (sectionData.phone) contactInfo.push(`Điện thoại: ${sectionData.phone}`);
        if (sectionData.location) contactInfo.push(`Địa chỉ: ${sectionData.location}`);
        if (sectionData.linkedin) contactInfo.push(`LinkedIn: ${sectionData.linkedin}`);
        
        if (contactInfo.length > 0) {
          content += contactInfo.join('\n') + '\n\n';
        }
        break;
      }
        
      case 'summary':
        if (sectionData.content) {
          content += `${getSectionTitle(sectionId, cvData.sectionTitles)}\n`;
          content += '-'.repeat(getSectionTitle(sectionId, cvData.sectionTitles).length) + '\n';
          content += `${sectionData.content}\n\n`;
        }
        break;
        
      case 'experience':
        content += `${getSectionTitle(sectionId, cvData.sectionTitles)}\n`;
        content += '-'.repeat(getSectionTitle(sectionId, cvData.sectionTitles).length) + '\n';
        
        sectionData.items.forEach((exp: any) => {
          if (exp.title || exp.company) {
            const jobLine = [];
            if (exp.title) jobLine.push(exp.title);
            if (exp.company) jobLine.push(exp.company);
            if (exp.location) jobLine.push(exp.location);
            
            content += jobLine.join(' - ') + '\n';
            
            const dateRange = `${exp.startDate} - ${exp.current ? 'Hiện tại' : exp.endDate || ''}`;
            content += dateRange + '\n';
            
            if (exp.bullets && exp.bullets.length > 0) {
              exp.bullets.forEach((bullet: string) => {
                if (bullet && bullet.trim()) {
                  content += `• ${bullet}\n`;
                }
              });
            }
            content += '\n';
          }
        });
        break;
        
      case 'skills':
        content += `${getSectionTitle(sectionId, cvData.sectionTitles)}\n`;
        content += '-'.repeat(getSectionTitle(sectionId, cvData.sectionTitles).length) + '\n';
        content += sectionData.items.join(' | ') + '\n\n';
        break;
        
      case 'education':
        content += `${getSectionTitle(sectionId, cvData.sectionTitles)}\n`;
        content += '-'.repeat(getSectionTitle(sectionId, cvData.sectionTitles).length) + '\n';
        
        sectionData.items.forEach((edu: any) => {
          if (edu.degree || edu.institution) {
            const eduLine = [];
            if (edu.degree) eduLine.push(edu.degree);
            if (edu.institution) eduLine.push(edu.institution);
            if (edu.location) eduLine.push(edu.location);
            
            content += eduLine.join(' - ') + '\n';
            
            if (edu.graduationDate) {
              content += `Năm tốt nghiệp: ${edu.graduationDate}\n`;
            }
            
            if (edu.description) {
              content += `${edu.description}\n`;
            }
            content += '\n';
          }
        });
        break;
        
      default:
        // Handle custom sections
        content += `${getSectionTitle(sectionId, cvData.sectionTitles)}\n`;
        content += '-'.repeat(getSectionTitle(sectionId, cvData.sectionTitles).length) + '\n';
        
        if (sectionData.content) {
          content += `${sectionData.content}\n\n`;
        }
        
        if (sectionData.items && sectionData.items.length > 0) {
          sectionData.items.forEach((item: any) => {
            if (item.title) content += `${item.title}\n`;
            if (item.description) content += `${item.description}\n`;
            if (item.organization) content += `${item.organization}\n`;
            if (item.name) content += `${item.name}\n`;
            content += '\n';
          });
        }
        break;
    }
  }
  
  return content.trim();
};

// Download file with given content and filename
export const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

// Generate filename based on CV data
export const generateFilename = (cvData: CVData, format: string): string => {
  const name = cvData.contact?.fullName || 'CV';
  const sanitizedName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const extension = format === 'latex' ? 'tex' : format;
  
  return `${sanitizedName}_CV_${timestamp}.${extension}`;
};

// Generate LaTeX content that EXACTLY matches the preview
export const generateLatexContent = (cvData: CVData): string => {
  const sectionOrder = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'];
  
  // LaTeX document structure with modern formatting
  let latex = `\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{classic}
\\moderncvcolor{blue}

% Character encoding
\\usepackage[utf8]{inputenc}

% Page geometry
\\usepackage[scale=0.85]{geometry}

% Adjust the page margins if needed
\\setlength{\\hintscolumnwidth}{3cm}

% Personal data`;

  // Add contact information
  if (cvData.contact) {
    const contact = cvData.contact;
    
    if (contact.fullName) {
      latex += `\n\\name{${escapeLatex(contact.fullName.split(' ')[0] || '')}}{${escapeLatex(contact.fullName.split(' ').slice(1).join(' ') || '')}}`;
    }
    
    if (contact.email) {
      latex += `\n\\email{${escapeLatex(contact.email)}}`;
    }
    
    if (contact.phone) {
      latex += `\n\\phone[mobile]{${escapeLatex(contact.phone)}}`;
    }
    
    if (contact.location) {
      latex += `\n\\address{${escapeLatex(contact.location)}}`;
    }
    
    if (contact.linkedin) {
      latex += `\n\\social[linkedin]{${escapeLatex(contact.linkedin.replace('https://linkedin.com/in/', '').replace('https://www.linkedin.com/in/', ''))}}`;
    }
  }

  latex += `\n\n\\begin{document}
\\makecvtitle\n`;

  // Process each section in order to match preview
  for (const sectionId of sectionOrder) {
    const sectionTitle = getSectionTitle(sectionId, cvData.sectionTitles);
    
    switch (sectionId) {
      case 'summary':
        if (cvData.summary?.content) {
          latex += `\n\\section{${escapeLatex(sectionTitle)}}
${escapeLatex(cvData.summary.content)}\n`;
        }
        break;
        
      case 'experience':
        if (cvData.experience?.items && cvData.experience.items.length > 0) {
          latex += `\n\\section{${escapeLatex(sectionTitle)}}`;
          
          cvData.experience.items.forEach((job: any) => {
            const startDate = job.startDate || '';
            const endDate = job.endDate || 'Present';
            const dateRange = startDate && endDate ? `${startDate} -- ${endDate}` : '';
            
            latex += `\n\\cventry{${escapeLatex(dateRange)}}{${escapeLatex(job.title || '')}}{${escapeLatex(job.company || '')}}{${escapeLatex(job.location || '')}}{}{`;
            
            if (job.bullets && job.bullets.length > 0) {
              latex += `\\begin{itemize}`;
              job.bullets.forEach((bullet: string) => {
                if (bullet.trim()) {
                  latex += `\n\\item ${escapeLatex(bullet)}`;
                }
              });
              latex += `\n\\end{itemize}`;
            }
            
            latex += `}\n`;
          });
        }
        break;
        
      case 'skills':
        if (cvData.skills?.items && cvData.skills.items.length > 0) {
          // 🔍 COMPREHENSIVE SKILLS DEBUG - LaTeX Export
          console.log(`\n🚨 ===== LATEX SKILLS EXPORT DEBUG =====`);
          console.log(`🚨 LaTeX Skills raw data:`, cvData.skills.items);
          console.log(`🚨 LaTeX Skills data types:`, cvData.skills.items.map((skill: any, idx: number) => ({
            index: idx,
            type: typeof skill,
            isObject: typeof skill === 'object',
            hasName: skill && typeof skill === 'object' && 'name' in skill,
            value: skill,
            stringRepresentation: typeof skill === 'object' ? JSON.stringify(skill) : skill
          })));
          
          // Use centralized normalization utility
          const normalizedSkills = normalizeSkills(cvData.skills.items, 'LaTeX Export');
          
          console.log(`🚨 LaTeX Final skills string:`, normalizedSkills.join(', '));
          console.log(`🚨 ===== END LATEX SKILLS DEBUG =====\n`);
          
          latex += `\n\\section{${escapeLatex(sectionTitle)}}
\\cvitem{}{${escapeLatex(normalizedSkills.join(', '))}}\n`;
        }
        break;
        
      case 'education':
        if (cvData.education?.items && cvData.education.items.length > 0) {
          latex += `\n\\section{${escapeLatex(sectionTitle)}}`;
          
          cvData.education.items.forEach((edu: any) => {
            const startDate = edu.startDate || '';
            const endDate = edu.endDate || '';
            const dateRange = startDate && endDate ? `${startDate} -- ${endDate}` : endDate || startDate;
            
            latex += `\n\\cventry{${escapeLatex(dateRange)}}{${escapeLatex(edu.degree || '')}}{${escapeLatex(edu.school || '')}}{${escapeLatex(edu.location || '')}}{`;
            
            if (edu.gpa) {
              latex += `GPA: ${escapeLatex(edu.gpa)}`;
            }
            
            latex += `}{`;
            
            if (edu.description) {
              latex += escapeLatex(edu.description);
            }
            
            latex += `}\n`;
          });
        }
        break;
        
      case 'projects':
        if (cvData.projects?.items && cvData.projects.items.length > 0) {
          latex += `\n\\section{${escapeLatex(sectionTitle)}}`;
          
          cvData.projects.items.forEach((project: any) => {
            latex += `\n\\cventry{${escapeLatex(project.date || '')}}{${escapeLatex(project.name || '')}}{${escapeLatex(project.technologies || '')}}{}{}{`;
            
            if (project.description) {
              latex += escapeLatex(project.description);
            }
            
            if (project.link) {
              latex += ` \\\\\\url{${escapeLatex(project.link)}}`;
            }
            
            latex += `}\n`;
          });
        }
        break;
        
      case 'certifications':
        if (cvData.certifications?.items && cvData.certifications.items.length > 0) {
          latex += `\n\\section{${escapeLatex(sectionTitle)}}`;
          
          cvData.certifications.items.forEach((cert: any) => {
            latex += `\n\\cventry{${escapeLatex(cert.date || '')}}{${escapeLatex(cert.name || '')}}{${escapeLatex(cert.issuer || '')}}{}{}{`;
            
            if (cert.description) {
              latex += escapeLatex(cert.description);
            }
            
            latex += `}\n`;
          });
        }
        break;
        
      case 'languages':
        if (cvData.languages?.items && cvData.languages.items.length > 0) {
          latex += `\n\\section{${escapeLatex(sectionTitle)}}`;
          
          cvData.languages.items.forEach((lang: any) => {
            latex += `\n\\cvitemwithcomment{${escapeLatex(lang.name || '')}}{${escapeLatex(lang.proficiency || '')}}{}\n`;
          });
        }
        break;
    }
  }

  latex += `\n\\end{document}`;
  
  return latex;
};

// Helper function to escape LaTeX special characters
const escapeLatex = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/"/g, "''")
    .replace(/'/g, "'");
};



// Main download function
export const downloadCV = async (cvData: CVData, format: 'pdf' | 'docx' | 'txt' | 'latex') => {
  const filename = generateFilename(cvData, format);
  
  switch (format) {
    case 'txt': {
      const txtContent = generateTxtContent(cvData);
      downloadFile(txtContent, filename, 'text/plain;charset=utf-8');
      break;
    }
      
    case 'pdf': {
      // For now, we'll create a simple HTML representation and print it
      // In a real implementation, you'd use a library like jsPDF or Puppeteer
      const htmlContent = generateHTMLForPrint(cvData);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load, then trigger print dialog
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
      break;
    }
      
    case 'docx': {
      // Generate proper DOCX using docx library
      const docxBlob = await generateDOCXContent(cvData);
      downloadFile(docxBlob, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      break;
    }

    case 'latex': {
      const latexContent = generateLatexContent(cvData);
      downloadFile(latexContent, filename, 'text/x-tex;charset=utf-8');
      break;
    }
      
    default:
      console.error('Unsupported format:', format);
  }
};

// Generate HTML for printing (PDF simulation) - EXACTLY matching preview
const generateHTMLForPrint = (cvData: CVData): string => {
  const sectionOrder = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'];
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${cvData.contact?.fullName || 'CV'}</title>
      <meta charset="utf-8">
      <style>
        @page { 
          margin: 0.75in 1in; 
          size: A4; 
          @top-left { content: ""; }
          @top-center { content: ""; }
          @top-right { content: ""; }
          @bottom-left { content: ""; }
          @bottom-center { content: ""; }
          @bottom-right { content: ""; }
        }
        @media print {
          html, body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          @page { 
            margin: 0.75in 1in; 
            size: A4;
          }
        }
        body { 
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.4; 
          color: #333; 
          max-width: 794px; /* A4 width at 96 DPI */
          margin: 0 auto;
          padding: 0;
          background: white;
          font-size: 12px; /* Base font size matching preview */
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Contact section - EXACTLY matching preview */
        .contact-section { margin-bottom: 20px; }
        .contact-name { 
          font-size: 20px;
          font-weight: bold; 
          margin-bottom: 12px; 
          color: #111827; 
          text-align: center;
          line-height: 1.2;
        }
        .contact-info { 
          font-size: 12px;
          margin-bottom: 5px; 
          color: #6b7280; 
          text-align: center;
          line-height: 1.4;
        }
        
        /* Summary section - EXACTLY matching preview */
        .summary-section { margin-bottom: 20px; }
        .summary-text { 
          font-size: 14px; 
          color: #374151; 
          line-height: 1.5; 
          margin-bottom: 20px;
          text-align: justify;
        }
        
        /* Section headers - EXACTLY matching preview */
        .section { margin-bottom: 20px; }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          text-transform: uppercase; 
          border-bottom: 2px solid #d1d5db; 
          margin-bottom: 16px; 
          padding-bottom: 8px;
          color: #111827;
          letter-spacing: 0.5px;
        }
        
        /* Experience section - EXACTLY matching preview */
        .job { margin-bottom: 15px; }
        .job-header-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 5px; 
        }
        .job-header { 
          font-weight: 600; 
          font-size: 14px; 
          line-height: 1.3; 
        }
        .job-dates { 
          font-size: 14px; 
          color: #6b7280; 
          line-height: 1.3; 
        }
        .job-bullets { 
          margin-left: 20px; 
        }
        .bullet { 
          font-size: 14px;
          color: #374151; 
          line-height: 1.4; 
          margin-bottom: 3px; 
        }
        
        /* Skills section - EXACTLY matching preview */
        .skills-text { 
          font-size: 14px; 
          color: #374151; 
          line-height: 1.4; 
        }
        
        /* Education section - EXACTLY matching preview */
        .education-entry { 
          font-size: 14px; 
          margin-bottom: 10px; 
          line-height: 1.3; 
        }
        .education-header-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 5px; 
        }
        .education-date { 
          font-size: 14px; 
          color: #6b7280; 
        }
        .education-description { 
          font-size: 14px; 
          color: #374151; 
          margin-top: 5px; 
        }
      </style>
    </head>
    <body>
  `;
  
  for (const sectionId of sectionOrder) {
    const sectionData = cvData[sectionId];
    
    if (!hasContent(sectionId, sectionData)) continue;
    
    switch (sectionId) {
      case 'contact': {
        html += `<div class="contact-section">`;
        if (sectionData.fullName) {
          html += `<div class="contact-name">${sectionData.fullName}</div>`;
        }
        
        const contactParts = [];
        if (sectionData.email) contactParts.push(sectionData.email);
        if (sectionData.phone) contactParts.push(sectionData.phone);
        if (sectionData.location) contactParts.push(sectionData.location);
        if (sectionData.linkedin) contactParts.push(sectionData.linkedin);
        
        if (contactParts.length > 0) {
          html += `<div class="contact-info">${contactParts.join(' | ')}</div>`;
        }
        html += `</div>`;
        break;
      }
        
      case 'summary':
        if (sectionData.content) {
          html += `<div class="summary-section">`;
          html += `<div class="summary-text">${sectionData.content}</div>`;
          html += `</div>`;
        }
        break;
        
      case 'experience': {
        html += `<div class="section">`;
        html += `<div class="section-title">${getSectionTitle(sectionId, cvData.sectionTitles).toUpperCase()}</div>`;
        
        sectionData.items.forEach((exp: any) => {
          if (exp.title || exp.company) {
            html += `<div class="job">`;
            
            html += `<div class="job-header-row">`;
            
            const jobHeader = [];
            if (exp.title) jobHeader.push(`<strong>${exp.title}</strong>`);
            if (exp.company) jobHeader.push(exp.company);
            if (exp.location) jobHeader.push(exp.location);
            
            html += `<div class="job-header">${jobHeader.join(', ')}</div>`;
            
            const dateRange = `${exp.startDate} – ${exp.current ? 'Hiện tại' : exp.endDate || ''}`;
            html += `<div class="job-dates">${dateRange}</div>`;
            html += `</div>`; // Close job-header-row
            
            if (exp.bullets && exp.bullets.length > 0) {
              html += `<div class="job-bullets">`;
              exp.bullets.forEach((bullet: string) => {
                if (bullet && bullet.trim()) {
                  html += `<div class="bullet">• ${bullet}</div>`;
                }
              });
              html += `</div>`;
            }
            html += `</div>`;
          }
        });
        html += `</div>`;
        break;
      }
        
      case 'skills':
        html += `<div class="section">`;
        html += `<div class="section-title">${getSectionTitle(sectionId, cvData.sectionTitles).toUpperCase()}</div>`;
        
        // 🔍 COMPREHENSIVE SKILLS DEBUG - PDF HTML Export
        console.log(`\n🚨 ===== PDF HTML SKILLS EXPORT DEBUG =====`);
        console.log(`🚨 PDF HTML Skills raw data:`, sectionData.items);
        console.log(`🚨 PDF HTML Skills data types:`, sectionData.items.map((skill: any, idx: number) => ({
          index: idx,
          type: typeof skill,
          isObject: typeof skill === 'object',
          hasName: skill && typeof skill === 'object' && 'name' in skill,
          value: skill,
          stringRepresentation: typeof skill === 'object' ? JSON.stringify(skill) : skill
        })));
        
        // Use centralized normalization utility
        const normalizedSkills = normalizeSkills(sectionData.items, 'PDF HTML Export');
        
        console.log(`🚨 PDF HTML Final skills string:`, normalizedSkills.join(' | '));
        console.log(`🚨 ===== END PDF HTML SKILLS DEBUG =====\n`);
        
        html += `<div class="skills-text">${normalizedSkills.join(' | ')}</div>`;
        html += `</div>`;
        break;
        
      case 'education': {
        html += `<div class="section">`;
        html += `<div class="section-title">${getSectionTitle(sectionId, cvData.sectionTitles).toUpperCase()}</div>`;
        
        sectionData.items.forEach((edu: any) => {
          if (edu.degree || edu.institution) {
            html += `<div class="education-entry">`;
            
            html += `<div class="education-header-row">`;
            
            const eduHeader = [];
            if (edu.degree) eduHeader.push(`<strong>${edu.degree}</strong>`);
            if (edu.institution) eduHeader.push(edu.institution);
            if (edu.location) eduHeader.push(edu.location);
            
            html += `<div>${eduHeader.join(', ')}</div>`;
            
            if (edu.graduationDate) {
              html += `<div class="education-date">${edu.graduationDate}</div>`;
            }
            html += `</div>`; // Close education-header-row
            
            if (edu.description) {
              html += `<div class="education-description">${edu.description}</div>`;
            }
            html += `</div>`;
          }
        });
        html += `</div>`;
        break;
      }
    }
  }
  
  html += `
    </body>
    </html>
  `;
  
  return html;
};

// Generate proper DOCX content using docx library
export const generateDOCXContent = async (cvData: CVData): Promise<Blob> => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: await generateDOCXParagraphs(cvData)
    }]
  });

  return await Packer.toBlob(doc);
};

// Generate paragraphs for DOCX document
const generateDOCXParagraphs = async (cvData: CVData): Promise<Paragraph[]> => {
  const paragraphs: Paragraph[] = [];
  const sectionOrder = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'];

  for (const sectionId of sectionOrder) {
    const sectionData = cvData[sectionId];
    
    if (!hasContent(sectionId, sectionData)) continue;
    
    switch (sectionId) {
      case 'contact': {
        // Full name as main heading
        if (sectionData.fullName) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({
              text: sectionData.fullName,
              bold: true,
              size: 32, // 16pt
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }));
        }
        
        // Contact information
        const contactInfo = [];
        if (sectionData.email) contactInfo.push(sectionData.email);
        if (sectionData.phone) contactInfo.push(sectionData.phone);
        if (sectionData.location) contactInfo.push(sectionData.location);
        if (sectionData.linkedin) contactInfo.push(sectionData.linkedin);
        
        if (contactInfo.length > 0) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({
              text: contactInfo.join(' | '),
              size: 22 // 11pt
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }));
        }
        break;
      }
        
      case 'summary':
        if (sectionData.content) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({
              text: sectionData.content,
              size: 22 // 11pt
            })],
            spacing: { after: 400 }
          }));
        }
        break;
        
      case 'experience': {
        // Section heading
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: getSectionTitle(sectionId, cvData.sectionTitles),
            bold: true,
            size: 26, // 13pt
            allCaps: true
          })],
          spacing: { before: 200, after: 200 },
          border: {
            bottom: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }));
        
        // Experience items
        sectionData.items.forEach((exp: any) => {
          if (exp.title || exp.company) {
            // Job title and company
            const jobLine = [];
            if (exp.title) jobLine.push(exp.title);
            if (exp.company) jobLine.push(exp.company);
            if (exp.location) jobLine.push(exp.location);
            
            paragraphs.push(new Paragraph({
              children: [new TextRun({
                text: jobLine.join(', '),
                bold: true,
                size: 24 // 12pt
              })],
              spacing: { before: 100, after: 50 }
            }));
            
            // Date range
            const dateRange = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate || ''}`;
            paragraphs.push(new Paragraph({
              children: [new TextRun({
                text: dateRange,
                italics: true,
                size: 20 // 10pt
              })],
              spacing: { after: 100 }
            }));
            
            // Bullets
            if (exp.bullets && exp.bullets.length > 0) {
              exp.bullets.forEach((bullet: string) => {
                paragraphs.push(new Paragraph({
                  children: [new TextRun({
                    text: `• ${bullet}`,
                    size: 22 // 11pt
                  })],
                  indent: { left: 720 }, // 0.5 inch
                  spacing: { after: 100 }
                }));
              });
            }
            
            // Space between experiences
            paragraphs.push(new Paragraph({ text: "" }));
          }
        });
        break;
      }
        
      case 'skills': {
        // Section heading
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: getSectionTitle(sectionId, cvData.sectionTitles),
            bold: true,
            size: 26, // 13pt
            allCaps: true
          })],
          spacing: { before: 200, after: 200 },
          border: {
            bottom: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }));
        
        // Skills list
        if (sectionData.items && sectionData.items.length > 0) {
          // 🔍 COMPREHENSIVE SKILLS DEBUG - Word Export
          console.log(`\n🚨 ===== WORD SKILLS EXPORT DEBUG =====`);
          console.log(`🚨 Word Skills raw data:`, sectionData.items);
          console.log(`🚨 Word Skills data types:`, sectionData.items.map((skill: any, idx: number) => ({
            index: idx,
            type: typeof skill,
            isObject: typeof skill === 'object',
            hasName: skill && typeof skill === 'object' && 'name' in skill,
            value: skill,
            stringRepresentation: typeof skill === 'object' ? JSON.stringify(skill) : skill
          })));
          
          // Use centralized normalization utility
          const normalizedSkills = normalizeSkills(sectionData.items, 'Word Export');
          
          console.log(`🚨 Word Final skills string:`, normalizedSkills.join(', '));
          console.log(`🚨 ===== END WORD SKILLS DEBUG =====\n`);
          
          paragraphs.push(new Paragraph({
            children: [new TextRun({
              text: normalizedSkills.join(', '),
              size: 22 // 11pt
            })],
            spacing: { after: 400 }
          }));
        }
        break;
      }
        
      case 'education': {
        // Section heading
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: getSectionTitle(sectionId, cvData.sectionTitles),
            bold: true,
            size: 26, // 13pt
            allCaps: true
          })],
          spacing: { before: 200, after: 200 },
          border: {
            bottom: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }));
        
        // Education items
        sectionData.items.forEach((edu: any) => {
          if (edu.degree || edu.institution) {
            const eduLine = [];
            if (edu.degree) eduLine.push(edu.degree);
            if (edu.institution) eduLine.push(edu.institution);
            if (edu.location) eduLine.push(edu.location);
            
            paragraphs.push(new Paragraph({
              children: [new TextRun({
                text: eduLine.join(', '),
                bold: true,
                size: 24 // 12pt
              })],
              spacing: { before: 100, after: 50 }
            }));
            
            if (edu.graduationDate) {
              paragraphs.push(new Paragraph({
                children: [new TextRun({
                  text: edu.graduationDate,
                  italics: true,
                  size: 20 // 10pt
                })],
                spacing: { after: 200 }
              }));
            }
          }
        });
        break;
      }
        
      case 'projects': {
        // Section heading
        paragraphs.push(new Paragraph({
          children: [new TextRun({
            text: getSectionTitle(sectionId, cvData.sectionTitles),
            bold: true,
            size: 26, // 13pt
            allCaps: true
          })],
          spacing: { before: 200, after: 200 },
          border: {
            bottom: {
              color: "000000",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }));
        
        // Project items
        sectionData.items.forEach((project: any) => {
          if (project.name) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({
                text: project.name,
                bold: true,
                size: 24 // 12pt
              })],
              spacing: { before: 100, after: 50 }
            }));
            
            if (project.description) {
              paragraphs.push(new Paragraph({
                children: [new TextRun({
                  text: project.description,
                  size: 22 // 11pt
                })],
                spacing: { after: 200 }
              }));
            }
          }
        });
        break;
      }
    }
  }

  return paragraphs;
};

// Generate RTF content for DOCX alternative
const generateRTFContent = (cvData: CVData): string => {
  let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
  
  const sectionOrder = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'];
  
  for (const sectionId of sectionOrder) {
    const sectionData = cvData[sectionId];
    
    if (!hasContent(sectionId, sectionData)) continue;
    
    switch (sectionId) {
      case 'contact': {
        if (sectionData.fullName) {
          rtf += `\\f0\\fs28\\b ${sectionData.fullName}\\b0\\fs20\\par\\par`;
        }
        
        const contactInfo = [];
        if (sectionData.email) contactInfo.push(sectionData.email);
        if (sectionData.phone) contactInfo.push(sectionData.phone);
        if (sectionData.location) contactInfo.push(sectionData.location);
        if (sectionData.linkedin) contactInfo.push(sectionData.linkedin);
        
        if (contactInfo.length > 0) {
          rtf += `${contactInfo.join(' | ')}\\par\\par`;
        }
        break;
      }
        
      case 'summary':
        if (sectionData.content) {
          rtf += `${sectionData.content}\\par\\par`;
        }
        break;
        
      case 'experience': {
        rtf += `\\b ${getSectionTitle(sectionId, cvData.sectionTitles)}\\b0\\par`;
        
        sectionData.items.forEach((exp: any) => {
          if (exp.title || exp.company) {
            const jobLine = [];
            if (exp.title) jobLine.push(`\\b ${exp.title}\\b0`);
            if (exp.company) jobLine.push(exp.company);
            if (exp.location) jobLine.push(exp.location);
            
            rtf += `${jobLine.join(', ')}\\par`;
            
            const dateRange = `${exp.startDate} - ${exp.current ? 'Hiện tại' : exp.endDate || ''}`;
            rtf += `\\i ${dateRange}\\i0\\par`;
            
            if (exp.bullets && exp.bullets.length > 0) {
              exp.bullets.forEach((bullet: string) => {
                if (bullet && bullet.trim()) {
                  rtf += `• ${bullet}\\par`;
                }
              });
            }
            rtf += '\\par';
          }
        });
        break;
      }
        
      case 'skills':
        rtf += `\\b ${getSectionTitle(sectionId, cvData.sectionTitles)}\\b0\\par`;
        
        // 🔍 COMPREHENSIVE SKILLS DEBUG - RTF Export
        console.log(`\n🚨 ===== RTF SKILLS EXPORT DEBUG =====`);
        console.log(`🚨 RTF Skills raw data:`, sectionData.items);
        console.log(`🚨 RTF Skills data types:`, sectionData.items.map((skill: any, idx: number) => ({
          index: idx,
          type: typeof skill,
          isObject: typeof skill === 'object',
          hasName: skill && typeof skill === 'object' && 'name' in skill,
          value: skill,
          stringRepresentation: typeof skill === 'object' ? JSON.stringify(skill) : skill
        })));
        
        // Use centralized normalization utility
        const normalizedSkills = normalizeSkills(sectionData.items, 'RTF Export');
        
        console.log(`🚨 RTF Final skills string:`, normalizedSkills.join(' | '));
        console.log(`🚨 ===== END RTF SKILLS DEBUG =====\n`);
        
        rtf += `${normalizedSkills.join(' | ')}\\par\\par`;
        break;
        
      case 'education': {
        rtf += `\\b ${getSectionTitle(sectionId, cvData.sectionTitles)}\\b0\\par`;
        
        sectionData.items.forEach((edu: any) => {
          if (edu.degree || edu.institution) {
            const eduLine = [];
            if (edu.degree) eduLine.push(`\\b ${edu.degree}\\b0`);
            if (edu.institution) eduLine.push(edu.institution);
            if (edu.location) eduLine.push(edu.location);
            
            rtf += `${eduLine.join(', ')}\\par`;
            
            if (edu.graduationDate) {
              rtf += `\\i ${edu.graduationDate}\\i0\\par`;
            }
            
            if (edu.description) {
              rtf += `${edu.description}\\par`;
            }
            rtf += '\\par';
          }
        });
        break;
      }
    }
  }
  
  rtf += '}';
  return rtf;
}; 