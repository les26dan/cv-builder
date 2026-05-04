/**
 * Timeline CV Template — Vertical timeline for experience
 * Center line with dot markers, clean two-tone layout
 */
import React, { memo } from 'react'
import { detectLanguage } from '../../config/languageConfig'
import { injectThemeVars } from './colorThemes'
import { cvType, cvSpace, cvBullet, cvClass } from './designTokens'
import type { CVTemplateProps } from './templateRegistry'

export const TimelineTemplate = memo<CVTemplateProps>(({
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
        case 'contact': heights[sectionId] = 110; break
        case 'summary':
          heights[sectionId] = cvData.summary?.content
            ? Math.max(70, Math.ceil(cvData.summary.content.length / 88) * 20 + 40)
            : 0
          break
        case 'experience':
          if (cvData.experience?.items?.length) {
            let h = 50
            cvData.experience.items.forEach((exp: any) => {
              h += 65
              exp.bullets?.forEach((b: string) => { if (b?.trim()) h += Math.ceil(b.length / 88) * 18 })
              h += 12
            })
            heights[sectionId] = Math.min(h, 500)
          } else heights[sectionId] = 0
          break
        case 'skills':
          heights[sectionId] = cvData.skills?.items?.length
            ? 50 + Math.ceil(cvData.skills.items.length / 4) * 30
            : 0
          break
        case 'education':
          if (cvData.education?.items?.length) {
            let h = 50
            cvData.education.items.forEach((edu: any) => { h += 55 + (edu.description ? Math.ceil(edu.description.length / 88) * 18 : 0) })
            heights[sectionId] = h
          } else heights[sectionId] = 0
          break
        default: heights[sectionId] = 55
      }
    })
    return heights
  }

  const getSectionsForPage = (page: number) => {
    const all = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education']
    const withContent = all.filter((id: string) => hasContent(id, cvData[id]))
    if (totalPages === 1) return withContent
    if (totalPages === 2) {
      if (page === 1) return ['contact', 'summary', 'experience'].filter((id: string) => withContent.includes(id))
      if (page === 2) return ['experience', 'skills', 'education'].filter((id: string) => withContent.includes(id))
    }
    const maxH = 850
    const heights = calculateSectionHeights(withContent)
    const pages: string[][] = []
    let cur: string[] = [], curH = 0
    for (const id of withContent) {
      const sh = heights[id] || 0
      if (curH + sh > maxH && cur.length > 0) { pages.push(cur); cur = [id]; curH = sh }
      else { cur.push(id); curH += sh }
    }
    if (cur.length) pages.push(cur)
    return pages[page - 1] || []
  }

  const themeVars = colorTheme ? injectThemeVars(colorTheme) : {}
  const primaryHex = colorTheme?.primary ?? '#1e3a8a'
  const accentHex  = colorTheme?.accent  ?? '#dbeafe'
  const textHex    = colorTheme?.text    ?? '#1e293b'
  const mutedHex   = colorTheme?.muted   ?? '#64748b'

  const contact = cvData.contact || {}
  const sectionsToShow = getSectionsForPage(currentPage)
  const skillLabel = (s: any) => (typeof s === 'object' && s.name) ? s.name : String(s)

  // ── Section header: colored pill badge left-aligned ────────────────────────
  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{
      ...cvType.sectionHeader,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: primaryHex,
      color: '#fff',
      padding: '5px 14px',
      borderRadius: '20px',
      marginBottom: cvSpace.headerGap,
    }}>{title}</div>
  )

  // ── Timeline item wrapper ──────────────────────────────────────────────────
  const TimelineItem = ({ children, isLast }: { children: React.ReactNode; isLast: boolean }) => (
    <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
      {/* Left: dot + line */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '28px',
        flexShrink: 0,
        paddingTop: '3px',
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: primaryHex,
          border: `2px solid ${accentHex}`,
          flexShrink: 0,
          zIndex: 1,
        }} />
        {!isLast && (
          <div style={{
            width: '2px',
            flex: 1,
            backgroundColor: accentHex,
            marginTop: '3px',
            minHeight: '20px',
          }} />
        )}
      </div>
      {/* Right: content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '16px' }}>
        {children}
      </div>
    </div>
  )

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'contact': {
        if (!hasContent('contact', contact)) return null
        const infoLine = [contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean)
        return (
          <div key="contact" className={`${getSectionClass('contact')} ${cvClass.section}`}
            style={{
              marginBottom: cvSpace.sectionGap,
              padding: '22px 28px',
              backgroundColor: primaryHex,
              borderRadius: '8px',
            }}
            onClick={() => onSectionClick('contact')} data-section="contact">
            {contact.fullName && (
              <div style={{
                ...cvType.name,
                fontSize: 24,
                color: '#fff',
                marginBottom: 8,
              }}>
                {contact.fullName}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0' }}>
              {infoLine.map((info, i) => (
                <span key={i} style={{ ...cvType.contact, color: 'rgba(255,255,255,0.85)' }}>
                  {i > 0 && <span style={{ margin: '0 10px', opacity: 0.5 }}>·</span>}
                  {info}
                </span>
              ))}
            </div>
          </div>
        )
      }

      case 'summary': {
        if (!hasContent('summary', cvData.summary)) return null
        return (
          <div key="summary" className={`${getSectionClass('summary')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('summary')} data-section="summary">
            <SectionHeader title={getSectionTitle('summary')} />
            <p style={{
              ...cvType.body,
              color: textHex,
              margin: 0,
              padding: '10px 14px',
              backgroundColor: accentHex,
              borderRadius: '6px',
              borderLeft: `3px solid ${primaryHex}`,
            }}>
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
            <div>
              {items.map((exp: any, idx: number) => (
                <TimelineItem key={exp.id} isLast={idx === items.length - 1}>
                  <div className={cvClass.experienceItem}>
                    <div style={{ ...cvType.date, color: primaryHex, fontWeight: 600, marginBottom: 3 }}>
                      {exp.startDate} – {exp.current ? (currentLanguage === 'vi' ? 'Hiện tại' : 'Current') : exp.endDate}
                    </div>
                    <div style={{ ...cvType.itemTitle, color: textHex }}>
                      {exp.title}
                    </div>
                    {exp.company && (
                      <div style={{ ...cvType.itemSubtitle, color: primaryHex, marginTop: 1 }}>
                        {exp.company}{exp.location && <span style={{ color: mutedHex, fontWeight: 400 }}> · {exp.location}</span>}
                      </div>
                    )}
                    {exp.bullets?.length > 0 && (
                      <ul style={{ ...cvBullet.ul, marginTop: 6 }}>
                        {exp.bullets.map((b: string, i: number) => b?.trim() ? (
                          <li key={i} style={{ ...cvBullet.li, color: textHex }}>
                            <span style={{ ...cvBullet.marker, color: primaryHex }}>{cvBullet.defaultGlyph}</span>
                            {b}
                          </li>
                        ) : null)}
                      </ul>
                    )}
                  </div>
                </TimelineItem>
              ))}
            </div>
          </div>
        )
      }

      case 'skills': {
        const data = cvData.skills
        if (!hasContent('skills', data)) return null
        return (
          <div key="skills" className={`${getSectionClass('skills')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('skills')} data-section="skills">
            <SectionHeader title={getSectionTitle('skills')} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {data.items.map((skill: any, i: number) => (
                <span key={i} style={{
                  ...cvType.contact,
                  color: primaryHex,
                  backgroundColor: accentHex,
                  border: `1px solid ${primaryHex}30`,
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontWeight: 500,
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
            <div>
              {data.items.map((edu: any, idx: number) => (
                <TimelineItem key={edu.id} isLast={idx === data.items.length - 1}>
                  <div className={cvClass.educationItem}>
                    {edu.graduationDate && (
                      <div style={{ ...cvType.date, color: primaryHex, fontWeight: 600, marginBottom: 3 }}>
                        {edu.graduationDate}
                      </div>
                    )}
                    <div style={{ ...cvType.itemTitle, color: textHex }}>{edu.degree}</div>
                    {edu.institution && (
                      <div style={{ ...cvType.itemSubtitle, color: primaryHex, marginTop: 1 }}>
                        {edu.institution}{edu.location && <span style={{ color: mutedHex, fontWeight: 400 }}> · {edu.location}</span>}
                      </div>
                    )}
                    {edu.description && (
                      <p style={{ ...cvType.body, color: mutedHex, margin: '4px 0 0' }}>{edu.description}</p>
                    )}
                  </div>
                </TimelineItem>
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
            {data.content && (
              <p style={{ ...cvType.body, color: textHex, margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>
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
        padding: '40px 52px',
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

TimelineTemplate.displayName = 'TimelineTemplate'
