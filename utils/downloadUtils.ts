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

// Normalize a skill item (string or object) to a plain string
const skillName = (item: any): string => {
  if (typeof item === 'string') return item;
  return item?.name || item?.label || item?.skill || String(item);
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
        content += sectionData.items.map(skillName).join(' | ') + '\n\n';
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
          latex += `\n\\section{${escapeLatex(sectionTitle)}}
\\cvitem{}{${escapeLatex(cvData.skills.items.map(skillName).join(', '))}}\n`;
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
// `pageCount` (optional) is the number of A4 pages the visible preview decided on
// based on measured content height. We forward it to the print renderer so the
// template's internal pagination logic produces the same page split — without it
// the printed PDF can spill into extra pages even when the preview shows one.
export const downloadCV = async (cvData: CVData, format: 'pdf' | 'docx' | 'txt' | 'latex', templateSetting?: string, pageCount?: number) => {
  const filename = generateFilename(cvData, format);

  switch (format) {
    case 'txt': {
      const txtContent = generateTxtContent(cvData);
      downloadFile(txtContent, filename, 'text/plain;charset=utf-8');
      break;
    }

    case 'pdf': {
      // Rasterized pipeline (html2canvas + jsPDF) — see utils/pdfGenerator.ts
      // for why we don't use window.print().
      const { generatePdfFromTemplate } = await import('./pdfGenerator');
      await generatePdfFromTemplate(cvData as any, templateSetting, pageCount ?? 1, filename);
      break;
    }
      
    case 'docx': {
      // Real OOXML .docx via the `docx` library — Vietnamese diacritics
      // are preserved natively. (The old RTF fallback shipped a `.rtf` file
      // with a `.docx` extension, which Word complained about.)
      const { generateDocxBlob } = await import('./docxGenerator');
      const blob = await generateDocxBlob(cvData);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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

// (Print-to-HTML pipeline removed — PDF now goes through utils/pdfGenerator.ts
//  using html2canvas + jsPDF for pixel-perfect WYSIWYG with the preview.)

// Resolve theme colors from templateSetting string ("templateId:themeId")
const resolveThemeColors = (templateSetting?: string): { primary: string; accent: string; text: string; muted: string; templateId: string } => {
  const defaults = { primary: '#1a56db', accent: '#e8f0fe', text: '#1e293b', muted: '#64748b', templateId: 'classic' }
  if (!templateSetting || templateSetting === 'default') return defaults
  const [templateId, themeId = 'default'] = templateSetting.split(':')

  const palettes: Record<string, Record<string, { primary: string; accent: string; text: string; muted: string }>> = {
    classic: {
      default: { primary: '#1a56db', accent: '#e8f0fe', text: '#1e293b', muted: '#64748b' },
      navy:    { primary: '#1e3a8a', accent: '#bfdbfe', text: '#111827', muted: '#6b7280' },
      forest:  { primary: '#166534', accent: '#bbf7d0', text: '#111827', muted: '#6b7280' },
      rose:    { primary: '#9f1239', accent: '#fecdd3', text: '#111827', muted: '#6b7280' },
    },
    sidebar: {
      slate:  { primary: '#334155', accent: '#f1f5f9', text: '#0f172a', muted: '#64748b' },
      navy:   { primary: '#1e3a8a', accent: '#dbeafe', text: '#1e293b', muted: '#64748b' },
      forest: { primary: '#166534', accent: '#dcfce7', text: '#14532d', muted: '#6b7280' },
      rose:   { primary: '#9f1239', accent: '#ffe4e6', text: '#1f2937', muted: '#6b7280' },
    },
    minimal: {
      slate:  { primary: '#334155', accent: '#f1f5f9', text: '#0f172a', muted: '#64748b' },
      navy:   { primary: '#1e3a8a', accent: '#dbeafe', text: '#1e293b', muted: '#64748b' },
      forest: { primary: '#166534', accent: '#dcfce7', text: '#14532d', muted: '#6b7280' },
      rose:   { primary: '#9f1239', accent: '#ffe4e6', text: '#1f2937', muted: '#6b7280' },
    },
    timeline: {
      blue:   { primary: '#1e3a8a', accent: '#dbeafe', text: '#1e293b', muted: '#64748b' },
      teal:   { primary: '#0f766e', accent: '#ccfbf1', text: '#134e4a', muted: '#6b7280' },
      violet: { primary: '#5b21b6', accent: '#ede9fe', text: '#1e1b4b', muted: '#6b7280' },
      slate:  { primary: '#334155', accent: '#f1f5f9', text: '#0f172a', muted: '#64748b' },
    },
    executive: {
      midnight: { primary: '#0f2942', accent: '#e8eef7', text: '#1a202c', muted: '#718096' },
      charcoal: { primary: '#1c1c2e', accent: '#f0f0f5', text: '#1a1a2e', muted: '#6b7280' },
      wine:     { primary: '#6b1c3f', accent: '#fce7ef', text: '#1f1020', muted: '#6b7280' },
      forest:   { primary: '#14532d', accent: '#f0fdf4', text: '#052e16', muted: '#6b7280' },
    },
  }
  const colors = palettes[templateId]?.[themeId] || defaults
  return { ...colors, templateId }
}

// Dispatch to the correct HTML generator based on templateSetting
const generateHTMLForPrintByTemplate = (cvData: CVData, templateSetting?: string): string => {
  const { templateId, ...colors } = resolveThemeColors(templateSetting)
  switch (templateId) {
    case 'sidebar':   return generateHTMLForPrint_sidebar(cvData, colors)
    case 'minimal':   return generateHTMLForPrint_minimal(cvData, colors)
    case 'timeline':  return generateHTMLForPrint_timeline(cvData, colors)
    case 'executive': return generateHTMLForPrint_executive(cvData, colors)
    default:          return generateHTMLForPrint(cvData, colors)
  }
}

type Colors = { primary: string; accent: string; text: string; muted: string }

// ── Sidebar template HTML ────────────────────────────────────────────────────
const generateHTMLForPrint_sidebar = (cvData: CVData, colors: Colors): string => {
  const { primary, accent, text: textColor, muted } = colors
  const contact = cvData.contact || {}
  const skills = cvData.skills?.items || []
  const sectionOrder = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education']
  const skillStr = (s: any) => typeof s === 'object' && s.name ? s.name : String(s)
  const mainSections = sectionOrder.filter((id: string) => id !== 'contact' && id !== 'skills')

  const sectionHeaderStyle = `display:flex;align-items:center;gap:10px;margin-bottom:14px;`
  const sectionHeaderInner = (title: string) =>
    `<span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:${primary};white-space:nowrap;">${title}</span><div style="flex:1;height:1.5px;background:${accent};"></div>`

  const renderMainSection = (sectionId: string): string => {
    const header = `<div style="${sectionHeaderStyle}">${sectionHeaderInner(getSectionTitle(sectionId, cvData.sectionTitles))}</div>`
    switch (sectionId) {
      case 'summary': {
        if (!cvData.summary?.content?.trim()) return ''
        return `<div style="margin-bottom:20px;">${header}<p style="font-size:12px;color:${textColor};line-height:1.75;margin:0;">${cvData.summary.content}</p></div>`
      }
      case 'experience': {
        const items = cvData.experience?.items
        if (!items?.length) return ''
        const jobs = items.map(exp => {
          const bullets = (exp.bullets || []).filter((b: string) => b?.trim())
            .map((b: string) => `<li style="font-size:12px;color:${textColor};line-height:1.6;margin-bottom:3px;padding-left:12px;position:relative;list-style:none;"><span style="position:absolute;left:0;color:${primary};font-weight:700;">›</span>${b}</li>`).join('')
          const dateBadge = `<span style="font-size:10.5px;color:${primary};background:${accent};padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:500;">${exp.startDate} – ${exp.current ? 'Hiện tại' : (exp.endDate || '')}</span>`
          return `<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid ${accent};">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px;">
              <div><div style="font-size:13px;font-weight:700;color:${textColor};line-height:1.3;">${exp.title}</div>${exp.company ? `<div style="font-size:12px;color:${primary};font-weight:600;margin-top:1px;">${exp.company}${exp.location ? `<span style="color:${muted};font-weight:400;"> · ${exp.location}</span>` : ''}</div>` : ''}</div>
              ${dateBadge}
            </div>
            ${bullets ? `<ul style="margin:6px 0 0;padding:0;">${bullets}</ul>` : ''}
          </div>`
        }).join('')
        return `<div style="margin-bottom:20px;">${header}${jobs}</div>`
      }
      case 'education': {
        const items = cvData.education?.items
        if (!items?.length) return ''
        const edus = items.map(edu => {
          const dateBadge = edu.graduationDate ? `<span style="font-size:10.5px;color:${primary};background:${accent};padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:500;">${edu.graduationDate}</span>` : ''
          return `<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid ${accent};">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div><div style="font-size:13px;font-weight:700;color:${textColor};">${edu.degree}</div>${edu.institution ? `<div style="font-size:12px;color:${primary};font-weight:500;">${edu.institution}${edu.location ? `<span style="color:${muted};font-weight:400;"> · ${edu.location}</span>` : ''}</div>` : ''}</div>
              ${dateBadge}
            </div>
            ${edu.description ? `<p style="font-size:12px;color:${muted};margin:5px 0 0;line-height:1.5;">${edu.description}</p>` : ''}
          </div>`
        }).join('')
        return `<div style="margin-bottom:20px;">${header}${edus}</div>`
      }
      default: {
        const data = cvData[sectionId]
        if (!data) return ''
        return `<div style="margin-bottom:20px;">${header}${data.content ? `<p style="font-size:12px;color:${textColor};line-height:1.6;margin:0;">${data.content}</p>` : ''}</div>`
      }
    }
  }

  const initials = contact.fullName ? contact.fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() : ''
  const sidebarContent = `
    <div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.15);border:3px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:24px;font-weight:700;color:rgba(255,255,255,0.9);">${initials}</div>
    ${contact.fullName ? `<div style="font-size:17px;font-weight:700;color:#fff;line-height:1.25;word-break:break-word;margin-bottom:20px;">${contact.fullName}</div>` : ''}
    <div style="font-size:9.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.55);border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:5px;margin-bottom:10px;">LIÊN HỆ</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
      ${contact.email ? `<div style="font-size:11px;color:rgba(255,255,255,0.85);word-break:break-all;">✉ ${contact.email}</div>` : ''}
      ${contact.phone ? `<div style="font-size:11px;color:rgba(255,255,255,0.85);">✆ ${contact.phone}</div>` : ''}
      ${contact.location ? `<div style="font-size:11px;color:rgba(255,255,255,0.85);">⌖ ${contact.location}</div>` : ''}
      ${contact.linkedin ? `<div style="font-size:11px;color:rgba(255,255,255,0.85);word-break:break-all;">in ${contact.linkedin}</div>` : ''}
    </div>
    ${skills.length > 0 ? `
      <div style="font-size:9.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.55);border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:5px;margin-bottom:10px;">${getSectionTitle('skills', cvData.sectionTitles)}</div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${skills.map((s: any) => `<div style="font-size:11px;color:rgba(255,255,255,0.9);background:rgba(255,255,255,0.12);border-radius:3px;padding:4px 8px;">${skillStr(s)}</div>`).join('')}
      </div>` : ''}
  `

  return `<!DOCTYPE html><html><head><title>${contact.fullName || 'CV'}</title><meta charset="utf-8">
  <style>
    @page { margin:0; size:A4; }
    @media print { html,body { margin:0;padding:0; } }
    body { font-family:'Inter','Segoe UI',sans-serif;font-size:12px;line-height:1.5;margin:0;padding:0;background:white;text-rendering:optimizeLegibility; }
    .cv-wrap { display:table;width:794px;min-height:1123px;table-layout:fixed; }
    .sidebar { display:table-cell;width:238px;background:${primary};padding:44px 22px 40px;vertical-align:top; }
    .main { display:table-cell;padding:44px 36px 40px;vertical-align:top;background:white; }
  </style>
  </head><body><div class="cv-wrap"><div class="sidebar">${sidebarContent}</div><div class="main">${mainSections.map(renderMainSection).join('')}</div></div></body></html>`
}

// ── Minimal template HTML ────────────────────────────────────────────────────
const generateHTMLForPrint_minimal = (cvData: CVData, colors: Colors): string => {
  const { primary, accent, text: textColor, muted } = colors
  const contact = cvData.contact || {}
  const sectionOrder = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education']
  const skillStr = (s: any) => typeof s === 'object' && s.name ? s.name : String(s)

  const sectionHeader = (title: string) =>
    `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="width:8px;height:8px;border-radius:50%;background:${primary};flex-shrink:0;"></div>
      <span style="font-size:12.5px;font-weight:700;color:${primary};letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap;">${title}</span>
      <div style="flex:1;height:1px;background:${accent};"></div>
    </div>`

  const renderSection = (sectionId: string): string => {
    switch (sectionId) {
      case 'contact': {
        if (!contact.fullName && !contact.email) return ''
        const info = [contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean)
        const infoHtml = info.map((v, i) => `${i > 0 ? `<span style="margin:0 8px;color:${accent};font-weight:700;">·</span>` : ''}${v}`).join('')
        return `<div style="margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid ${primary};">
          ${contact.fullName ? `<div style="font-size:28px;font-weight:800;color:${textColor};letter-spacing:-0.5px;line-height:1.15;margin-bottom:6px;">${contact.fullName}</div>` : ''}
          <div style="font-size:11.5px;color:${muted};line-height:1.6;">${infoHtml}</div>
        </div>`
      }
      case 'summary': {
        if (!cvData.summary?.content?.trim()) return ''
        return `<div style="margin-bottom:22px;">${sectionHeader(getSectionTitle(sectionId, cvData.sectionTitles))}<p style="font-size:12px;color:${textColor};line-height:1.8;margin:0;padding-left:18px;">${cvData.summary.content}</p></div>`
      }
      case 'experience': {
        const items = cvData.experience?.items
        if (!items?.length) return ''
        const jobs = items.map(exp => {
          const bullets = (exp.bullets || []).filter((b: string) => b?.trim())
            .map((b: string) => `<li style="font-size:12px;color:${textColor};line-height:1.65;margin-bottom:3px;padding-left:14px;position:relative;list-style:none;"><span style="position:absolute;left:2px;top:7px;width:5px;height:5px;border-radius:50%;background:${primary};display:inline-block;"></span>${b}</li>`).join('')
          return `<div style="margin-bottom:16px;padding-left:18px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;">
              <div><span style="font-size:13px;font-weight:700;color:${textColor};">${exp.title}</span>${exp.company ? `<span style="font-size:12.5px;color:${primary};font-weight:600;"> · ${exp.company}</span>` : ''}${exp.location ? `<span style="font-size:11.5px;color:${muted};"> · ${exp.location}</span>` : ''}</div>
              <span style="font-size:11px;color:${muted};white-space:nowrap;margin-left:10px;">${exp.startDate} – ${exp.current ? 'Hiện tại' : (exp.endDate || '')}</span>
            </div>
            ${bullets ? `<ul style="margin:5px 0 0;padding:0;">${bullets}</ul>` : ''}
          </div>`
        }).join('')
        return `<div style="margin-bottom:22px;">${sectionHeader(getSectionTitle(sectionId, cvData.sectionTitles))}${jobs}</div>`
      }
      case 'skills': {
        const items = cvData.skills?.items
        if (!items?.length) return ''
        const tags = items.map((s: any) => `<span style="font-size:11.5px;color:${primary};background:${accent};border-radius:4px;padding:3px 10px;font-weight:500;border:1px solid ${primary}22;">${skillStr(s)}</span>`).join('')
        return `<div style="margin-bottom:22px;">${sectionHeader(getSectionTitle(sectionId, cvData.sectionTitles))}<div style="padding-left:18px;display:flex;flex-wrap:wrap;gap:6px;">${tags}</div></div>`
      }
      case 'education': {
        const items = cvData.education?.items
        if (!items?.length) return ''
        const edus = items.map(edu => `<div style="margin-bottom:12px;padding-left:18px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div><div style="font-size:13px;font-weight:700;color:${textColor};">${edu.degree}</div>${edu.institution ? `<div style="font-size:12px;color:${primary};font-weight:500;">${edu.institution}${edu.location ? `<span style="color:${muted};font-weight:400;"> · ${edu.location}</span>` : ''}</div>` : ''}</div>
            ${edu.graduationDate ? `<span style="font-size:11px;color:${muted};white-space:nowrap;margin-left:10px;">${edu.graduationDate}</span>` : ''}
          </div>
          ${edu.description ? `<p style="font-size:12px;color:${muted};margin:4px 0 0;line-height:1.5;">${edu.description}</p>` : ''}
        </div>`).join('')
        return `<div style="margin-bottom:22px;">${sectionHeader(getSectionTitle(sectionId, cvData.sectionTitles))}${edus}</div>`
      }
      default: {
        const data = cvData[sectionId]
        if (!data) return ''
        return `<div style="margin-bottom:22px;">${sectionHeader(getSectionTitle(sectionId, cvData.sectionTitles))}${data.content ? `<p style="font-size:12px;color:${textColor};line-height:1.65;margin:0;padding-left:18px;">${data.content}</p>` : ''}</div>`
      }
    }
  }

  return `<!DOCTYPE html><html><head><title>${contact.fullName || 'CV'}</title><meta charset="utf-8">
  <style>
    @page { margin:0; size:A4; }
    @media print { html,body { margin:0;padding:0; } }
    body { font-family:'Inter','Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:${textColor};margin:0;padding:52px 68px;background:white;text-rendering:optimizeLegibility; }
  </style>
  </head><body>${sectionOrder.map(renderSection).join('')}</body></html>`
}

// ── Timeline template HTML ───────────────────────────────────────────────────
const generateHTMLForPrint_timeline = (cvData: CVData, colors: Colors): string => {
  const { primary, accent, text: textColor, muted } = colors
  const contact = cvData.contact || {}
  const sectionOrder = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education']
  const skillStr = (s: any) => typeof s === 'object' && s.name ? s.name : String(s)

  const pillHeader = (title: string) =>
    `<div style="display:inline-flex;align-items:center;background:${primary};color:#fff;font-size:10.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:5px 14px;border-radius:20px;margin-bottom:16px;">${title}</div>`

  const timelineItem = (dateStr: string, title: string, subtitle: string, bullets: string[], isLast: boolean) => {
    const bulletHtml = bullets.length
      ? `<ul style="margin:6px 0 0;padding:0;">${bullets.map(b => `<li style="font-size:12px;color:${textColor};line-height:1.6;margin-bottom:3px;padding-left:12px;position:relative;list-style:none;"><span style="position:absolute;left:0;color:${primary};font-weight:700;">›</span>${b}</li>`).join('')}</ul>`
      : ''
    return `<div style="display:flex;gap:0;">
      <div style="display:flex;flex-direction:column;align-items:center;width:28px;flex-shrink:0;padding-top:3px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${primary};border:2px solid ${accent};flex-shrink:0;"></div>
        ${!isLast ? `<div style="width:2px;flex:1;background:${accent};margin-top:3px;min-height:20px;"></div>` : ''}
      </div>
      <div style="flex:1;padding-bottom:${isLast ? '0' : '16px'};">
        <div style="font-size:10.5px;color:${primary};font-weight:600;margin-bottom:3px;">${dateStr}</div>
        <div style="font-size:13px;font-weight:700;color:${textColor};line-height:1.3;">${title}</div>
        ${subtitle ? `<div style="font-size:12px;color:${primary};font-weight:500;margin-top:1px;">${subtitle}</div>` : ''}
        ${bulletHtml}
      </div>
    </div>`
  }

  const renderSection = (sectionId: string): string => {
    switch (sectionId) {
      case 'contact': {
        if (!contact.fullName && !contact.email) return ''
        const info = [contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean)
          .map((v, i) => `${i > 0 ? `<span style="margin:0 10px;opacity:0.4;">·</span>` : ''}${v}`).join('')
        return `<div style="margin-bottom:22px;padding:22px 28px;background:${primary};border-radius:8px;">
          ${contact.fullName ? `<div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.3px;margin-bottom:8px;line-height:1.2;">${contact.fullName}</div>` : ''}
          <div style="font-size:11px;color:rgba(255,255,255,0.75);line-height:1.8;">${info}</div>
        </div>`
      }
      case 'summary': {
        if (!cvData.summary?.content?.trim()) return ''
        return `<div style="margin-bottom:22px;">${pillHeader(getSectionTitle(sectionId, cvData.sectionTitles))}<p style="font-size:12px;color:${textColor};line-height:1.75;margin:0;padding:10px 14px;background:${accent};border-radius:6px;border-left:3px solid ${primary};">${cvData.summary.content}</p></div>`
      }
      case 'experience': {
        const items = cvData.experience?.items
        if (!items?.length) return ''
        const rows = items.map((exp, idx) => {
          const dateStr = `${exp.startDate} – ${exp.current ? 'Hiện tại' : (exp.endDate || '')}`
          const subtitle = [exp.company, exp.location].filter(Boolean).join(' · ')
          const bullets = (exp.bullets || []).filter((b: string) => b?.trim())
          return timelineItem(dateStr, exp.title, subtitle, bullets, idx === items.length - 1)
        }).join('')
        return `<div style="margin-bottom:22px;">${pillHeader(getSectionTitle(sectionId, cvData.sectionTitles))}${rows}</div>`
      }
      case 'skills': {
        const items = cvData.skills?.items
        if (!items?.length) return ''
        const tags = items.map((s: any) => `<span style="font-size:11.5px;color:${primary};background:${accent};border:1px solid ${primary}30;border-radius:20px;padding:4px 12px;font-weight:500;">${skillStr(s)}</span>`).join('')
        return `<div style="margin-bottom:22px;">${pillHeader(getSectionTitle(sectionId, cvData.sectionTitles))}<div style="display:flex;flex-wrap:wrap;gap:7px;">${tags}</div></div>`
      }
      case 'education': {
        const items = cvData.education?.items
        if (!items?.length) return ''
        const rows = items.map((edu, idx) => {
          const subtitle = [edu.institution, edu.location].filter(Boolean).join(' · ')
          return timelineItem(edu.graduationDate || '', edu.degree, subtitle, [], idx === items.length - 1)
        }).join('')
        return `<div style="margin-bottom:22px;">${pillHeader(getSectionTitle(sectionId, cvData.sectionTitles))}${rows}</div>`
      }
      default: {
        const data = cvData[sectionId]
        if (!data) return ''
        return `<div style="margin-bottom:22px;">${pillHeader(getSectionTitle(sectionId, cvData.sectionTitles))}${data.content ? `<p style="font-size:12px;color:${textColor};margin:0;line-height:1.65;">${data.content}</p>` : ''}</div>`
      }
    }
  }

  return `<!DOCTYPE html><html><head><title>${contact.fullName || 'CV'}</title><meta charset="utf-8">
  <style>
    @page { margin:0; size:A4; }
    @media print { html,body { margin:0;padding:0; } }
    body { font-family:'Inter','Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:${textColor};margin:0;padding:40px 52px;background:white;text-rendering:optimizeLegibility; }
  </style>
  </head><body>${sectionOrder.map(renderSection).join('')}</body></html>`
}

// ── Executive template HTML ──────────────────────────────────────────────────
const generateHTMLForPrint_executive = (cvData: CVData, colors: Colors): string => {
  const { primary, accent, text: textColor, muted } = colors
  const contact = cvData.contact || {}
  const skills = cvData.skills?.items || []
  const sectionOrder = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education']
  const skillStr = (s: any) => typeof s === 'object' && s.name ? s.name : String(s)
  const mainSections = sectionOrder.filter((id: string) => id !== 'contact' && id !== 'skills')

  const sectionHeader = (title: string) =>
    `<div style="font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${primary};border-bottom:2px solid ${primary};padding-bottom:5px;margin-bottom:14px;">${title}</div>`

  const renderMainSection = (sectionId: string): string => {
    switch (sectionId) {
      case 'summary': {
        if (!cvData.summary?.content?.trim()) return ''
        return `<div style="margin-bottom:20px;">${sectionHeader(getSectionTitle(sectionId, cvData.sectionTitles))}<p style="font-size:12px;color:${textColor};line-height:1.75;margin:0;">${cvData.summary.content}</p></div>`
      }
      case 'experience': {
        const items = cvData.experience?.items
        if (!items?.length) return ''
        const jobs = items.map(exp => {
          const bullets = (exp.bullets || []).filter((b: string) => b?.trim())
            .map((b: string) => `<li style="font-size:12px;color:${textColor};line-height:1.6;margin-bottom:3px;padding-left:14px;position:relative;list-style:none;"><span style="position:absolute;left:0;color:${primary};font-weight:700;">›</span>${b}</li>`).join('')
          return `<div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;">
              <div><span style="font-size:13px;font-weight:700;color:${textColor};">${exp.title}</span>${exp.company ? `<span style="font-size:12.5px;color:${primary};font-weight:600;"> · ${exp.company}</span>` : ''}${exp.location ? `<span style="font-size:11.5px;color:${muted};"> · ${exp.location}</span>` : ''}</div>
              <span style="font-size:10.5px;color:#fff;background:${primary};padding:2px 8px;border-radius:3px;white-space:nowrap;margin-left:10px;font-weight:500;">${exp.startDate} – ${exp.current ? 'Hiện tại' : (exp.endDate || '')}</span>
            </div>
            ${bullets ? `<ul style="margin:5px 0 0;padding:0;">${bullets}</ul>` : ''}
          </div>`
        }).join('')
        return `<div style="margin-bottom:20px;">${sectionHeader(getSectionTitle(sectionId, cvData.sectionTitles))}${jobs}</div>`
      }
      case 'education': {
        const items = cvData.education?.items
        if (!items?.length) return ''
        const edus = items.map(edu => `<div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div><div style="font-size:13px;font-weight:700;color:${textColor};">${edu.degree}</div>${edu.institution ? `<div style="font-size:12px;color:${primary};font-weight:500;">${edu.institution}${edu.location ? `<span style="color:${muted};font-weight:400;"> · ${edu.location}</span>` : ''}</div>` : ''}</div>
            ${edu.graduationDate ? `<span style="font-size:10.5px;color:#fff;background:${primary};padding:2px 8px;border-radius:3px;white-space:nowrap;margin-left:10px;font-weight:500;">${edu.graduationDate}</span>` : ''}
          </div>
          ${edu.description ? `<p style="font-size:12px;color:${muted};margin:4px 0 0;line-height:1.5;">${edu.description}</p>` : ''}
        </div>`).join('')
        return `<div style="margin-bottom:20px;">${sectionHeader(getSectionTitle(sectionId, cvData.sectionTitles))}${edus}</div>`
      }
      default: {
        const data = cvData[sectionId]
        if (!data) return ''
        return `<div style="margin-bottom:20px;">${sectionHeader(getSectionTitle(sectionId, cvData.sectionTitles))}${data.content ? `<p style="font-size:12px;color:${textColor};margin:0;line-height:1.65;">${data.content}</p>` : ''}</div>`
      }
    }
  }

  const jobTitle = cvData.experience?.items?.[0]?.title || ''
  const infoLine = [contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean)
    .map((v, i) => `${i > 0 ? `<span style="margin:0 12px;opacity:0.35;">|</span>` : ''}${v}`).join('')

  const sidebarContent = `
    ${skills.length > 0 ? `
      <div style="font-size:9.5px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.55);border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:5px;margin-bottom:10px;">${getSectionTitle('skills', cvData.sectionTitles)}</div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${skills.map((s: any) => `<div style="font-size:11px;color:rgba(255,255,255,0.88);background:rgba(255,255,255,0.1);border-radius:3px;padding:4px 8px;">${skillStr(s)}</div>`).join('')}
      </div>` : ''}
  `

  return `<!DOCTYPE html><html><head><title>${contact.fullName || 'CV'}</title><meta charset="utf-8">
  <style>
    @page { margin:0; size:A4; }
    @media print { html,body { margin:0;padding:0; } }
    body { font-family:'Inter','Segoe UI',sans-serif;font-size:12px;line-height:1.5;margin:0;padding:0;background:white;text-rendering:optimizeLegibility; }
    .cv-wrap { width:794px;min-height:1123px; }
    .header { background:${primary};padding:32px 44px 28px; }
    .body { display:table;width:100%;table-layout:fixed; }
    .sidebar { display:table-cell;width:207px;background:${primary};padding:28px 18px;vertical-align:top;border-top:1px solid rgba(255,255,255,0.1); }
    .main { display:table-cell;padding:28px 36px;vertical-align:top;background:white; }
  </style>
  </head><body><div class="cv-wrap">
    <div class="header">
      ${contact.fullName ? `<div style="font-size:30px;font-weight:800;color:#fff;letter-spacing:-0.5px;line-height:1.15;margin-bottom:4px;">${contact.fullName}</div>` : ''}
      ${jobTitle ? `<div style="font-size:14px;color:rgba(255,255,255,0.65);">${jobTitle}</div>` : ''}
      <div style="font-size:11px;color:rgba(255,255,255,0.7);border-top:1px solid rgba(255,255,255,0.15);padding-top:12px;margin-top:14px;line-height:1.6;">${infoLine}</div>
    </div>
    <div class="body"><div class="sidebar">${sidebarContent}</div><div class="main">${mainSections.map(renderMainSection).join('')}</div></div>
  </div></body></html>`
}

// Generate HTML for printing (PDF simulation) - EXACTLY matching preview (Classic template)
const generateHTMLForPrint = (cvData: CVData, colors?: { primary: string; accent: string; text: string; muted: string }): string => {
  const { primary = '#111827', accent = '#d1d5db', text: textColor = '#111827', muted = '#6b7280' } = colors || {}
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
          color: ${primary};
          text-align: center;
          line-height: 1.2;
        }
        .contact-info {
          font-size: 12px;
          margin-bottom: 5px;
          color: ${muted};
          text-align: center;
          line-height: 1.4;
        }

        /* Summary section - EXACTLY matching preview */
        .summary-section { margin-bottom: 20px; }
        .summary-text {
          font-size: 14px;
          color: ${textColor};
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
          border-bottom: 2px solid ${accent};
          margin-bottom: 16px;
          padding-bottom: 8px;
          color: ${primary};
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
          color: ${muted};
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
        html += `<div class="skills-text">${sectionData.items.map(skillName).join(' | ')}</div>`;
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

// (RTF fallback removed — DOCX now uses the `docx` library via utils/docxGenerator.ts.)
