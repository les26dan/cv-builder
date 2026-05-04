/**
 * Minimal CV Template — Clean single-column, strong typography
 * Generous whitespace, colored accent line under name, refined section headers
 */
import React, { memo } from 'react'
import { detectLanguage } from '../../config/languageConfig'
import { injectThemeVars } from './colorThemes'
import { cvType, cvSpace, cvBullet, cvClass } from './designTokens'
import type { CVTemplateProps } from './templateRegistry'

export const MinimalTemplate = memo<CVTemplateProps>(({
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
    summary: 'Giới thiệu',
    experience: 'Kinh nghiệm làm việc',
    skills: 'Kỹ năng',
    education: 'Học vấn',
    projects: 'Dự án',
    volunteer: 'Hoạt động tình nguyện',
    certifications: 'Chứng chỉ',
    languages: 'Ngoại ngữ',
    hobbies: 'Sở thích',
  }

  const getSectionTitle = (sectionId: string) => {
    if (cvData.sectionTitles?.[sectionId]) return cvData.sectionTitles[sectionId]
    if (sectionId.startsWith('projects-')) return defaultSectionTitles.projects
    if (sectionId.startsWith('volunteer-')) return defaultSectionTitles.volunteer
    if (sectionId.startsWith('certifications-')) return defaultSectionTitles.certifications
    if (sectionId.startsWith('languages-')) return defaultSectionTitles.languages
    if (sectionId.startsWith('hobbies-')) return defaultSectionTitles.hobbies
    if (sectionId.startsWith('custom-')) return 'Khác'
    return defaultSectionTitles[sectionId] || 'Khác'
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
        case 'contact': heights[sectionId] = 90; break
        case 'summary':
          heights[sectionId] = cvData.summary?.content
            ? Math.max(70, Math.ceil(cvData.summary.content.length / 90) * 20 + 36)
            : 0
          break
        case 'experience':
          if (cvData.experience?.items?.length) {
            let h = 44
            cvData.experience.items.forEach((exp: any) => {
              h += 55
              exp.bullets?.forEach((b: string) => { if (b?.trim()) h += Math.ceil(b.length / 90) * 18 })
              h += 10
            })
            heights[sectionId] = Math.min(h, 500)
          } else heights[sectionId] = 0
          break
        case 'skills':
          if (cvData.skills?.items?.length) {
            const text = cvData.skills.items.map((s: any) => typeof s === 'string' ? s : s?.name || '').join(' · ')
            heights[sectionId] = 44 + Math.ceil(text.length / 90) * 18
          } else heights[sectionId] = 0
          break
        case 'education':
          if (cvData.education?.items?.length) {
            let h = 44
            cvData.education.items.forEach((edu: any) => { h += 40 + (edu.description ? Math.ceil(edu.description.length / 90) * 18 : 0) })
            heights[sectionId] = h
          } else heights[sectionId] = 0
          break
        default: heights[sectionId] = 50
      }
    })
    return heights
  }

  const getSectionsForPage = (page: number) => {
    const allSections = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education']
    const withContent = allSections.filter((id: string) => hasContent(id, cvData[id]))
    if (totalPages === 1) return withContent
    if (totalPages === 2) {
      if (page === 1) return ['contact', 'summary', 'experience'].filter((id: string) => withContent.includes(id))
      if (page === 2) return ['experience', 'skills', 'education'].filter((id: string) => withContent.includes(id))
    }
    const pageContentHeight = 900
    const heights = calculateSectionHeights(withContent)
    const pages: string[][] = []
    let cur: string[] = [], curH = 0
    for (const id of withContent) {
      const h = heights[id] || 0
      if (curH + h > pageContentHeight && cur.length > 0) { pages.push(cur); cur = [id]; curH = h }
      else { cur.push(id); curH += h }
    }
    if (cur.length) pages.push(cur)
    return pages[page - 1] || []
  }

  const themeVars = colorTheme ? injectThemeVars(colorTheme) : {}

  const primaryHex  = colorTheme?.primary ?? '#1e3a5f'
  const accentHex   = colorTheme?.accent  ?? '#e8eef7'
  const textHex     = colorTheme?.text    ?? '#1a202c'
  const mutedHex    = colorTheme?.muted   ?? '#718096'

  const contact = cvData.contact || {}
  const sectionsToShow = getSectionsForPage(currentPage)

  // Section header: left dot + title text + full-width thin rule (template identity)
  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: cvSpace.headerGap,
      marginTop: 2,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: primaryHex,
        flexShrink: 0,
      }} />
      <span style={{ ...cvType.sectionHeader, color: primaryHex, whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: accentHex }} />
    </div>
  )

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'contact': {
        if (!hasContent('contact', contact)) return null
        const contactLine = [contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean)
        return (
          <div key="contact" className={getSectionClass('contact')}
            style={{ marginBottom: cvSpace.sectionGap + 8, paddingBottom: 18, borderBottom: `2px solid ${primaryHex}` }}
            onClick={() => onSectionClick('contact')} data-section="contact">
            {contact.fullName && (
              <div style={{ ...cvType.name, fontSize: 28, fontWeight: 800, color: textHex, marginBottom: 6 }}>
                {contact.fullName}
              </div>
            )}
            {contactLine.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                ...cvType.contact,
                color: mutedHex,
              }}>
                {contactLine.map((info, i) => (
                  <span key={i}>
                    {i > 0 && <span style={{ margin: '0 8px', color: primaryHex, fontWeight: 700 }}>·</span>}
                    {info}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      }
      case 'summary': {
        if (!hasContent('summary', cvData.summary)) return null
        return (
          <div key="summary" className={`${getSectionClass('summary')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('summary')} data-section="summary">
            <SectionHeader title={getSectionTitle('summary')} />
            <p style={{ ...cvType.body, color: textHex, margin: 0, paddingLeft: 18 }}>
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
            {showHeader && <SectionHeader title={getSectionTitle('experience')} />}
            <div style={{ paddingLeft: 18 }}>
              {items.map((exp: any) => (
                <div key={exp.id} className={cvClass.experienceItem} style={{ marginBottom: cvSpace.itemGap }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: cvSpace.rowGap,
                    marginBottom: 2,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ ...cvType.itemTitle, color: textHex }}>{exp.title}</span>
                      {exp.company && (
                        <span style={{ ...cvType.itemSubtitle, color: primaryHex }}> · {exp.company}</span>
                      )}
                      {exp.location && (
                        <span style={{ ...cvType.contact, color: mutedHex }}> · {exp.location}</span>
                      )}
                    </div>
                    <span style={{ ...cvType.date, color: mutedHex, flexShrink: 0 }}>
                      {exp.startDate} – {exp.current ? (currentLanguage === 'vi' ? 'Hiện tại' : 'Current') : exp.endDate}
                    </span>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul style={{ ...cvBullet.ul, marginTop: 4 }}>
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
          </div>
        )
      }
      case 'skills': {
        const data = cvData.skills
        if (!hasContent('skills', data)) return null
        const skillLabel = (s: any) => (typeof s === 'object' && s.name) ? s.name : String(s)
        return (
          <div key="skills" className={`${getSectionClass('skills')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('skills')} data-section="skills">
            <SectionHeader title={getSectionTitle('skills')} />
            <div style={{ paddingLeft: 18, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data.items.map((skill: any, i: number) => (
                <span key={i} style={{
                  ...cvType.contact,
                  color: primaryHex,
                  backgroundColor: accentHex,
                  borderRadius: 4,
                  padding: '3px 10px',
                  fontWeight: 500,
                  border: `1px solid ${primaryHex}22`,
                }}>
                  {skillLabel(skill)}
                </span>
              ))}
            </div>
          </div>
        )
      }
      case 'education': {
        const data = cvData.education
        if (!hasContent('education', data)) return null
        return (
          <div key="education" className={`${getSectionClass('education')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('education')} data-section="education">
            <SectionHeader title={getSectionTitle('education')} />
            <div style={{ paddingLeft: 18 }}>
              {data.items.map((edu: any) => (
                <div key={edu.id} className={cvClass.educationItem} style={{ marginBottom: cvSpace.itemGap }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: cvSpace.rowGap }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ ...cvType.itemTitle, color: textHex }}>{edu.degree}</div>
                      {edu.institution && (
                        <div style={{ ...cvType.itemSubtitle, color: primaryHex, marginTop: 1 }}>
                          {edu.institution}{edu.location && <span style={{ color: mutedHex, fontWeight: 400 }}> · {edu.location}</span>}
                        </div>
                      )}
                    </div>
                    {edu.graduationDate && (
                      <span style={{ ...cvType.date, color: mutedHex, flexShrink: 0 }}>
                        {edu.graduationDate}
                      </span>
                    )}
                  </div>
                  {edu.description && <p style={{ ...cvType.body, color: mutedHex, margin: '4px 0 0' }}>{edu.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )
      }
      default: {
        const data = cvData[sectionId]
        if (!hasContent(sectionId, data)) return null
        return (
          <div key={sectionId} className={`${getSectionClass(sectionId)} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick(sectionId)} data-section={sectionId}>
            <SectionHeader title={getSectionTitle(sectionId)} />
            <div style={{ paddingLeft: 18 }}>
              {data.content && (
                <p style={{ ...cvType.body, color: textHex, margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>
                  {data.content}
                </p>
              )}
              {data.items?.length > 0 && data.items.map((item: any, idx: number) => (
                <div key={item.id || idx} style={{ ...cvType.body, color: textHex, marginBottom: 6 }}>
                  {item.title && <span style={{ fontWeight: 600 }}>{item.title}</span>}
                  {item.description && <span style={{ color: mutedHex }}> – {item.description}</span>}
                  {item.name && <span>{item.name}</span>}
                </div>
              ))}
            </div>
          </div>
        )
      }
    }
  }

  return (
    <div
      className="bg-white overflow-hidden w-full h-full cv-content"
      style={{
        padding: '52px 68px',
        fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        lineHeight: '1.5',
        color: textHex,
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        position: 'relative',
        ...themeVars,
      }}
    >
      {sectionsToShow.map((sectionId: string) => renderSection(sectionId))}

      {totalPages > 1 && (
        <div style={{ position: 'absolute', bottom: '16px', right: '28px', fontSize: '10px', color: mutedHex }}>
          {currentPage} / {totalPages}
        </div>
      )}
    </div>
  )
})

MinimalTemplate.displayName = 'MinimalTemplate'
