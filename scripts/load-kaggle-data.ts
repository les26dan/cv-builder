/**
 * Kaggle dataset loader for thesis evaluation.
 *
 * Loads:
 *   - data/kaggle/Resume.csv      (Kaggle: snehaanbhawal/resume-dataset)
 *   - data/kaggle/JobPostings.csv (Kaggle: arshkon/linkedin-job-postings or similar)
 *
 * Run as a smoke test:
 *   npx tsx scripts/load-kaggle-data.ts
 *
 * Imported by scripts/evaluate-matching.ts and scripts/build-ground-truth.ts.
 *
 * Implementation note: uses a minimal RFC-4180-aware CSV parser to avoid
 * adding a runtime dependency until the eval harness needs it. Will be
 * swapped to `csv-parse` (already in plan deps) once installed.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const KAGGLE_DIR = path.resolve(process.cwd(), 'data/kaggle')

export interface ResumeRow {
  ID: string
  Resume_str: string
  Resume_html?: string
  Category: string
}

export interface JobPostingRow {
  /** Title field name varies across Kaggle datasets — normalize to this. */
  job_title: string
  job_description: string
  /** Optional skill list parsed from the dataset (Jaccard B ground truth). */
  skills?: string[]
  /** Free-form: company, location, etc. Kept loose for downstream flexibility. */
  raw: Record<string, string>
}

// =============================================================================
// CSV parser — minimal RFC-4180 (handles "quoted, fields", embedded ""quotes"")
// =============================================================================

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  // Skip optional UTF-8 BOM
  if (text.charCodeAt(0) === 0xfeff) i = 1

  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue }
        inQuotes = false; i++; continue
      }
      field += ch; i++; continue
    }
    if (ch === '"') { inQuotes = true; i++; continue }
    if (ch === ',') { row.push(field); field = ''; i++; continue }
    if (ch === '\n' || ch === '\r') {
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
      // Swallow \r\n as one line break
      if (ch === '\r' && text[i + 1] === '\n') i++
      i++; continue
    }
    field += ch; i++
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.length > 1 || row[0] !== '') rows.push(row)
  }
  return rows
}

function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return []
  const header = rows[0]
  return rows.slice(1).map(r => {
    const obj: Record<string, string> = {}
    header.forEach((h, i) => { obj[h] = r[i] ?? '' })
    return obj
  })
}

// =============================================================================
// Loaders
// =============================================================================

function readCsv(filename: string): Record<string, string>[] {
  const fullPath = path.join(KAGGLE_DIR, filename)
  if (!fs.existsSync(fullPath)) {
    throw new Error(
      `Missing ${filename} in ${KAGGLE_DIR}/. ` +
      `See data/kaggle/README.md for download instructions.`
    )
  }
  const text = fs.readFileSync(fullPath, 'utf8')
  return rowsToObjects(parseCsv(text))
}

export function loadResumes(): ResumeRow[] {
  const rows = readCsv('Resume.csv')
  return rows
    .filter(r => r.Resume_str && r.Category)
    .map(r => ({
      ID: r.ID || r.id || '',
      Resume_str: r.Resume_str,
      Resume_html: r.Resume_html,
      Category: r.Category.trim(),
    }))
}

/**
 * Load JD postings. Tolerates several common column-name conventions
 * across Kaggle datasets (LinkedIn, Indeed, etc.).
 */
export function loadJobPostings(): JobPostingRow[] {
  // Prefer the pre-sampled file (created by scripts/sample-jobpostings.ts)
  // because the raw LinkedIn dump is 517MB and OOMs the in-memory parser.
  const filename = fs.existsSync(path.join(KAGGLE_DIR, 'JobPostings.sampled.csv'))
    ? 'JobPostings.sampled.csv'
    : 'JobPostings.csv'
  const rows = readCsv(filename)

  return rows
    .map(r => {
      const title =
        r.job_title || r.title || r['Job Title'] || r.position || r.role || ''
      const desc =
        r.description ||
        r.job_description ||
        r['Job Description'] ||
        r.body ||
        ''
      const skillsRaw = r.skills || r.skill_list || r['Skill_set'] || ''
      const skills = skillsRaw
        ? skillsRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
        : undefined

      return {
        job_title: title.trim(),
        job_description: desc,
        skills,
        raw: r,
      }
    })
    .filter(r => r.job_title && r.job_description.length > 50)
}

// =============================================================================
// CLI smoke test
// =============================================================================

function main() {
  console.log(`Loading Kaggle data from ${KAGGLE_DIR}/\n`)

  let resumes: ResumeRow[] = []
  let jds: JobPostingRow[] = []
  try {
    resumes = loadResumes()
    console.log(`✓ Resume.csv      → ${resumes.length} rows`)
  } catch (e: any) {
    console.log(`✗ Resume.csv      → ${e.message}`)
  }

  try {
    jds = loadJobPostings()
    console.log(`✓ JobPostings.csv → ${jds.length} rows`)
  } catch (e: any) {
    console.log(`✗ JobPostings.csv → ${e.message}`)
  }

  if (resumes.length > 0) {
    const byCat = new Map<string, number>()
    for (const r of resumes) byCat.set(r.Category, (byCat.get(r.Category) || 0) + 1)
    console.log(`\nResume categories (${byCat.size}):`)
    const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1])
    for (const [c, n] of sorted) console.log(`  ${n.toString().padStart(4)} ${c}`)

    console.log('\nSample resume row:')
    const sample = resumes[0]
    console.log(`  ID:       ${sample.ID || '(no ID)'}`)
    console.log(`  Category: ${sample.Category}`)
    console.log(`  Resume:   ${sample.Resume_str.slice(0, 200).replace(/\n/g, ' ')}…`)
  }

  if (jds.length > 0) {
    console.log('\nSample JD row:')
    const sample = jds[0]
    console.log(`  Title:       ${sample.job_title}`)
    console.log(`  Description: ${sample.job_description.slice(0, 200).replace(/\n/g, ' ')}…`)
    console.log(`  Skills:      ${sample.skills?.slice(0, 5).join(', ') || '(none parsed)'}`)
    console.log(`  Cols seen:   ${Object.keys(sample.raw).slice(0, 8).join(', ')}…`)
  }
}

if (require.main === module) main()
