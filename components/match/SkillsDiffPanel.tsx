/**
 * SkillsDiffPanel — show matched + missing keywords from TF-IDF and LLM.
 *
 * Embedding doesn't expose keyword overlap (it's a dense vector), so we
 * union TF-IDF (lexical) and LLM (reasoning) keyword sets. Each keyword
 * gets a source badge so the demo can show "TF-IDF caught X, LLM caught Y".
 */
'use client'

import { MatchResult } from '@/shared/services/matching/types'

interface Props {
  tfidf?: MatchResult
  llm?: MatchResult
}

interface KW {
  word: string
  sources: ('tfidf' | 'llm')[]
}

function mergeKeywords(
  tfidf: string[] | undefined,
  llm: string[] | undefined,
): KW[] {
  const map = new Map<string, Set<'tfidf' | 'llm'>>()
  for (const w of (tfidf ?? [])) {
    const key = w.toLowerCase().trim()
    if (!key) continue
    if (!map.has(key)) map.set(key, new Set())
    map.get(key)!.add('tfidf')
  }
  for (const w of (llm ?? [])) {
    const key = w.toLowerCase().trim()
    if (!key) continue
    if (!map.has(key)) map.set(key, new Set())
    map.get(key)!.add('llm')
  }
  return Array.from(map.entries()).map(([word, set]) => ({
    word,
    sources: Array.from(set),
  }))
}

function Pill({ kw, color }: { kw: KW; color: 'green' | 'red' }) {
  const base = color === 'green'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : 'bg-rose-50 text-rose-800 border-rose-200'
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${base}`}>
      {kw.word}
      <span className="text-[10px] opacity-60">
        {kw.sources.join('+')}
      </span>
    </span>
  )
}

export default function SkillsDiffPanel({ tfidf, llm }: Props) {
  const matched = mergeKeywords(tfidf?.matchedKeywords, llm?.matchedKeywords)
  const missing = mergeKeywords(tfidf?.missingKeywords, llm?.missingKeywords)

  if (matched.length === 0 && missing.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Chưa có dữ liệu từ khoá — chạy phương pháp LLM để xem từ khoá khớp / thiếu.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-medium text-emerald-800 mb-2">
          ✓ Từ khoá khớp ({matched.length})
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {matched.length > 0
            ? matched.map(kw => <Pill key={kw.word} kw={kw} color="green" />)
            : <span className="text-xs text-gray-400 italic">không có</span>}
        </div>
      </section>

      <section>
        <h4 className="text-sm font-medium text-rose-800 mb-2">
          ✗ Từ khoá thiếu — nên bổ sung vào CV ({missing.length})
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {missing.length > 0
            ? missing.map(kw => <Pill key={kw.word} kw={kw} color="red" />)
            : <span className="text-xs text-gray-400 italic">không có — CV đã phủ hết các từ khoá quan trọng của JD</span>}
        </div>
      </section>
    </div>
  )
}
