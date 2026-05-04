/**
 * Sidebar CV Template — Professional two-column
 * Colored left sidebar (contact + skills) + clean white right column
 */
import React, { memo } from 'react'
import { detectLanguage } from '../../config/languageConfig'
import { injectThemeVars } from './colorThemes'
import { cvType, cvSpace, cvBullet, cvClass } from './designTokens'
import type { CVTemplateProps } from './templateRegistry'

export const SidebarTemplate = memo<CVTemplateProps>(({
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
    detectLanguage().language

  const getSectionClass = (section: string) =>
    `cv-section${activeSection === section ? ' active-section' : ''}`

  const defaultSectionTitles: Record<string, string> = {
    summary: 'GIỚI THIỆU',
    experience: 'KINH NGHIỆM LÀM VIỆC',
    skills: 'KỸ NĂNG',
    education: 'HỌC VẤN',
    projects: 'DỰ ÁN',
    volunteer: 'HOẠT ĐỘNG TÌNH NGUYỆN',
    certifications: 'CHỨNG CHỈ',
    languages: 'NGOẠI NGỮ',
    hobbies: 'SỞ THÍCH',
  }

  const getSectionTitle = (sectionId: string) => {
    if (cvData.sectionTitles?.[sectionId]) return cvData.sectionTitles[sectionId].toUpperCase()
    if (sectionId.startsWith('projects-')) return defaultSectionTitles.projects
    if (sectionId.startsWith('volunteer-')) return defaultSectionTitles.volunteer
    if (sectionId.startsWith('certifications-')) return defaultSectionTitles.certifications
    if (sectionId.startsWith('languages-')) return defaultSectionTitles.languages
    if (sectionId.startsWith('hobbies-')) return defaultSectionTitles.hobbies
    if (sectionId.startsWith('custom-')) return 'PHẦN TÙY CHỈNH'
    return defaultSectionTitles[sectionId] || 'PHẦN KHÁC'
  }

  const hasContent = (sectionId: string, data: any): boolean => {
    if (!data) return false
    switch (sectionId) {
      case 'contact': return !!(data.fullName || data.email || data.phone || data.location)
      case 'summary': return !!(data.content && typeof data.content === 'string' && data.content.trim())
      case 'experience': return !!(data.items?.length > 0 && data.items.some((i: any) => i.title || i.company))
      case 'skills': return !!(data.items?.length > 0)
      case 'education': return !!(data.items?.length > 0 && data.items.some((i: any) => i.degree || i.institution))
      default:
        if (data.items) return data.items.length > 0
        if (data.content) return !!data.content.trim()
        return false
    }
  }

  const getExperienceItemsForPage = (items: any[], targetPage: number) => {
    if (!items?.length) return []
    if (totalPages === 1) return items
    if (targetPage === 1) return items.slice(0, 3)
    if (targetPage === 2) return items.slice(3)
    return []
  }

  const calculateSectionHeights = (sections: string[]) => {
    const heights: Record<string, number> = {}
    sections.forEach(sectionId => {
      switch (sectionId) {
        case 'summary':
          heights[sectionId] = cvData.summary?.content
            ? Math.max(80, Math.ceil(cvData.summary.content.length / 80) * 20 + 40)
            : 0
          break
        case 'experience':
          if (cvData.experience?.items?.length) {
            let h = 50
            cvData.experience.items.forEach((exp: any) => {
              h += 60
              exp.bullets?.forEach((b: string) => { if (b?.trim()) h += Math.ceil(b.length / 85) * 18 })
              h += 12
            })
            heights[sectionId] = Math.min(h, 500)
          } else heights[sectionId] = 0
          break
        case 'education':
          if (cvData.education?.items?.length) {
            let h = 50
            cvData.education.items.forEach((edu: any) => { h += 45 + (edu.description ? Math.ceil(edu.description.length / 85) * 18 : 0) })
            heights[sectionId] = h
          } else heights[sectionId] = 0
          break
        default:
          heights[sectionId] = 50
      }
    })
    return heights
  }

  const getSectionsForPage = (page: number) => {
    const allSections = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education']
    const withContent = allSections.filter((id: string) => hasContent(id, cvData[id]))
    const mainSections = withContent.filter((id: string) => id !== 'contact' && id !== 'skills')
    if (totalPages === 1) return mainSections
    if (totalPages === 2) {
      if (page === 1) return ['summary', 'experience'].filter((id: string) => mainSections.includes(id))
      if (page === 2) return ['experience', 'education'].filter((id: string) => mainSections.includes(id))
    }
    const pageContentHeight = 900
    const heights = calculateSectionHeights(mainSections)
    const pages: string[][] = []
    let cur: string[] = [], curH = 0
    for (const id of mainSections) {
      const h = heights[id] || 0
      if (curH + h > pageContentHeight && cur.length > 0) { pages.push(cur); cur = [id]; curH = h }
      else { cur.push(id); curH += h }
    }
    if (cur.length) pages.push(cur)
    return pages[page - 1] || []
  }

  const themeVars = colorTheme ? injectThemeVars(colorTheme) : {}

  // Use resolved theme values for sidebar (needs actual hex, not CSS vars)
  const primaryHex  = colorTheme?.primary ?? '#1e3a5f'
  const accentHex   = colorTheme?.accent  ?? '#e8eef7'
  const textHex     = colorTheme?.text    ?? '#1e293b'
  const mutedHex    = colorTheme?.muted   ?? '#64748b'

  // CSS vars for right column
  const primary   = `var(--cv-primary, ${primaryHex})`
  const textColor = `var(--cv-text, ${textHex})`
  const muted     = `var(--cv-muted, ${mutedHex})`

  const mainSections = getSectionsForPage(currentPage)
  const contact = cvData.contact || {}
  const skills = cvData.skills?.items || []

  const skillLabel = (skill: any) => (typeof skill === 'object' && skill.name) ? skill.name : String(skill)

  // Sidebar header (on dark): tokens + dark-mode overrides
  const SidebarSectionHeader = ({ title }: { title: string }) => (
    <div style={{
      ...cvType.sectionHeader,
      color: 'rgba(255,255,255,0.65)',
      marginBottom: cvSpace.headerGap,
      marginTop: 4,
      paddingBottom: 6,
      borderBottom: '1px solid rgba(255,255,255,0.18)',
    }}>{title}</div>
  )

  // Main column header (on light): token text + accent rule (template identity)
  const MainSectionHeader = ({ title }: { title: string }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: cvSpace.headerGap,
      marginTop: 2,
    }}>
      <span style={{ ...cvType.sectionHeader, color: primaryHex, whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1.5, backgroundColor: accentHex }} />
    </div>
  )

  const renderMainSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary': {
        if (!hasContent('summary', cvData.summary)) return null
        return (
          <div key="summary" className={`${getSectionClass('summary')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('summary')} data-section="summary">
            <MainSectionHeader title={getSectionTitle('summary')} />
            <p style={{ ...cvType.body, color: textColor, margin: 0 }}>
              {cvData.summary.content}
            </p>
          </div>
        )
      }
      case 'experience': {
        const data = cvData.experience
        if (!hasContent('experience', data)) return null
        const items = getExperienceItemsForPage(data.items, currentPage)
        const showHeader = currentPage === 1 || totalPages === 1
        return (
          <div key="experience" className={`${getSectionClass('experience')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('experience')} data-section="experience">
            {showHeader && <MainSectionHeader title={getSectionTitle('experience')} />}
            {items.map((exp: any) => (
              <div key={exp.id} className={cvClass.experienceItem} style={{ marginBottom: cvSpace.itemGap, paddingBottom: 12, borderBottom: `1px solid ${accentHex}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: cvSpace.rowGap, marginBottom: 3 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ ...cvType.itemTitle, color: textHex }}>
                      {exp.title}
                    </div>
                    {exp.company && (
                      <div style={{ ...cvType.itemSubtitle, color: primaryHex, marginTop: 1 }}>
                        {exp.company}{exp.location && <span style={{ color: mutedHex, fontWeight: 400 }}> · {exp.location}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{
                    ...cvType.date,
                    color: primaryHex,
                    backgroundColor: accentHex,
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontWeight: 500,
                    flexShrink: 0,
                  }}>
                    {exp.startDate} – {exp.current ? (currentLanguage === 'vi' ? 'Hiện tại' : 'Current') : exp.endDate}
                  </div>
                </div>
                {exp.bullets?.length > 0 && (
                  <ul style={{ ...cvBullet.ul, marginTop: 5 }}>
                    {exp.bullets.map((b: string, i: number) => b?.trim() ? (
                      <li key={i} style={{ ...cvBullet.li, color: textHex }}>
                        <span style={{ ...cvBullet.marker, color: primaryHex }}>{cvBullet.defaultGlyph}</span>
                        {b}
                      </li>
                    ) : null)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )
      }
      case 'education': {
        const data = cvData.education
        if (!hasContent('education', data)) return null
        return (
          <div key="education" className={`${getSectionClass('education')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('education')} data-section="education">
            <MainSectionHeader title={getSectionTitle('education')} />
            {data.items.map((edu: any) => (
              <div key={edu.id} className={cvClass.educationItem} style={{ marginBottom: cvSpace.itemGap, paddingBottom: 8, borderBottom: `1px solid ${accentHex}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: cvSpace.rowGap }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ ...cvType.itemTitle, color: textHex }}>{edu.degree}</div>
                    {edu.institution && (
                      <div style={{ ...cvType.itemSubtitle, color: primaryHex, marginTop: 1 }}>
                        {edu.institution}{edu.location && <span style={{ color: mutedHex, fontWeight: 400 }}> · {edu.location}</span>}
                      </div>
                    )}
                  </div>
                  {edu.graduationDate && (
                    <div style={{
                      ...cvType.date,
                      color: primaryHex,
                      backgroundColor: accentHex,
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontWeight: 500,
                      flexShrink: 0,
                    }}>
                      {edu.graduationDate}
                    </div>
                  )}
                </div>
                {edu.description && <p style={{ ...cvType.body, color: mutedHex, margin: '5px 0 0' }}>{edu.description}</p>}
              </div>
            ))}
          </div>
        )
      }
      default: {
        const data = cvData[sectionId]
        if (!hasContent(sectionId, data)) return null
        return (
          <div key={sectionId} className={`${getSectionClass(sectionId)} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
            <MainSectionHeader title={getSectionTitle(sectionId)} />
            {data.content && (
              <p style={{ ...cvType.body, color: textColor, margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>
                {data.content}
              </p>
            )}
            {data.items?.length > 0 && data.items.map((item: any, idx: number) => (
              <div key={item.id || idx} style={{ ...cvType.body, color: textHex, marginBottom: 6 }}>
                {item.title && <span style={{ fontWeight: 600 }}>{item.title}</span>}
                {item.description && <span style={{ color: mutedHex }}> — {item.description}</span>}
                {item.name && <span>{item.name}</span>}
              </div>
            ))}
          </div>
        )
      }
    }
  }

  return (
    <div
      className="bg-white overflow-hidden w-full h-full cv-content"
      style={{
        display: 'flex',
        flexDirection: 'row',
        fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        lineHeight: '1.5',
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        ...themeVars,
      }}
    >
      {/* Left sidebar — 30% — solid primary color */}
      <div
        style={{
          width: '30%',
          backgroundColor: primaryHex,
          padding: '44px 22px 40px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
        className={getSectionClass('contact')}
        onClick={() => onSectionClick('contact')}
        data-section="contact"
      >
        {/* Avatar placeholder circle */}
        {contact.fullName && (
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '3px solid rgba(255,255,255,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            flexShrink: 0,
          }}>
            {contact.fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
        )}

        {/* Name */}
        {contact.fullName && (
          <div style={{ ...cvType.name, fontSize: 18, color: '#fff', marginBottom: 18 }}>
            {contact.fullName}
          </div>
        )}

        {/* Contact details */}
        <div style={{ marginBottom: 22 }}>
          <SidebarSectionHeader title="LIÊN HỆ" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contact.email && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 1, flexShrink: 0 }}>✉</span>
                <span style={{ ...cvType.contact, color: 'rgba(255,255,255,0.88)', wordBreak: 'break-all' }}>{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, flexShrink: 0 }}>✆</span>
                <span style={{ ...cvType.contact, color: 'rgba(255,255,255,0.88)' }}>{contact.phone}</span>
              </div>
            )}
            {contact.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, flexShrink: 0 }}>⌖</span>
                <span style={{ ...cvType.contact, color: 'rgba(255,255,255,0.88)' }}>{contact.location}</span>
              </div>
            )}
            {contact.linkedin && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 1, flexShrink: 0 }}>in</span>
                <span style={{ ...cvType.contact, color: 'rgba(255,255,255,0.88)', wordBreak: 'break-all' }}>{contact.linkedin}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div
            className={getSectionClass('skills')}
            onClick={(e) => { e.stopPropagation(); onSectionClick('skills') }}
            data-section="skills"
          >
            <SidebarSectionHeader title={getSectionTitle('skills')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {skills.map((skill: any, i: number) => (
                <div
                  key={i}
                  style={{
                    ...cvType.contact,
                    color: 'rgba(255,255,255,0.92)',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 3,
                    padding: '4px 9px',
                  }}
                >
                  {skillLabel(skill)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right main column — 70% */}
      <div style={{ flex: 1, padding: '44px 36px 40px', overflow: 'hidden', position: 'relative' }}>
        {mainSections.map((sectionId: string) => renderMainSection(sectionId))}

        {totalPages > 1 && (
          <div style={{ position: 'absolute', bottom: '16px', right: '20px', fontSize: '10px', color: muted }}>
            {currentPage} / {totalPages}
          </div>
        )}
      </div>
    </div>
  )
})

SidebarTemplate.displayName = 'SidebarTemplate'
