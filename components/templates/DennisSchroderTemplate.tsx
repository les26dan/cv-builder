/**
 * Classic CV Template — Professional single-column
 * Clean, ATS-friendly, strong typography hierarchy
 */
import React, { memo } from 'react';
import { detectLanguage } from '../../config/languageConfig';
import type { CVTemplateProps } from './templateRegistry';
import { injectThemeVars } from './colorThemes';
import { cvType, cvSpace, cvBullet, cvClass } from './designTokens';

interface DennisSchroderTemplateProps extends CVTemplateProps {}

export const DennisSchroderTemplate = memo<DennisSchroderTemplateProps>(({
  cvData,
  activeSection,
  onSectionClick,
  currentPage = 1,
  totalPages = 1,
  isPreview = false,
  language,
  colorTheme,
}) => {
  const currentLanguage = language ||
    (typeof window !== 'undefined' ? localStorage.getItem('okbuddy_language') : null) ||
    detectLanguage().language;

  const primary   = colorTheme?.primary ?? '#1a56db';
  const accent    = colorTheme?.accent  ?? '#e8f0fe';
  const textColor = colorTheme?.text    ?? '#1e293b';
  const muted     = colorTheme?.muted   ?? '#64748b';

  const themeVars = colorTheme ? injectThemeVars(colorTheme) : {};

  const getSectionClass = (section: string) =>
    `cv-section${activeSection === section ? ' bg-blue-50 rounded-sm' : ''}`;

  const defaultSectionTitles: Record<string, string> = {
    summary:        'MỤC TIÊU NGHỀ NGHIỆP',
    experience:     'KINH NGHIỆM LÀM VIỆC',
    skills:         'KỸ NĂNG',
    education:      'HỌC VẤN',
    projects:       'DỰ ÁN',
    volunteer:      'HOẠT ĐỘNG TÌNH NGUYỆN',
    certifications: 'CHỨNG CHỈ',
    languages:      'NGÔN NGỮ',
    hobbies:        'SỞ THÍCH',
  };

  const getSectionTitle = (sectionId: string) => {
    if (cvData.sectionTitles?.[sectionId]) return cvData.sectionTitles[sectionId].toUpperCase();
    if (sectionId.startsWith('projects-'))       return defaultSectionTitles.projects;
    if (sectionId.startsWith('volunteer-'))      return defaultSectionTitles.volunteer;
    if (sectionId.startsWith('certifications-')) return defaultSectionTitles.certifications;
    if (sectionId.startsWith('languages-'))      return defaultSectionTitles.languages;
    if (sectionId.startsWith('hobbies-'))        return defaultSectionTitles.hobbies;
    if (sectionId.startsWith('custom-'))         return 'PHẦN TÙY CHỈNH';
    return defaultSectionTitles[sectionId] || 'PHẦN KHÁC';
  };

  const hasContent = (sectionId: string, data: any): boolean => {
    if (!data) return false;
    switch (sectionId) {
      case 'contact':    return !!(data.fullName || data.email || data.phone || data.location);
      case 'summary':    return !!(data.content?.trim());
      case 'experience': return !!(data.items?.length && data.items.some((i: any) => i.title || i.company));
      case 'skills':     return !!(data.items?.length);
      case 'education':  return !!(data.items?.length && data.items.some((i: any) => i.degree || i.institution));
      default:
        if (data.items) return data.items.length > 0;
        if (data.content) return !!data.content.trim();
        return false;
    }
  };

  const skillName = (s: any) => typeof s === 'object' && s.name ? s.name : String(s);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const getExperienceItemsForPage = (items: any[], targetPage: number) => {
    if (!items?.length) return [];
    if (totalPages === 1) return items;
    if (targetPage === 1) return items.slice(0, 3);
    if (targetPage === 2) return items.slice(3);
    return [];
  };

  const calculateSectionHeights = (sections: string[]) => {
    const h: Record<string, number> = {};
    sections.forEach(id => {
      switch (id) {
        case 'contact':  h[id] = 110; break;
        case 'summary':  h[id] = cvData.summary?.content ? Math.max(70, Math.ceil(cvData.summary.content.length / 85) * 20 + 40) : 0; break;
        case 'experience':
          if (cvData.experience?.items?.length) {
            let v = 50;
            cvData.experience.items.forEach((exp: any) => {
              v += 65;
              exp.bullets?.forEach((b: string) => { if (b?.trim()) v += Math.ceil(b.length / 88) * 18; });
              v += 12;
            });
            h[id] = Math.min(v, 500);
          } else h[id] = 0;
          break;
        case 'skills':
          if (cvData.skills?.items?.length) {
            h[id] = 50 + Math.ceil(cvData.skills.items.length / 3) * 28;
          } else h[id] = 0;
          break;
        case 'education':
          if (cvData.education?.items?.length) {
            let v = 50;
            cvData.education.items.forEach((edu: any) => { v += 50 + (edu.description ? Math.ceil(edu.description.length / 85) * 18 : 0); });
            h[id] = v;
          } else h[id] = 0;
          break;
        default: h[id] = 55;
      }
    });
    return h;
  };

  const getSectionsForPage = (page: number) => {
    const all = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'];
    const withContent = all.filter((id: string) => hasContent(id, cvData[id]));
    if (totalPages === 1) return withContent;
    if (totalPages === 2) {
      if (page === 1) return ['contact', 'summary', 'experience'].filter((id: string) => withContent.includes(id));
      if (page === 2) return ['experience', 'skills', 'education'].filter((id: string) => withContent.includes(id));
    }
    const maxH = 850;
    const heights = calculateSectionHeights(withContent);
    const pages: string[][] = [];
    let cur: string[] = [], curH = 0;
    for (const id of withContent) {
      const sh = heights[id] || 0;
      if (curH + sh > maxH && cur.length > 0) { pages.push(cur); cur = [id]; curH = sh; }
      else { cur.push(id); curH += sh; }
    }
    if (cur.length) pages.push(cur);
    return pages[page - 1] || [];
  };

  // ── Section renderers ────────────────────────────────────────────────────────

  // Section header: left colored bar + uppercase bold text (template identity)
  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: cvSpace.headerGap,
      marginTop: 4,
    }}>
      <div style={{ width: 4, height: 16, backgroundColor: primary, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ ...cvType.sectionHeader, color: primary }}>{title}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: accent }} />
    </div>
  );

  const contact = cvData.contact || {};

  const renderContact = () => {
    if (!hasContent('contact', contact)) return null;
    const infoLine = [contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean);
    return (
      <div
        className={getSectionClass('contact')}
        onClick={() => onSectionClick('contact')}
        data-section="contact"
        style={{
          backgroundColor: primary,
          margin: '-57px -76px 0 -76px',
          padding: '28px 76px 22px',
          marginBottom: cvSpace.sectionGap + 6,
          textAlign: 'center',
        }}
      >
        <div style={{ ...cvType.name, fontSize: 24, color: '#fff', marginBottom: 6 }}>
          {contact.fullName}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 16px' }}>
          {infoLine.map((info, i) => (
            <span key={i} style={{ ...cvType.contact, color: 'rgba(255,255,255,0.88)' }}>
              {i > 0 && <span style={{ marginRight: 16, opacity: 0.4 }}>|</span>}{info}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (!hasContent('summary', cvData.summary)) return null;
    return (
      <div className={`${getSectionClass('summary')} ${cvClass.section}`} onClick={() => onSectionClick('summary')} data-section="summary" style={{ marginBottom: cvSpace.sectionGap }}>
        <SectionHeader title={getSectionTitle('summary')} />
        <p style={{ ...cvType.body, color: textColor, margin: 0 }}>
          {cvData.summary.content}
        </p>
      </div>
    );
  };

  const renderExperience = (sectionId: string) => {
    const data = cvData[sectionId] || cvData.experience;
    if (!hasContent(sectionId, data)) return null;
    const items = getExperienceItemsForPage(data.items, currentPage);
    const showHeader = sectionId !== 'experience' || currentPage === 1 || totalPages === 1;
    return (
      <div className={`${getSectionClass(sectionId)} ${cvClass.section}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId} style={{ marginBottom: cvSpace.sectionGap }}>
        {showHeader && <SectionHeader title={getSectionTitle(sectionId)} />}
        {items.map((exp: any) => (
          <div key={exp.id} className={cvClass.experienceItem} style={{ marginBottom: cvSpace.itemGap, paddingLeft: 12, borderLeft: `2px solid ${accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: cvSpace.rowGap, marginBottom: 2 }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ ...cvType.itemTitle, color: textColor }}>{exp.title}</span>
                {exp.company && <span style={{ ...cvType.itemSubtitle, color: primary }}> · {exp.company}</span>}
              </div>
              <span style={{ ...cvType.date, color: muted, flexShrink: 0, backgroundColor: accent, padding: '1px 8px', borderRadius: 10 }}>
                {exp.startDate} – {exp.current ? (currentLanguage === 'vi' ? 'Hiện tại' : 'Current') : exp.endDate}
              </span>
            </div>
            {exp.location && <div style={{ ...cvType.contact, color: muted, marginBottom: 4 }}>{exp.location}</div>}
            {exp.bullets?.length > 0 && (
              <ul style={{ ...cvBullet.ul, marginTop: 5 }}>
                {exp.bullets.map((b: string, i: number) => b?.trim() ? (
                  <li key={i} style={{ ...cvBullet.li, color: textColor }}>
                    <span style={{ ...cvBullet.marker, color: primary }}>{cvBullet.defaultGlyph}</span>
                    {b}
                  </li>
                ) : null)}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSkills = (sectionId: string) => {
    const data = cvData[sectionId] || cvData.skills;
    if (!hasContent(sectionId, data)) return null;
    return (
      <div className={`${getSectionClass(sectionId)} ${cvClass.section}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId} style={{ marginBottom: cvSpace.sectionGap }}>
        <SectionHeader title={getSectionTitle(sectionId)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.items.map((skill: any, i: number) => (
            <span key={i} style={{
              ...cvType.contact,
              color: primary,
              backgroundColor: accent,
              border: `1px solid ${primary}22`,
              borderRadius: 4,
              padding: '3px 10px',
              fontWeight: 500,
            }}>
              {skillName(skill)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderEducation = (sectionId: string) => {
    const data = cvData[sectionId] || cvData.education;
    if (!hasContent(sectionId, data)) return null;
    return (
      <div className={`${getSectionClass(sectionId)} ${cvClass.section}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId} style={{ marginBottom: cvSpace.sectionGap }}>
        <SectionHeader title={getSectionTitle(sectionId)} />
        {data.items.map((edu: any) => (
          <div key={edu.id} className={cvClass.educationItem} style={{ marginBottom: cvSpace.itemGap, paddingLeft: 12, borderLeft: `2px solid ${accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: cvSpace.rowGap }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ ...cvType.itemTitle, color: textColor }}>{edu.degree}</div>
                {edu.institution && <div style={{ ...cvType.itemSubtitle, color: primary }}>{edu.institution}{edu.location && ` – ${edu.location}`}</div>}
              </div>
              {edu.graduationDate && (
                <span style={{ ...cvType.date, color: muted, flexShrink: 0, backgroundColor: accent, padding: '1px 8px', borderRadius: 10 }}>
                  {edu.graduationDate}
                </span>
              )}
            </div>
            {edu.description && <p style={{ ...cvType.body, color: muted, margin: '4px 0 0' }}>{edu.description}</p>}
          </div>
        ))}
      </div>
    );
  };

  const renderCustomSection = (sectionId: string) => {
    const data = cvData[sectionId];
    if (!hasContent(sectionId, data)) return null;
    return (
      <div className={`${getSectionClass(sectionId)} ${cvClass.section}`} onClick={() => onSectionClick(sectionId)} data-section={sectionId} style={{ marginBottom: cvSpace.sectionGap }}>
        <SectionHeader title={getSectionTitle(sectionId)} />
        {data.content && <p style={{ ...cvType.body, color: textColor, whiteSpace: 'pre-wrap', margin: 0 }}>{data.content}</p>}
        {data.items?.length > 0 && data.items.map((item: any, i: number) => (
          <div key={item.id || i} style={{ ...cvType.body, color: textColor, marginBottom: 6 }}>
            {item.title && <span style={{ fontWeight: 600 }}>{item.title}</span>}
            {item.description && <span style={{ color: muted }}> — {item.description}</span>}
            {item.name && <span>{item.name}</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'contact':    return renderContact();
      case 'summary':    return renderSummary();
      case 'experience': return renderExperience(sectionId);
      case 'skills':     return renderSkills(sectionId);
      case 'education':  return renderEducation(sectionId);
      default:
        if (sectionId.includes('experience') || sectionId.startsWith('projects-') || sectionId.startsWith('volunteer-')) return renderExperience(sectionId);
        if (sectionId.includes('skills') || sectionId.startsWith('certifications-') || sectionId.startsWith('languages-')) return renderSkills(sectionId);
        return renderCustomSection(sectionId);
    }
  };

  const sectionsToShow = getSectionsForPage(currentPage);

  return (
    <div
      className="bg-white overflow-hidden w-full h-full cv-content"
      style={{
        padding: '57px 76px',
        fontSize: '12px',
        lineHeight: '1.5',
        fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
        color: textColor,
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        ...themeVars,
      }}
    >
      {sectionsToShow.map((id: string) => (
        <div key={id}>{renderSection(id)}</div>
      ))}
      {totalPages > 1 && (
        <div style={{ position: 'absolute', bottom: '18px', right: '76px', fontSize: '10px', color: muted }}>
          {currentPage} / {totalPages}
        </div>
      )}
    </div>
  );
});

DennisSchroderTemplate.displayName = 'DennisSchroderTemplate';
