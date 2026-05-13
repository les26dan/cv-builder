/**
 * DOCX generator using the `docx` library (OOXML).
 *
 * Produces a real .docx file (not RTF). Vietnamese diacritics are preserved
 * because OOXML is UTF-8 / XML-encoded under the hood.
 *
 * Kept intentionally minimal: a clean single-column layout that mirrors the
 * structural order of the CV data. Visual fidelity with the React templates
 * is not a goal here — readability + ATS-friendliness is.
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';

interface CVData {
  contact?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  summary?: { content?: string };
  experience?: {
    items: Array<{
      id?: string;
      title?: string;
      company?: string;
      location?: string;
      startDate?: string;
      endDate?: string;
      current?: boolean;
      bullets?: string[];
    }>;
  };
  skills?: { items: any[] };
  education?: {
    items: Array<{
      degree?: string;
      institution?: string;
      location?: string;
      graduationDate?: string;
      description?: string;
    }>;
  };
  sectionOrder?: string[];
  sectionTitles?: Record<string, string>;
  [key: string]: any;
}

const defaultSectionTitles: Record<string, string> = {
  summary: 'MỤC TIÊU NGHỀ NGHIỆP',
  experience: 'KINH NGHIỆM LÀM VIỆC',
  skills: 'KỸ NĂNG',
  education: 'HỌC VẤN',
  projects: 'DỰ ÁN',
  volunteer: 'HOẠT ĐỘNG TÌNH NGUYỆN',
  certifications: 'CHỨNG CHỈ',
  languages: 'NGÔN NGỮ',
  hobbies: 'SỞ THÍCH',
};

const skillName = (s: any): string =>
  typeof s === 'string' ? s : s?.name || s?.label || s?.skill || String(s);

const getSectionTitle = (id: string, custom?: Record<string, string>): string => {
  if (custom?.[id]) return custom[id].toUpperCase();
  if (id.startsWith('projects-')) return defaultSectionTitles.projects;
  if (id.startsWith('volunteer-')) return defaultSectionTitles.volunteer;
  if (id.startsWith('certifications-')) return defaultSectionTitles.certifications;
  if (id.startsWith('languages-')) return defaultSectionTitles.languages;
  if (id.startsWith('hobbies-')) return defaultSectionTitles.hobbies;
  return defaultSectionTitles[id] || id.toUpperCase();
};

const sectionHeading = (text: string): Paragraph =>
  new Paragraph({
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { color: '1a56db', style: BorderStyle.SINGLE, size: 6, space: 4 },
    },
    children: [
      new TextRun({ text, bold: true, size: 24, color: '1a56db' }),
    ],
  });

const body = (text: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}): Paragraph =>
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22 }),
    ],
  });

const bullet = (text: string): Paragraph =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22 })],
  });

/**
 * Render free-text markdown notes as DOCX paragraphs.
 *
 * Intentionally lo-fi: we don't parse the full markdown AST. Real CV notes
 * are short — bullets and bold/italic emphasis. We strip the markers and
 * emit either bullet or body paragraphs so the meaning survives even if
 * the styling doesn't perfectly match the on-screen preview.
 */
const renderMarkdownNotes = (md?: string): Paragraph[] => {
  if (!md || !md.trim()) return [];
  const lines = md.split(/\r?\n/);
  const out: Paragraph[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const bulletMatch = line.match(/^[-*+]\s+(.*)$/);
    if (bulletMatch) {
      out.push(bullet(stripInlineMd(bulletMatch[1])));
    } else {
      out.push(body(stripInlineMd(line)));
    }
  }
  return out;
};

