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

  // Default section titles - Dynamic based on language
  const defaultSectionTitles: Record<string, string> = currentLanguage === 'vi' ? {
    summary: '', // Summary doesn't show a title in PDF
    experience: 'KINH NGHIỆM LÀM VIỆC',
    skills: 'KỸ NĂNG',
    education: 'HỌC VẤN',
    projects: 'DỰ ÁN',
    volunteer: 'HOẠT ĐỘNG TÌNH NGUYỆN',
    certifications: 'CHỨNG CHỈ',
    languages: 'NGÔN NGỮ',
    hobbies: 'SỞ THÍCH'
  } : {
    summary: '', // Summary doesn't show a title in PDF
    experience: 'WORK EXPERIENCE',
    skills: 'SKILLS',
    education: 'EDUCATION',
    projects: 'PROJECTS',
    volunteer: 'VOLUNTEER WORK',
    certifications: 'CERTIFICATIONS',
    languages: 'LANGUAGES',
    hobbies: 'HOBBIES'
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
    if (sectionId.startsWith('custom-')) return currentLanguage === 'vi' ? 'PHẦN TÙY CHỈNH' : 'CUSTOM SECTION';
    
    return defaultSectionTitles[sectionId] || (currentLanguage === 'vi' ? 'PHẦN KHÁC' : 'OTHER SECTION');
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
    
    // Always show section title, even if no content

    // Simple hardcoded fix: Only show header on page 1 for experience section
    const shouldShowHeader = sectionId === 'experience' ? currentPage === 1 : true;

    return (
      <div className={`mb-5 ${getSectionClass(sectionId)}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
        {shouldShowHeader && (
          <div style={styles.sectionHeader}>
            {getSectionTitle(sectionId)}
          </div>
        )}
        {(data.items && data.items.length > 0) ? getExperienceItemsForPage(data.items, currentPage).map((exp: any) => (
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
        )) : null}
      </div>
    );
  };

  // Render skills section - EXACTLY matching PDF with enhanced debugging
  const renderSkillsSection = (sectionId: string) => {
    const data = cvData[sectionId] || cvData.skills;
    
    // COMPREHENSIVE SKILLS DEBUG
    if (typeof window !== 'undefined' && sectionId === 'skills') {
      console.log(`\n🎯 ===== SKILLS SECTION DEBUG =====`);
      console.log(`🎯 Skills sectionId:`, sectionId);
      console.log(`🎯 Skills data source:`, data);
      console.log(`🎯 Skills items exists:`, !!data.items);
      console.log(`🎯 Skills items type:`, typeof data.items);
      console.log(`🎯 Skills items length:`, data.items?.length || 0);
      console.log(`🎯 Skills raw items:`, data.items);
      
      if (data.items && data.items.length > 0) {
        console.log(`🎯 Skills item analysis:`, data.items.map((skill: any, idx: number) => ({
          index: idx,
          type: typeof skill,
          isObject: typeof skill === 'object',
          hasName: skill && typeof skill === 'object' && 'name' in skill,
          value: skill,
          stringValue: typeof skill === 'object' ? JSON.stringify(skill) : skill
        })));
        
        const processedSkills = data.items.map((skill: any) => {
          if (typeof skill === 'object' && skill !== null) {
            if (skill.name) {
              return skill.name;
            } else {
              console.warn(`🎯 WARNING: Skill object without name property:`, skill);
              return `[object Object: ${JSON.stringify(skill)}]`;
            }
          }
          return skill;
        });
        
        console.log(`🎯 Processed skills for display:`, processedSkills);
        console.log(`🎯 Final skills string:`, processedSkills.join(' | '));
      }
      console.log(`🎯 ===== END SKILLS DEBUG =====\n`);
    }

    return (
      <div className={`mb-5 ${getSectionClass(sectionId)}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
        <div style={styles.sectionHeader}>
          {getSectionTitle(sectionId)}
        </div>
        {(data.items && data.items.length > 0) && (
          <div style={styles.skillsText}>
            {/* Enhanced skill handling with debugging */}
            {data.items.map((skill: any, index: number) => {
              // If skill is an object with name property, use name
              if (typeof skill === 'object' && skill !== null && skill.name) {
                return skill.name;
              }
              // If skill is a string, use it directly
              if (typeof skill === 'string') {
                return skill;
              }
              // Fallback for unknown skill types
              console.warn(`🎯 Unknown skill type at index ${index}:`, skill);
              return typeof skill === 'object' ? `[Unknown: ${JSON.stringify(skill)}]` : String(skill);
            }).filter(Boolean).join(' | ')}
          </div>
        )}
      </div>
    );
  };

  // Render education section - EXACTLY matching PDF
  const renderEducationSection = (sectionId: string) => {
    const data = cvData[sectionId] || cvData.education;
    
    // Always show section title, even if no content

    return (
      <div className={`mb-5 ${getSectionClass(sectionId)}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
        <div style={styles.sectionHeader}>
          {getSectionTitle(sectionId)}
        </div>
        {(data.items && data.items.length > 0) ? data.items.map((edu: any) => (
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
        )) : null}
      </div>
    );
  };

  // Render custom section with content - Enhanced for all section types
  const renderCustomSection = (sectionId: string) => {
    const data = cvData[sectionId];
    // Always show section title, even if no content

    return (
      <div className={`mb-5 ${getSectionClass(sectionId)}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
        <div style={styles.sectionHeader}>
          {getSectionTitle(sectionId)}
        </div>
        
        {/* Handle simple content (like hobbies) */}
        {(data && data.content && data.content.trim()) && (
          <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', color: '#374151', lineHeight: '1.5' }}>
            {data.content}
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
        // Handle custom sections - ALL should use renderCustomSection for proper structured data display
        if (sectionId.startsWith('projects-') || sectionId.startsWith('volunteer-') || 
            sectionId.startsWith('certifications-') || sectionId.startsWith('languages-') ||
            sectionId.startsWith('hobbies-') || sectionId.startsWith('custom-')) {
          return renderCustomSection(sectionId);
        } else if (sectionId.includes('experience')) {
          return renderExperienceSection(sectionId);
        } else if (sectionId.startsWith('skills-') || sectionId.includes('skills')) {
          return renderSkillsSection(sectionId);
        } else {
          return renderCustomSection(sectionId);
        }
    }
  };

  // INTELLIGENT pagination for experience items based on actual content height
  const getExperienceItemsForPage = (experienceItems: any[], targetPage: number) => {
    if (!experienceItems || experienceItems.length === 0) return [];
    if (totalPages === 1) return experienceItems;
    
    // Calculate available space for experience items on each page
    const pageContentHeight = 980; // A4 page height (same as PreviewPanel)
    
    // Fixed content heights
    const contactHeight = cvData.contact?.fullName ? 100 : 0;
    const summaryHeight = cvData.summary?.content ? 
      Math.max(60, Math.ceil(cvData.summary.content.length / 85) * 21 + 40) : 0;
    const skillsHeight = cvData.skills?.items?.length ? 
      60 + Math.ceil(cvData.skills.items.map((skill: any) => {
        // Normalize skills for height calculation - handle both strings and objects
        if (typeof skill === 'object' && skill !== null && skill.name) {
          return skill.name;
        }
        if (typeof skill === 'string') {
          return skill;
        }
        return String(skill);
      }).filter(Boolean).join(' | ').length / 85) * 20 : 0;
    const educationHeight = cvData.education?.items?.length ? 
      60 + cvData.education.items.reduce((sum: number, edu: any) => 
        sum + 50 + (edu.description ? Math.ceil(edu.description.length / 85) * 18 : 0), 0) : 0;
    
    // Calculate individual experience item heights
    const experienceItemHeights = experienceItems.map((exp: any) => {
      let itemHeight = 70; // Job header and dates
      if (exp.bullets?.length) {
        exp.bullets.forEach((bullet: string) => {
          if (bullet?.trim()) {
            const bulletLines = Math.ceil(bullet.length / 90);
            itemHeight += bulletLines * 18;
          }
        });
      }
      itemHeight += 15; // Gap between jobs
      return itemHeight;
    });
    
    // Distribute items intelligently across pages
    if (targetPage === 1) {
      // Page 1: Contact + Summary + Experience header (60px) + as many experience items as fit
      const page1FixedContent = contactHeight + summaryHeight + 60; // Experience header
      let availableHeight = pageContentHeight - page1FixedContent;
      
      const itemsForPage1: any[] = [];
      let currentHeight = 0;
      
      for (let i = 0; i < experienceItems.length; i++) {
        const itemHeight = experienceItemHeights[i];
        if (currentHeight + itemHeight <= availableHeight) {
          itemsForPage1.push(experienceItems[i]);
          currentHeight += itemHeight;
        } else {
          break; // Stop when we run out of space
        }
      }
      
      // COMPREHENSIVE PAGE 1 DEBUG
      if (typeof window !== 'undefined') {
        console.log(`\n📊 ===== INTELLIGENT PAGE 1 PAGINATION =====`);
        console.log(`📊 Height calculations:`, {
          contactHeight,
          summaryHeight,
          experienceHeaderHeight: 60,
          totalFixedContent: page1FixedContent,
          availableForExperience: availableHeight,
          pageContentHeight
        });
        
        console.log(`📊 Experience item processing:`, {
          totalExperienceItems: experienceItems.length,
          itemHeights: experienceItemHeights,
          itemsSelected: itemsForPage1.length,
          usedHeight: currentHeight,
          remainingHeight: availableHeight - currentHeight,
          utilizationPercent: Math.round((currentHeight / availableHeight) * 100)
        });
        
        console.log(`📊 Selected items for page 1:`, itemsForPage1.map((item, idx) => ({
          index: idx,
          title: item.title,
          company: item.company,
          bulletCount: item.bullets?.length || 0,
          estimatedHeight: experienceItemHeights[idx]
        })));
        
        console.log(`📊 ===== END PAGE 1 PAGINATION =====\n`);
      }
      
      return itemsForPage1;
      
    } else if (targetPage === 2) {
      // Page 2: Experience items that didn't fit on page 1 + Skills + Education
      // Recalculate page 1 items to avoid recursion
      const page1FixedContent = contactHeight + summaryHeight + 60;
      let page1AvailableHeight = pageContentHeight - page1FixedContent;
      let page1ItemCount = 0;
      let page1Height = 0;
      
      for (let i = 0; i < experienceItems.length; i++) {
        const itemHeight = experienceItemHeights[i];
        if (page1Height + itemHeight <= page1AvailableHeight) {
          page1ItemCount++;
          page1Height += itemHeight;
        } else {
          break;
        }
      }
      
      const remainingItems = experienceItems.slice(page1ItemCount);
      
      // Debug: Log page 2 content
      if (typeof window !== 'undefined') {
        console.log(`📊 INTELLIGENT PAGE 2 PAGINATION:`, {
          remainingExperienceItems: remainingItems.length,
          skillsHeight,
          educationHeight,
          totalPage2Height: remainingItems.reduce((sum, _, idx) => 
            sum + experienceItemHeights[page1ItemCount + idx], 0) + skillsHeight + educationHeight
        });
      }
      
      return remainingItems;
    }
    
    return [];
  };

  // Check if experience section header should be shown on current page
  const shouldShowExperienceHeader = (targetPage: number) => {
    const sectionsOnPage = getSectionsForPage(targetPage);
    return sectionsOnPage.includes('experience');
  };

  // Industry-standard pagination like Microsoft Word/Google Docs
  const getSectionsForPage = (page: number) => {
    const allSections = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'];
    
    // Show ALL sections - titles should appear even without content
    const sectionsWithContent = allSections;
    
    if (totalPages === 1) {
      return sectionsWithContent;
    }

    // DYNAMIC: Experience-aware pagination logic
    // Experience section appears on both pages if it spans multiple pages
    if (totalPages === 2) {
      // Check if experience section has items that span both pages
      const experienceItems = cvData.experience?.items || [];
      // Calculate page 1 capacity without recursion
      let page1Capacity = 0;
      if (experienceItems.length > 0) {
        const pageContentHeight = 980;
        const contactHeight = cvData.contact?.fullName ? 100 : 0;
        const summaryHeight = cvData.summary?.content ? 
          Math.max(60, Math.ceil(cvData.summary.content.length / 85) * 21 + 40) : 0;
        const page1FixedContent = contactHeight + summaryHeight + 60;
        const page1AvailableHeight = pageContentHeight - page1FixedContent;
        
        let currentHeight = 0;
        for (let i = 0; i < experienceItems.length; i++) {
          const exp = experienceItems[i];
          let itemHeight = 70; // Job header and dates
          if (exp.bullets?.length) {
            exp.bullets.forEach((bullet: string) => {
              if (bullet?.trim()) {
                const bulletLines = Math.ceil(bullet.length / 90);
                itemHeight += bulletLines * 18;
              }
            });
          }
          itemHeight += 15; // Gap between jobs
          
          if (currentHeight + itemHeight <= page1AvailableHeight) {
            page1Capacity++;
            currentHeight += itemHeight;
          } else {
            break;
          }
        }
      }
      const hasExperienceOnPage2 = experienceItems.length > page1Capacity;
      
      if (page === 1) {
        // Page 1: Contact + Summary + Experience (if has items)
        const page1Sections = ['contact', 'summary'];
        if (experienceItems.length > 0) {
          page1Sections.push('experience');
        }
        return page1Sections.filter(sId => sectionsWithContent.includes(sId));
      } else if (page === 2) {
        // Page 2: Experience (if continues from page 1) + Skills + Education
        const page2Sections = [];
        if (hasExperienceOnPage2) {
          page2Sections.push('experience');
        }
        page2Sections.push('skills', 'education');
        return page2Sections.filter(sId => sectionsWithContent.includes(sId));
      }
    }

    // Fallback to original logic for other cases
    const pageContentHeight = 850;
    const sectionHeights = calculateSectionHeights(sectionsWithContent);
    
    // Distribute sections across pages intelligently
    const pages: string[][] = [];
    let currentPageSections: string[] = [];
    let currentPageHeight = 0;
    
    for (const sectionId of sectionsWithContent) {
      const sectionHeight = sectionHeights[sectionId] || 0;
      
      // Microsoft Word/Google Docs logic: If adding this section would overflow the page
      if (currentPageHeight + sectionHeight > pageContentHeight && currentPageSections.length > 0) {
        // Finish current page and start new page
        pages.push(currentPageSections);
        currentPageSections = [sectionId];
        currentPageHeight = sectionHeight;
      } else {
        // Add section to current page
        currentPageSections.push(sectionId);
        currentPageHeight += sectionHeight;
      }
    }
    
    // Add the last page
    if (currentPageSections.length > 0) {
      pages.push(currentPageSections);
    }
    
    // Debug logging for pagination
    if (typeof window !== 'undefined' && page === 1) {
      console.log('🔧 Pagination Debug:', {
        totalPages,
        pageContentHeight,
        sectionHeights,
        pages: pages.map((pageContent, idx) => ({
          page: idx + 1,
          sections: pageContent,
          totalHeight: pageContent.reduce((sum, sId) => sum + (sectionHeights[sId] || 0), 0)
        }))
      });
    }
    
    // Return sections for the requested page (1-indexed)
    return pages[page - 1] || [];
  };

  // Calculate realistic section heights for pagination
  const calculateSectionHeights = (sections: string[]) => {
    const heights: Record<string, number> = {};
    
    sections.forEach(sectionId => {
      switch (sectionId) {
        case 'contact':
          heights[sectionId] = 100; // Fixed height for contact info
          break;
        case 'summary':
          if (cvData.summary?.content) {
            const textLength = cvData.summary.content.length;
            const lines = Math.ceil(textLength / 85); // chars per line
            heights[sectionId] = Math.max(80, lines * 20 + 40); // line height + margins
          } else {
            heights[sectionId] = 0;
          }
          break;
        case 'experience':
          if (cvData.experience?.items?.length) {
            let expHeight = 60; // Section header
            cvData.experience.items.forEach((exp: any) => {
              expHeight += 70; // Job title, company, dates
              if (exp.bullets?.length) {
                exp.bullets.forEach((bullet: string) => {
                  if (bullet?.trim()) {
                    const bulletLines = Math.ceil(bullet.length / 90);
                    expHeight += bulletLines * 18;
                  }
                });
              }
              expHeight += 15; // Gap between jobs
            });
            heights[sectionId] = expHeight;
            
            // If experience section is very large (>600px), it should be considered splittable
            if (expHeight > 600) {
              // Large experience sections can be distributed across pages
              heights[sectionId] = Math.min(expHeight, 500); // Cap at reasonable height per page
            }
          } else {
            heights[sectionId] = 0;
          }
          break;
        case 'skills':
          if (cvData.skills?.items?.length) {
            // Normalize skills for height calculation - handle both strings and objects
            const normalizedSkills = cvData.skills.items.map((skill: any) => {
              if (typeof skill === 'object' && skill !== null && skill.name) {
                return skill.name;
              }
              if (typeof skill === 'string') {
                return skill;
              }
              return String(skill);
            }).filter(Boolean);
            
            const skillsText = normalizedSkills.join(' | ');
            const lines = Math.ceil(skillsText.length / 85);
            heights[sectionId] = 60 + (lines * 20);
          } else {
            heights[sectionId] = 0;
          }
          break;
        case 'education':
          if (cvData.education?.items?.length) {
            let eduHeight = 60; // Section header
            cvData.education.items.forEach((edu: any) => {
              eduHeight += 50; // Each education entry
              if (edu.description) {
                const lines = Math.ceil(edu.description.length / 85);
                eduHeight += lines * 18;
              }
            });
            heights[sectionId] = eduHeight;
          } else {
            heights[sectionId] = 0;
          }
          break;
        default:
          heights[sectionId] = 60; // Default height for custom sections
      }
    });
    
    return heights;
  };

  const sectionsToShow = getSectionsForPage(currentPage);

  // COMPREHENSIVE DEBUG: Deep analysis of pagination and data issues
  if (typeof window !== 'undefined') {
    const experienceItems = cvData.experience?.items || [];
    const page1Items = experienceItems.length > 0 ? getExperienceItemsForPage(experienceItems, 1) : [];
    const page2Items = experienceItems.length > 0 ? getExperienceItemsForPage(experienceItems, 2) : [];
    
    // CRITICAL DATA FLOW ANALYSIS
    console.log(`\n🚨 ===== CRITICAL CV TEMPLATE DATA FLOW DEBUG =====`);
    console.log(`🚨 CVDATA FULL OBJECT:`, cvData);
    console.log(`🚨 PAGE ${currentPage}/${totalPages} ANALYSIS`);
    console.log(`🚨 Props received:`, { currentPage, totalPages, isPreview, activeSection });
    console.log(`🚨 Sections to show:`, sectionsToShow);
    console.log(`🚨 Experience analysis:`, {
      hasExperienceProperty: !!cvData.experience,
      experienceType: typeof cvData.experience,
      experienceKeys: cvData.experience ? Object.keys(cvData.experience) : [],
      hasItemsProperty: !!cvData.experience?.items,
      itemsType: typeof cvData.experience?.items,
      itemsLength: cvData.experience?.items?.length || 0,
      rawExperience: cvData.experience,
      firstThreeItems: experienceItems.slice(0, 3).map((item: any) => ({
        title: item.title,
        company: item.company,
        hasTitle: !!item.title,
        hasCompany: !!item.company,
        bulletCount: item.bullets?.length || 0
      }))
    });
    
    // SKILLS DEEP ANALYSIS
    console.log(`🚨 Skills deep analysis:`, {
      hasSkillsProperty: !!cvData.skills,
      skillsType: typeof cvData.skills,
      skillsKeys: cvData.skills ? Object.keys(cvData.skills) : [],
      hasItemsProperty: !!cvData.skills?.items,
      skillsItemsType: typeof cvData.skills?.items,
      skillsItemsLength: cvData.skills?.items?.length || 0,
      rawSkillsObject: cvData.skills,
      rawSkillsItems: cvData.skills?.items
    });
    
    // PAGE DISTRIBUTION ANALYSIS
    console.log(`🚨 Page distribution:`, {
      page1ItemCount: page1Items.length,
      page2ItemCount: page2Items.length,
      totalAccountedFor: page1Items.length + page2Items.length,
      expectedTotal: experienceItems.length
    });
    
    console.log(`🚨 ===== END CRITICAL DEBUG =====\n`);
  }

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