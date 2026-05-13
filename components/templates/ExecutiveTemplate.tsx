/**
 * Executive CV Template — Bold header, senior/manager style
 * Large name + job title, two-column body (skills sidebar + main content)
 */
import React, { memo } from 'react'
import { detectLanguage } from '../../config/languageConfig'
import { injectThemeVars } from './colorThemes'
import { cvType, cvSpace, cvBullet, cvClass } from './designTokens'
import type { CVTemplateProps } from './templateRegistry'
import { MarkdownNotes } from '../common/MarkdownNotes'

export const ExecutiveTemplate = memo<CVTemplateProps>(({
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
    summary: 'TÓM TẮT',
    experience: 'KINH NGHIỆM',
    skills: 'KỸ NĂNG',
    education: 'HỌC VẤN',
    projects: 'DỰ ÁN',
    volunteer: 'TÌNH NGUYỆN',
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
    if (sectionId.startsWith('custom-')) return 'PHẦN KHÁC'
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
            ? Math.max(70, Math.ceil(cvData.summary.content.length / 80) * 20 + 40)
            : 0
          break
        case 'experience':
          if (cvData.experience?.items?.length) {
            let h = 50
            cvData.experience.items.forEach((exp: any) => {
              h += 65
              exp.bullets?.forEach((b: string) => { if (b?.trim()) h += Math.ceil(b.length / 85) * 18 })
              h += 12
            })
            heights[sectionId] = Math.min(h, 500)
          } else heights[sectionId] = 0
          break
        case 'education':
          if (cvData.education?.items?.length) {
            let h = 50
            cvData.education.items.forEach((edu: any) => { h += 50 + (edu.description ? Math.ceil(edu.description.length / 85) * 18 : 0) })
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
    // Executive: contact is the full-width header. skills go in right sidebar.
    const mainSections = withContent.filter((id: string) => id !== 'contact' && id !== 'skills')
    if (totalPages === 1) return mainSections
    if (totalPages === 2) {
      if (page === 1) return ['summary', 'experience'].filter((id: string) => mainSections.includes(id))
      if (page === 2) return ['experience', 'education'].filter((id: string) => mainSections.includes(id))
    }
    const maxH = 720
    const heights = calculateSectionHeights(mainSections)
    const pages: string[][] = []
    let cur: string[] = [], curH = 0
    for (const id of mainSections) {
      const sh = heights[id] || 0
      if (curH + sh > maxH && cur.length > 0) { pages.push(cur); cur = [id]; curH = sh }
      else { cur.push(id); curH += sh }
    }
    if (cur.length) pages.push(cur)
    return pages[page - 1] || []
  }

  const themeVars = colorTheme ? injectThemeVars(colorTheme) : {}
  const primaryHex = colorTheme?.primary ?? '#0f2942'
  const accentHex  = colorTheme?.accent  ?? '#e8eef7'
  const textHex    = colorTheme?.text    ?? '#1a202c'
  const mutedHex   = colorTheme?.muted   ?? '#718096'

  const contact = cvData.contact || {}
  const skills = cvData.skills?.items || []
  const mainSections = getSectionsForPage(currentPage)
  const skillLabel = (s: any) => (typeof s === 'object' && s.name) ? s.name : String(s)

  // Main section header: tokens + bottom rule (template identity)
  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{
      ...cvType.sectionHeader,
      color: primaryHex,
      borderBottom: `2px solid ${primaryHex}`,
      paddingBottom: 5,
      marginBottom: cvSpace.headerGap,
    }}>{title}</div>
  )

  // Sidebar section header (on dark)
  const SidebarSectionHeader = ({ title }: { title: string }) => (
    <div style={{
      ...cvType.sectionHeader,
      color: 'rgba(255,255,255,0.62)',
      borderBottom: '1px solid rgba(255,255,255,0.18)',
      paddingBottom: 5,
      marginBottom: cvSpace.headerGap,
    }}>{title}</div>
  )

  const renderMainSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary': {
        if (!hasContent('summary', cvData.summary)) return null
        return (
          <div key="summary" className={`${getSectionClass('summary')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('summary')} data-section="summary">
            <SectionHeader title={getSectionTitle('summary')} />
            <p style={{ ...cvType.body, color: textHex, margin: 0 }}>
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
            {items.map((exp: any) => (
              <div key={exp.id} className={cvClass.experienceItem} style={{ marginBottom: cvSpace.itemGap }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: cvSpace.rowGap, marginBottom: 2 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ ...cvType.itemTitle, color: textHex }}>{exp.title}</span>
                    {exp.company && <span style={{ ...cvType.itemSubtitle, color: primaryHex }}> · {exp.company}</span>}
                    {exp.location && <span style={{ ...cvType.contact, color: mutedHex }}> · {exp.location}</span>}
                  </div>
                  <span style={{
                    ...cvType.date, color: '#fff', backgroundColor: primaryHex,
                    padding: '2px 8px', borderRadius: 3, fontWeight: 500, flexShrink: 0,
                  }}>
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
        )
      }
      case 'education': {
        const data = cvData.education
        if (!hasContent('education', data)) return null
        return (
          <div key="education" className={`${getSectionClass('education')} ${cvClass.section}`} style={{ marginBottom: cvSpace.sectionGap }}
            onClick={() => onSectionClick('education')} data-section="education">
            <SectionHeader title={getSectionTitle('education')} />
            {data.items.map((edu: any) => (
              <div key={edu.id} className={cvClass.educationItem} style={{ marginBottom: cvSpace.itemGap }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: cvSpace.rowGap }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...cvType.itemTitle, color: textHex }}>{edu.degree}</div>
                    {edu.institution && (
                      <div style={{ ...cvType.itemSubtitle, color: primaryHex }}>
                        {edu.institution}{edu.location && <span style={{ color: mutedHex, fontWeight: 400 }}> · {edu.location}</span>}
                      </div>
                    )}
                  </div>
                  {edu.graduationDate && (
                    <span style={{
                      ...cvType.date, color: '#fff', backgroundColor: primaryHex,
                      padding: '2px 8px', borderRadius: 3, fontWeight: 500, flexShrink: 0,
                    }}>
                      {edu.graduationDate}
                    </span>
                  )}
                </div>
                {edu.description && <p style={{ ...cvType.body, color: mutedHex, margin: '4px 0 0' }}>{edu.description}</p>}
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
            <SectionHeader title={getSectionTitle(sectionId)} />
            {data.content && <p style={{ ...cvType.body, color: textHex, margin: '0 0 6px', whiteSpace: 'pre-wrap' }}>{data.content}</p>}
            {data.items?.length > 0 && data.items.map((item: any, idx: number) => (
              <div key={item.id || idx} style={{ ...cvType.body, color: textHex, marginBottom: 6 }}>
                {item.title && <span style={{ fontWeight: 600 }}>{item.title}</span>}
                {item.description && <span style={{ color: mutedHex }}> — {item.description}</span>}
                {item.name && <span>{item.name}</span>}
                {item.issuer && <span style={{ color: mutedHex }}> — {item.issuer}</span>}
                {item.date && <span style={{ color: mutedHex }}> ({item.date})</span>}
                <MarkdownNotes source={item.notes} color={textHex} />
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
        flexDirection: 'column',
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
      {/* ── Full-width header band ───────────────────────────────────────── */}
      {hasContent('contact', contact) && (
        <div
          className={getSectionClass('contact')}
          onClick={() => onSectionClick('contact')}
          data-section="contact"
          style={{
            backgroundColor: primaryHex,
            padding: '32px 44px 28px',
            flexShrink: 0,
          }}
        >
          {/* Name + job title row */}
          <div style={{ marginBottom: 14 }}>
            {contact.fullName && (
              <div style={{ ...cvType.name, fontSize: 28, color: '#fff', marginBottom: 4 }}>
                {contact.fullName}
              </div>
            )}
            {/* Job title from most recent experience */}
            {cvData.experience?.items?.[0]?.title && (
              <div style={{ ...cvType.tagline, color: 'rgba(255,255,255,0.7)' }}>
                {cvData.experience.items[0].title}
              </div>
            )}
          </div>

          {/* Contact info row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: 12 }}>
            {[contact.email, contact.phone, contact.location, contact.linkedin].filter(Boolean).map((info, i) => (
              <span key={i} style={{ ...cvType.contact, color: 'rgba(255,255,255,0.78)' }}>
                {i > 0 && <span style={{ margin: '0 12px', opacity: 0.35 }}>|</span>}
                {info}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Body: right main + left thin sidebar ─────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Narrow right sidebar — 26% */}
        <div style={{
          width: '26%',
          backgroundColor: primaryHex,
          padding: '28px 18px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* Skills in sidebar */}
          {skills.length > 0 && (
            <div
              className={getSectionClass('skills')}
              onClick={() => onSectionClick('skills')}
              data-section="skills"
            >
              <SidebarSectionHeader title={getSectionTitle('skills')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {skills.map((skill: any, i: number) => (
                  <div key={i} style={{
                    ...cvType.contact,
                    color: 'rgba(255,255,255,0.9)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    padding: '4px 8px',
                  }}>
                    {skillLabel(skill)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main content — 74% */}
        <div style={{ flex: 1, padding: '28px 36px', overflow: 'hidden', position: 'relative' }}>
          {mainSections.map((sectionId: string) => renderMainSection(sectionId))}

          {totalPages > 1 && (
            <div style={{ position: 'absolute', bottom: '16px', right: '20px', fontSize: '10px', color: mutedHex }}>
              {currentPage} / {totalPages}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ExecutiveTemplate.displayName = 'ExecutiveTemplate'