const stripInlineMd = (s: string): string =>
  s
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.+?)\*/g, '$1')        // *italic*
    .replace(/`([^`]+)`/g, '$1')        // `code`
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)'); // [text](url)

export const generateDocxBlob = async (cvData: CVData): Promise<Blob> => {
  const order = cvData.sectionOrder || ['contact', 'summary', 'experience', 'skills', 'education'];
  const paragraphs: Paragraph[] = [];

  for (const id of order) {
    const data = cvData[id];
    if (!data) continue;

    switch (id) {
      case 'contact': {
        if (data.fullName) {
          paragraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
              children: [new TextRun({ text: data.fullName, bold: true, size: 36 })],
            })
          );
        }
        const info = [data.email, data.phone, data.location, data.linkedin].filter(Boolean);
        if (info.length) {
          paragraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [new TextRun({ text: info.join('  |  '), size: 20, color: '64748b' })],
            })
          );
        }
        break;
      }

      case 'summary': {
        if (!data.content?.trim()) break;
        paragraphs.push(sectionHeading(getSectionTitle(id, cvData.sectionTitles)));
        paragraphs.push(body(data.content));
        break;
      }

      case 'experience': {
        if (!data.items?.length) break;
        paragraphs.push(sectionHeading(getSectionTitle(id, cvData.sectionTitles)));
        for (const exp of data.items) {
          if (!exp.title && !exp.company) continue;
          // Title • Company
          const headerParts: TextRun[] = [];
          if (exp.title) headerParts.push(new TextRun({ text: exp.title, bold: true, size: 22 }));
          if (exp.company) headerParts.push(new TextRun({ text: `  —  ${exp.company}`, size: 22 }));
          if (exp.location) headerParts.push(new TextRun({ text: `, ${exp.location}`, size: 22, color: '64748b' }));
          paragraphs.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: headerParts }));

          const dateRange = `${exp.startDate || ''} – ${exp.current ? 'Hiện tại' : exp.endDate || ''}`.trim();
          if (dateRange !== '–') {
            paragraphs.push(body(dateRange, { italics: true, size: 20 }));
          }
          for (const b of exp.bullets || []) {
            if (b?.trim()) paragraphs.push(bullet(b));
          }
        }
        break;
      }

      case 'skills': {
        if (!data.items?.length) break;
        paragraphs.push(sectionHeading(getSectionTitle(id, cvData.sectionTitles)));
        paragraphs.push(body(data.items.map(skillName).join('  •  ')));
        break;
      }

      case 'education': {
        if (!data.items?.length) break;
        paragraphs.push(sectionHeading(getSectionTitle(id, cvData.sectionTitles)));
        for (const edu of data.items) {
          if (!edu.degree && !edu.institution) continue;
          const headerParts: TextRun[] = [];
          if (edu.degree) headerParts.push(new TextRun({ text: edu.degree, bold: true, size: 22 }));
          if (edu.institution) headerParts.push(new TextRun({ text: `  —  ${edu.institution}`, size: 22 }));
          if (edu.location) headerParts.push(new TextRun({ text: `, ${edu.location}`, size: 22, color: '64748b' }));
          paragraphs.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: headerParts }));
          if (edu.graduationDate) paragraphs.push(body(edu.graduationDate, { italics: true, size: 20 }));
          if (edu.description) paragraphs.push(body(edu.description));
        }
        break;
      }

      default: {
        // Generic custom-section rendering: title + content/items.
        const title = getSectionTitle(id, cvData.sectionTitles);
        const hasItems = Array.isArray(data.items) && data.items.length > 0;
        const hasText = typeof data.content === 'string' && data.content.trim();
        if (!hasItems && !hasText) break;
        paragraphs.push(sectionHeading(title));
        if (hasText) paragraphs.push(body(data.content));
        if (hasItems) {
          for (const item of data.items) {
            const line = [item.title, item.name, item.organization, item.issuer, item.description, item.date]
              .filter(Boolean)
              .join(' — ');
            if (line) paragraphs.push(body(line));
            paragraphs.push(...renderMarkdownNotes(item.notes));
          }
        }
      }
    }
  }

  const doc = new Document({
    creator: 'PMF CV Builder',
    title: cvData.contact?.fullName ? `${cvData.contact.fullName} - CV` : 'CV',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch
          },
        },
        children: paragraphs,
      },
    ],
  });

  // Browser-safe: docx exposes toBlob in browser bundles.
  const blob = await Packer.toBlob(doc);
  return blob;
};
