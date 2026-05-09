/**
 * Build evaluation pairs for thesis Strategy A (category-proxy labels).
 *
 *   npx tsx scripts/build-ground-truth.ts                     # build pairs.json
 *   npx tsx scripts/build-ground-truth.ts --inspect           # report unmapped JD titles
 *   npx tsx scripts/build-ground-truth.ts --pos 200 --neg 200 # custom sizes
 *   npx tsx scripts/build-ground-truth.ts --seed 7            # different sample
 *
 * Strategy A (silver-standard, acknowledged as proxy in thesis §5.3):
 *   - Map each JD's title to one of the 24 Resume categories via category-mapping.json.
 *   - Positive pair = (resume, JD) where resume.Category matches JD's mapped category.
 *   - Negative pair = (resume, JD) where they map to DIFFERENT categories.
 *
 * Output: data/eval/pairs.json with stratified sampling, deterministic per seed.
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()
import * as fs from 'node:fs'
import * as path from 'node:path'
import { loadResumes, loadJobPostings, type ResumeRow, type JobPostingRow } from './load-kaggle-data'

// =============================================================================
// CLI args
// =============================================================================

interface Args {
  inspect: boolean
  pos: number
  neg: number
  seed: number
  out: string
}

function parseArgs(): Args {
  const a = process.argv.slice(2)
  const get = (flag: string, fallback?: string) => {
    const i = a.indexOf(flag)
    return i >= 0 ? a[i + 1] : fallback
  }
  return {
    inspect: a.includes('--inspect'),
    pos: parseInt(get('--pos', '200')!, 10),
    neg: parseInt(get('--neg', '200')!, 10),
    seed: parseInt(get('--seed', '42')!, 10),
    out: get('--out', 'data/eval/pairs.json')!,
  }
}

// =============================================================================
// Deterministic RNG (mulberry32 — seeded, reproducible, no deps)
// =============================================================================

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleInPlace<T>(arr: T[], rng: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

// =============================================================================
// Category mapping
// =============================================================================

interface CategoryMap {
  categories: Record<string, { patterns: string[]; notes?: string }>
}

function loadCategoryMapping(): {
  categories: string[]
  match: (jdTitle: string) => string | null
} {
  const raw: CategoryMap = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'data/category-mapping.json'), 'utf8')
  )
  const compiled: Array<{ cat: string; re: RegExp }> = []
  for (const [cat, def] of Object.entries(raw.categories)) {
    for (const p of def.patterns) {
      compiled.push({ cat, re: new RegExp(p, 'i') })
    }
  }
  return {
    categories: Object.keys(raw.categories),
    match: (title: string) => {
      for (const { cat, re } of compiled) {
        if (re.test(title)) return cat
      }
      return null
    },
  }
}

// =============================================================================
// Pair output schema (matches what evaluate-matching.ts will consume in D5)
// =============================================================================

interface EvalPair {
  pairId: string                // deterministic: `p-${index}`
  resumeId: string
  resumeCategory: string
  resumeText: string
  jdTitle: string
  jdCategory: string            // mapped via patterns
  jdText: string
  label: 0 | 1                  // 1 = same category, 0 = cross-category
}

// =============================================================================
// Build
// =============================================================================

function truncate(s: string, max = 4000): string {
  // Keep eval pair sizes bounded so LLM prompts stay within token budget.
  // Average gpt-4o-mini context for our prompt: ~6k chars CV + ~3k chars JD.
  return s.length > max ? s.slice(0, max) : s
}

function main() {
  const args = parseArgs()
  const rng = mulberry32(args.seed)
  const mapping = loadCategoryMapping()

  console.log(`Loading Kaggle data…`)
  const resumes = loadResumes()
  const jds = loadJobPostings()
  console.log(`  resumes: ${resumes.length}`)
  console.log(`  jds:     ${jds.length}`)

  // ---------------------------------------------------------------------------
  // Map JDs to categories
  // ---------------------------------------------------------------------------
  const jdsByCategory = new Map<string, JobPostingRow[]>()
  const unmapped: string[] = []
  for (const jd of jds) {
    const cat = mapping.match(jd.job_title)
    if (cat) {
      const bucket = jdsByCategory.get(cat) ?? []
      bucket.push(jd)
      jdsByCategory.set(cat, bucket)
    } else {
      unmapped.push(jd.job_title)
    }
  }

  const unmappedRate = unmapped.length / jds.length
  console.log(
    `  mapped JDs:   ${jds.length - unmapped.length} (${((1 - unmappedRate) * 100).toFixed(1)}%)`
  )
  console.log(
    `  unmapped JDs: ${unmapped.length} (${(unmappedRate * 100).toFixed(1)}%)`
  )

  if (args.inspect) {
    console.log(`\nTop 40 unmapped JD titles (tune category-mapping.json):`)
    const freq = new Map<string, number>()
    for (const t of unmapped) freq.set(t, (freq.get(t) ?? 0) + 1)
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
    for (const [t, n] of sorted) console.log(`  ${String(n).padStart(4)}  ${t}`)
    console.log(`\nMapped JD distribution:`)
    const catCounts = [...jdsByCategory.entries()]
      .map(([c, arr]) => [c, arr.length] as const)
      .sort((a, b) => b[1] - a[1])
    for (const [c, n] of catCounts) console.log(`  ${String(n).padStart(4)}  ${c}`)
    return
  }

  // ---------------------------------------------------------------------------
  // Index resumes by category
  // ---------------------------------------------------------------------------
  const resumesByCategory = new Map<string, ResumeRow[]>()
  for (const r of resumes) {
    const bucket = resumesByCategory.get(r.Category) ?? []
    bucket.push(r)
    resumesByCategory.set(r.Category, bucket)
  }

  // Categories that have BOTH resumes and mapped JDs — the only pairable set.
  const pairableCats = [...resumesByCategory.keys()].filter(c => (jdsByCategory.get(c)?.length ?? 0) > 0)
  console.log(`  pairable categories: ${pairableCats.length} / ${mapping.categories.length}`)
  if (pairableCats.length < 3) {
    console.error('ERROR: <3 pairable categories. Cannot build a meaningful eval set.')
    console.error('Run with --inspect to debug category mapping.')
    process.exit(1)
  }

  // ---------------------------------------------------------------------------
  // Sample positive pairs (same category) — stratified across categories
  // ---------------------------------------------------------------------------
  const positives: EvalPair[] = []
  const perCat = Math.ceil(args.pos / pairableCats.length)
  for (const cat of pairableCats) {
    const rs = resumesByCategory.get(cat)!
    const js = jdsByCategory.get(cat)!
    for (let i = 0; i < perCat && positives.length < args.pos; i++) {
      const r = rs[Math.floor(rng() * rs.length)]
      const j = js[Math.floor(rng() * js.length)]
      positives.push({
        pairId: `pos-${positives.length}`,
        resumeId: r.ID || `r-${positives.length}`,
        resumeCategory: r.Category,
        resumeText: truncate(r.Resume_str),
        jdTitle: j.job_title,
        jdCategory: cat,
        jdText: truncate(j.job_description),
        label: 1,
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Sample negative pairs (different categories) — uniform across pairs of cats
  // ---------------------------------------------------------------------------
  const negatives: EvalPair[] = []
  let attempts = 0
  while (negatives.length < args.neg && attempts < args.neg * 10) {
    attempts++
    const ca = pairableCats[Math.floor(rng() * pairableCats.length)]
    const cb = pairableCats[Math.floor(rng() * pairableCats.length)]
    if (ca === cb) continue
    const rs = resumesByCategory.get(ca)!
    const js = jdsByCategory.get(cb)!
    const r = rs[Math.floor(rng() * rs.length)]
    const j = js[Math.floor(rng() * js.length)]
    negatives.push({
      pairId: `neg-${negatives.length}`,
      resumeId: r.ID || `r-neg-${negatives.length}`,
      resumeCategory: r.Category,
      resumeText: truncate(r.Resume_str),
      jdTitle: j.job_title,
      jdCategory: cb,
      jdText: truncate(j.job_description),
      label: 0,
    })
  }

  if (negatives.length < args.neg) {
    console.warn(`WARN: only ${negatives.length}/${args.neg} negatives after ${attempts} attempts.`)
  }

  // ---------------------------------------------------------------------------
  // Combine + shuffle + re-id
  // ---------------------------------------------------------------------------
  const all = [...positives, ...negatives]
  shuffleInPlace(all, rng)
  all.forEach((p, i) => { p.pairId = `p-${i}` })

  // ---------------------------------------------------------------------------
  // Write output
  // ---------------------------------------------------------------------------
  const outPath = path.resolve(process.cwd(), args.out)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(all, null, 2))

  const posCount = all.filter(p => p.label === 1).length
  const negCount = all.length - posCount
  console.log(`\nWrote ${all.length} pairs to ${args.out}`)
  console.log(`  positive (label=1): ${posCount}`)
  console.log(`  negative (label=0): ${negCount}`)
  console.log(`  seed:               ${args.seed}`)
  console.log(`  unmapped rate:      ${(unmappedRate * 100).toFixed(1)}% (target <10%)`)

  if (unmappedRate > 0.1) {
    console.warn('\nWARN: unmapped rate >10%. Run with --inspect and tune data/category-mapping.json.')
  }
}

if (require.main === module) main()
