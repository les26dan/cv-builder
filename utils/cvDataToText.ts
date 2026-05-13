/**
 * Serialize a CV data object into a plain-text representation.
 *
 * Used on the client (e.g. /cv-match) so the user's current CV from
 * localStorage (cv_workflow_{cvId}) can be fed directly into the matching
 * API without forcing them to copy-paste. Format mirrors the server-side
 * helpers in app/api/cv/* for consistency.
 *
 * Includes dynamic sections (projects-*, volunteer-*, certifications-*)
 * by reading sectionOrder so custom-added sections show up too.
 */
export function cvDataToText(cvData: any): string {
  if (!cvData) return ''
  const parts: string[] = []

  const c = cvData.contact || {}
  parts.push('=== THÔNG TIN LIÊN HỆ ===')
  if (c.fullName) parts.push(`Họ tên: ${c.fullName}`)
  if (c.email) parts.push(`Email: ${c.email}`)
  if (c.phone) parts.push(`SĐT: ${c.phone}`)
  if (c.location) parts.push(`Địa chỉ: ${c.location}`)
  if (c.linkedin) parts.push(`LinkedIn: ${c.linkedin}`)

  if (cvData.summary?.content?.trim()) {
    parts.push('\n=== TÓM TẮT CHUYÊN MÔN ===')
    parts.push(cvData.summary.content)
  }

  const exp = cvData.experience?.items || []
  if (exp.length) {
    parts.push(`\n=== KINH NGHIỆM LÀM VIỆC ===`)
    exp.forEach((item: any, i: number) => {
      const dates = `${item.startDate || ''} – ${item.current ? 'Hiện tại' : item.endDate || ''}`
      parts.push(`[${i + 1}] ${item.title || ''} — ${item.company || ''} (${dates})`)
      const bullets = (item.bullets || []).filter((b: string) => b?.trim())
      bullets.forEach((b: string) => parts.push(`  - ${b}`))
    })
  }

  const skills = cvData.skills?.items || []
  const skillNames = skills
    .map((s: any) => (typeof s === 'string' ? s : s?.name || s?.label || ''))
    .filter(Boolean)
  if (skillNames.length) {
    parts.push('\n=== KỸ NĂNG ===')
    parts.push(skillNames.join(', '))
  }

  const edu = cvData.education?.items || []
  if (edu.length) {
    parts.push('\n=== HỌC VẤN ===')
    edu.forEach((item: any, i: number) => {
      parts.push(
        `[${i + 1}] ${item.degree || ''} — ${item.institution || ''} (${item.graduationDate || ''})`
      )
      if (item.description?.trim()) parts.push(`  ${item.description}`)
    })
  }

  // Dynamic sections: projects-*, volunteer-*, certifications-*, hobbies-*, custom-*
  const order: string[] = cvData.sectionOrder || []
  const customTitles = cvData.sectionTitles || {}
  const coreSections = new Set(['contact', 'summary', 'experience', 'skills', 'education'])

  for (const sectionId of order) {
    if (coreSections.has(sectionId)) continue
    const section = cvData[sectionId]
    if (!section) continue

    const baseType = sectionId.replace(/-\d+$/, '')
    const heading = (customTitles[sectionId] || prettyHeading(baseType)).toUpperCase()
    parts.push(`\n=== ${heading} ===`)

    if (baseType === 'projects' && Array.isArray(section.items)) {
      section.items.forEach((p: any, i: number) => {
        const dates = `${p.startDate || ''} – ${p.endDate || ''}`.trim()
        parts.push(`[${i + 1}] ${p.title || ''}${dates !== '–' ? ` (${dates})` : ''}`)
        if (p.description?.trim()) parts.push(`  ${p.description}`)
        if (p.technologies?.length) parts.push(`  Công nghệ: ${p.technologies.join(', ')}`)
        if (p.url) parts.push(`  Link: ${p.url}`)
        if (p.notes?.trim()) parts.push(`  Ghi chú: ${p.notes}`)
      })
    } else if (baseType === 'volunteer' && Array.isArray(section.items)) {
      section.items.forEach((v: any, i: number) => {
        parts.push(`[${i + 1}] ${v.role || ''} — ${v.organization || ''}`)
        if (v.description?.trim()) parts.push(`  ${v.description}`)
        if (v.notes?.trim()) parts.push(`  Ghi chú: ${v.notes}`)
      })
    } else if (baseType === 'certifications' && Array.isArray(section.items)) {
      section.items.forEach((cert: any, i: number) => {
        parts.push(`[${i + 1}] ${cert.name || ''} — ${cert.issuer || ''}${cert.date ? ` (${cert.date})` : ''}`)
        if (cert.notes?.trim()) parts.push(`  Ghi chú: ${cert.notes}`)
      })
    } else if (typeof section.content === 'string' && section.content.trim()) {
      parts.push(section.content)
    } else if (Array.isArray(section.items)) {
      section.items.forEach((item: any, i: number) => {
        const line = [item.title, item.name, item.organization, item.issuer, item.description, item.date]
          .filter(Boolean)
          .join(' — ')
        if (line) parts.push(`[${i + 1}] ${line}`)
        if (item.notes?.trim()) parts.push(`  Ghi chú: ${item.notes}`)
      })
    }
  }

  return parts.join('\n')
}

function prettyHeading(baseType: string): string {
  switch (baseType) {
    case 'projects': return 'Dự án'
    case 'volunteer': return 'Hoạt động tình nguyện'
    case 'certifications': return 'Chứng chỉ'
    case 'languages': return 'Ngôn ngữ'
    case 'hobbies': return 'Sở thích'
    case 'custom': return 'Phần khác'
    default: return baseType
  }
}

/**
 * Load the user's current CV from localStorage (saved by CVWorkflowContext)
 * and serialize it to plain text. Returns empty string if not found.
 */
export function loadCVTextFromLocalStorage(cvId: string): string {
  if (typeof window === 'undefined' || !cvId) return ''
  try {
    const raw = localStorage.getItem(`cv_workflow_${cvId}`)
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return cvDataToText(parsed)
  } catch {
    return ''
  }
}
