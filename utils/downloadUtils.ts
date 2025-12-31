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
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
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
export const generateFilename = (cvData: CVData, extension: string): string => {
  const name = cvData.contact?.fullName || 'CV';
  const sanitizedName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  return `${sanitizedName}_CV_${timestamp}.${extension}`;
};

// Main download function
export const downloadCV = async (cvData: CVData, format: 'pdf' | 'docx' | 'txt') => {
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
      // For DOCX, we'd typically use a library like docx or mammoth
      // For now, we'll download as RTF which can be opened by Word
      const rtfContent = generateRTFContent(cvData);
      downloadFile(rtfContent, filename.replace('.docx', '.rtf'), 'application/rtf');
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
        html += `<div class="skills-text">${sectionData.items.join(' | ')}</div>`;
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
        rtf += `${sectionData.items.join(' | ')}\\par\\par`;
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