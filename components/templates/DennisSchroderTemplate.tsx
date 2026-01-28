import React, { memo } from 'react';
import { detectLanguage } from '../../config/languageConfig';

interface DennisSchroderTemplateProps {
  cvData: any;
  activeSection?: string | null;
  onSectionClick: (sectionId: string) => void;
  currentPage?: number;
  totalPages?: number;
  isPreview?: boolean; // New prop to distinguish preview from PDF generation
  language?: string;
}

export const DennisSchroderTemplate = memo<DennisSchroderTemplateProps>(({
  cvData,
  activeSection,
  onSectionClick,
  currentPage = 1,
  totalPages = 1,
  isPreview = false,
  language
}: DennisSchroderTemplateProps) => {
  // Get current language
  const currentLanguage = language || (typeof window !== 'undefined' ? localStorage.getItem('okbuddy_language') : null) || detectLanguage().language;
  
  const getSectionClass = (section: string) => {
    return `p-2 -mx-2 cv-section ${activeSection === section ? 'bg-blue-50 rounded-sm' : ''}`;
  };

  // Default section titles - EXACTLY matching PDF output
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

  // Get section title (custom or default) - EXACTLY matching PDF
  const getSectionTitle = (sectionId: string) => {
    if (cvData.sectionTitles?.[sectionId]) {
      return cvData.sectionTitles[sectionId].toUpperCase();
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
    
    if (!data) {
      return false;
    }
    
    let result = false;
    switch (sectionId) {
      case 'contact':
        result = data.fullName || data.email || data.phone || data.location;
        break;
      case 'summary':
        result = data.content && typeof data.content === 'string' && data.content.trim();
        break;
      case 'experience':
        result = data.items && data.items.length > 0 && data.items.some((item: any) => item.title || item.company);
        break;
      case 'skills':
        result = data.items && data.items.length > 0;
        break;
      case 'education':
        result = data.items && data.items.length > 0 && data.items.some((item: any) => item.degree || item.institution);
        break;
      default:
        // For custom sections
        if (data.items) {
          result = data.items.length > 0;
        } else if (data.content) {
          result = data.content.trim();
        } else {
          result = false;
        }
    }
    
    return result;
  };

  // PDF-exact styling constants
  const styles = {
    // Contact section - EXACTLY matching PDF
    contactName: {
      fontSize: '20px',
      fontWeight: 'bold' as const,
      marginBottom: '12px',
      color: '#111827',
      textAlign: 'center' as const,
      lineHeight: '1.2'
    },
    contactInfo: {
      fontSize: '12px',
      color: '#6b7280',
      textAlign: 'center' as const,
      marginBottom: '5px',
      lineHeight: '1.4'
    },
    // Summary section - EXACTLY matching PDF
    summaryText: {
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.5',
      marginBottom: '20px',
      textAlign: 'justify' as const
    },
    // Section headers - EXACTLY matching PDF
    sectionHeader: {
      fontSize: '16px',
      fontWeight: 'bold' as const,
      textTransform: 'uppercase' as const,
      borderBottom: '2px solid #d1d5db',
      marginBottom: '16px',
      paddingBottom: '8px',
      color: '#111827',
      letterSpacing: '0.5px'
    },
    // Job entries - EXACTLY matching PDF
    jobHeader: {
      fontWeight: '600' as const,
      fontSize: '14px',
      marginBottom: '5px',
      lineHeight: '1.3'
    },
    jobDates: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '5px',
      lineHeight: '1.3'
    },
    jobBullets: {
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.4',
      marginLeft: '0px',
      marginBottom: '3px'
    },
    // Skills section - EXACTLY matching PDF
    skillsText: {
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.4'
    },
    // Education section - EXACTLY matching PDF
    educationEntry: {
      fontSize: '14px',
      marginBottom: '10px',
      lineHeight: '1.3'
    }
  };

  // Render contact section - EXACTLY matching PDF
  const renderContactSection = () => {
    if (!hasContent('contact', cvData.contact)) return null;
    
    return (
      <div className={`mb-5 ${getSectionClass('contact')}`} onClick={() => onSectionClick('contact')} data-section="contact">
        <div style={styles.contactName}>
          {cvData.contact.fullName}
        </div>
        <div style={styles.contactInfo}>
          {[
            cvData.contact.email,
            cvData.contact.phone,
            cvData.contact.location,
            cvData.contact.linkedin
          ].filter(Boolean).join(' | ')}
        </div>
      </div>
    );
  };

  // Render summary section - EXACTLY matching PDF
  const renderSummarySection = () => {
    if (!hasContent('summary', cvData.summary)) return null;
    
    return (
      <div className={`mb-5 ${getSectionClass('summary')}`} onClick={() => onSectionClick('summary')} data-section="summary">
        <div style={styles.summaryText}>
          {cvData.summary.content}
        </div>
      </div>
    );
  };

  // Render experience section - EXACTLY matching PDF
  const renderExperienceSection = (sectionId: string) => {
    const data = cvData[sectionId] || cvData.experience;
    
    if (!hasContent(sectionId, data)) {
      return null;
    }

    return (
      <div className={`mb-5 ${getSectionClass(sectionId)}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
        <div style={styles.sectionHeader}>
          {getSectionTitle(sectionId)}
        </div>
        {data.items.map((exp: any) => (
          <div key={exp.id} style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={styles.jobHeader}>
                <strong>{exp.title}</strong>
                {exp.company && <span>, {exp.company}</span>}
                {exp.location && <span> – {exp.location}</span>}
              </div>
              <div style={styles.jobDates}>
                {exp.startDate} – {exp.current ? (currentLanguage === 'vi' ? 'Hiện tại' : 'Current') : exp.endDate}
              </div>
            </div>
            {exp.bullets?.length > 0 && (
              <div style={{ marginLeft: '0px' }}>
                {exp.bullets.map((bullet: string, index: number) => 
                  bullet && bullet.trim() ? (
                    <div key={index} style={styles.jobBullets}>
                      • {bullet}
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render skills section - EXACTLY matching PDF
  const renderSkillsSection = (sectionId: string) => {
    const data = cvData[sectionId] || cvData.skills;
    
    if (!hasContent(sectionId, data)) {
      return null;
    }

    return (
      <div className={`mb-5 ${getSectionClass(sectionId)}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
        <div style={styles.sectionHeader}>
          {getSectionTitle(sectionId)}
        </div>
        <div style={styles.skillsText}>
          {/* Handle both string arrays and skill objects */}
          {data.items.map((skill: any) => {
            // If skill is an object with name property, use name
            if (typeof skill === 'object' && skill.name) {
              return skill.name;
            }
            // If skill is a string, use it directly
            return skill;
          }).join(' | ')}
        </div>
      </div>
    );
  };

  // Render education section - EXACTLY matching PDF
  const renderEducationSection = (sectionId: string) => {
    const data = cvData[sectionId] || cvData.education;
    
    if (!hasContent(sectionId, data)) {
      return null;
    }

    return (
      <div className={`mb-5 ${getSectionClass(sectionId)}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
        <div style={styles.sectionHeader}>
          {getSectionTitle(sectionId)}
        </div>
        {data.items.map((edu: any) => (
          <div key={edu.id} style={styles.educationEntry}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div>
                <strong>{edu.degree}</strong>
                {edu.institution && <span>, {edu.institution}</span>}
                {edu.location && <span> – {edu.location}</span>}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {edu.graduationDate}
              </div>
            </div>
            {edu.description && (
              <div style={{ fontSize: '14px', color: '#374151', marginTop: '5px' }}>
                {edu.description}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render custom section with content - EXACTLY matching PDF
  const renderCustomSection = (sectionId: string) => {
    const data = cvData[sectionId];
    if (!hasContent(sectionId, data)) return null;

    return (
      <div className={`mb-5 ${getSectionClass(sectionId)}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
        <div style={styles.sectionHeader}>
          {getSectionTitle(sectionId)}
        </div>
        {data.content && (
          <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', color: '#374151', lineHeight: '1.5' }}>
            {data.content}
          </div>
        )}
        {data.items && data.items.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            {data.items.map((item: any, index: number) => (
              <div key={item.id || index} style={{ fontSize: '14px', marginBottom: '8px' }}>
                {item.title && <div style={{ fontWeight: '600' }}>{item.title}</div>}
                {item.description && <div style={{ color: '#374151' }}>{item.description}</div>}
                {item.organization && <div style={{ color: '#374151' }}>{item.organization}</div>}
                {item.name && <div style={{ color: '#374151' }}>{item.name}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render section based on type
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'contact':
        return renderContactSection();
      case 'summary':
        return renderSummarySection();
      case 'experience':
        return renderExperienceSection(sectionId);
      case 'skills':
        return renderSkillsSection(sectionId);
      case 'education':
        return renderEducationSection(sectionId);
      default:
        // Handle custom sections
        if (sectionId.startsWith('projects-') || sectionId.startsWith('volunteer-') || 
            sectionId.startsWith('certifications-') || sectionId.startsWith('languages-') ||
            sectionId.includes('experience')) {
          return renderExperienceSection(sectionId);
        } else if (sectionId.startsWith('skills-') || sectionId.includes('skills')) {
          return renderSkillsSection(sectionId);
        } else {
          return renderCustomSection(sectionId);
        }
    }
  };

  // Pagination logic - determine which sections to show on current page
  const getSectionsForPage = (page: number) => {
    const allSections = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'];
    
    if (totalPages === 1) {
      return allSections;
    }

    // More accurate content height estimation for pagination
    const sectionHeights: Record<string, number> = {};
    
    // Contact section - fixed height
    sectionHeights['contact'] = 100;
    
    // Summary section - based on actual text length
    if (cvData.summary?.content) {
      const summaryText = cvData.summary.content;
      const charactersPerLine = 85; // Approximate for 14px font at A4 width
      const linesNeeded = Math.ceil(summaryText.length / charactersPerLine);
      sectionHeights['summary'] = Math.max(60, linesNeeded * 21 + 40);
    }
    
    // Experience section - detailed calculation
    if (cvData.experience?.items?.length) {
      let expHeight = 60; // Section header
      cvData.experience.items.forEach((exp: any) => {
        expHeight += 60; // Job header and dates
        if (exp.bullets?.length) {
          exp.bullets.forEach((bullet: string) => {
            if (bullet.trim()) {
              const bulletLines = Math.ceil(bullet.length / 90);
              expHeight += bulletLines * 18;
            }
          });
        }
        expHeight += 15; // Gap between jobs
      });
      sectionHeights['experience'] = expHeight;
    }
    
    // Skills section - based on text wrapping
    if (cvData.skills?.items?.length) {
      const skillsText = cvData.skills.items.join(' | ');
      const skillLines = Math.ceil(skillsText.length / 85);
      sectionHeights['skills'] = 60 + (skillLines * 20);
    }
    
    // Education section
    if (cvData.education?.items?.length) {
      let eduHeight = 60; // Section header
      cvData.education.items.forEach((edu: any) => {
        eduHeight += 50; // Each education entry
        if (edu.description) {
          const descLines = Math.ceil(edu.description.length / 85);
          eduHeight += descLines * 18;
        }
      });
      sectionHeights['education'] = eduHeight;
    }
    
    // Other sections
    Object.keys(cvData).forEach(key => {
      if (!sectionHeights[key] && allSections.includes(key)) {
        sectionHeights[key] = 60; // Default height
      }
    });

    // Distribute sections across pages with intelligent page break logic
    const pageHeight = 1100; // More realistic A4 content height for better content distribution
    const bottomMargin = 76; // 0.75 inch bottom margin in pixels
    const usablePageHeight = pageHeight - bottomMargin; // Content area before margin
    const pages: string[][] = [];
    let currentPageSections: string[] = [];
    let currentPageHeight = 0;
    
    // Helper function to check if a section should stay together
    const shouldKeepTogether = (section: string, sectionHeight: number) => {
      // Content-Aware Decisions from specifications:
      
      // 1. Section Boundaries: Keep headers with following content
      if (sectionHeight > 0 && sectionHeight < 120) {
        // Small sections (headers + minimal content) should stay together
        return true;
      }
      
      // 2. Keep-Together Rules: Allow experience to split but keep individual jobs together
      if (section === 'experience') {
        // Allow work experience section to be distributed across pages
        // Individual job entries will be kept together in rendering logic
        return false;
      }
      
      // 3. List Management: Bullet lists maintain proper grouping
      if (section === 'skills') {
        // Skills section should stay together (typically fits on one page)
        return sectionHeight < usablePageHeight * 0.3; // If less than 30% of page
      }
      
      return false;
    };
    
    // Helper function to check minimum content requirement
    const hasMinimumContent = (section: string) => {
      switch (section) {
        case 'contact':
          return cvData.contact?.fullName; // Must have at least a name
        case 'summary':
          return cvData.summary?.content && cvData.summary.content.length > 50; // Meaningful summary
        case 'experience':
          return cvData.experience?.items && cvData.experience.items.length > 0; // At least one job
        case 'skills':
          return cvData.skills?.items && cvData.skills.items.length >= 3; // At least 3 skills
        case 'education':
          return cvData.education?.items && cvData.education.items.length > 0; // At least one degree
        default:
          return true;
      }
    };
    
    for (const section of allSections) {
      const sectionHeight = sectionHeights[section] || 0;
      
      if (sectionHeight === 0 || !hasMinimumContent(section)) continue; // Skip empty/insufficient sections
      
      // Professional Page Break Logic:
      // "Content approaching bottom margin triggers new page"
      const wouldExceedUsableHeight = currentPageHeight + sectionHeight > usablePageHeight;
      const hasContentOnPage = currentPageSections.length > 0;
      
      if (wouldExceedUsableHeight && hasContentOnPage) {
        // Check if this section should be kept together
        if (shouldKeepTogether(section, sectionHeight)) {
          // Move entire section to next page to keep it together
          pages.push(currentPageSections);
          currentPageSections = [section];
          currentPageHeight = sectionHeight;
        } else {
          // Section can be split - add it to current page if there's some room
          const remainingSpace = usablePageHeight - currentPageHeight;
          
          if (remainingSpace > 100) { // If at least 100px left, use current page
            currentPageSections.push(section);
            currentPageHeight += sectionHeight;
          } else {
            // Not enough space, move to next page
            pages.push(currentPageSections);
            currentPageSections = [section];
            currentPageHeight = sectionHeight;
          }
        }
      } else {
        // Section fits on current page
        currentPageSections.push(section);
        currentPageHeight += sectionHeight;
      }
    }
    
    // Add the last page
    if (currentPageSections.length > 0) {
      pages.push(currentPageSections);
    }
    
    return pages[page - 1] || [];
  };

  const sectionsToShow = getSectionsForPage(currentPage);

  return (
    <div 
      className="bg-white text-gray-900 overflow-hidden w-full h-full cv-content" 
      style={{ 
        minHeight: '100%',
        // EXACTLY matching PDF margins and spacing
        padding: '57px 76px', // 0.75in top/bottom, 1in left/right at 96 DPI
        fontSize: '12px', // Base font size matching PDF
        lineHeight: '1.4',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        // Ensure consistent text rendering
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}
    >
      {sectionsToShow.map((sectionId: string) => {
        const renderedSection = renderSection(sectionId);
        return (
          <div key={sectionId}>
            {renderedSection}
          </div>
        );
      })}
      
      {/* Page indicator for multi-page documents - matching PDF */}
      {totalPages > 1 && (
        <div 
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '0',
            right: '0',
            textAlign: 'center',
            fontSize: '10px',
            color: '#9ca3af'
          }}
        >
          {currentPage}
        </div>
      )}
    </div>
  );
});

// Display name for React DevTools
DennisSchroderTemplate.displayName = 'DennisSchroderTemplate';