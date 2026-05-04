import { NextRequest, NextResponse } from 'next/server'
import {
  isLocalClaudeFallbackEnabled,
  runLocalClaude,
  parseAlternativesFromClaude,
} from '@/lib/localClaudeFallback'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * Summary AI route. Handles both `generate` (from scratch) and `improve`
 * (rewrite existing summary) by returning 4 alternatives.
 *
 * Input:
 *   { mode: 'generate' | 'improve',
 *     existingContent?: string,
 *     workExperience?: any[], skills?: string[], education?: any[],
 *     targetJob?: string, language?: 'vi' | 'en' }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      mode,
      existingContent = '',
      workExperience = [],
      skills = [],
      education = [],
      targetJob = '',
      language = 'vi',
    } = body

    if (mode !== 'generate' && mode !== 'improve') {
      return NextResponse.json({ success: false, error: 'Invalid mode' }, { status: 400 })
    }
    if (mode === 'improve' && !existingContent.trim()) {
      return NextResponse.json({ success: false, error: 'Missing existingContent' }, { status: 400 })
    }

    const isVi = language === 'vi'
    const useLocalClaudeOnly = !OPENAI_API_KEY && isLocalClaudeFallbackEnabled()

    if (!OPENAI_API_KEY && !useLocalClaudeOnly) {
      return NextResponse.json({ success: false, error: 'AI không khả dụng' }, { status: 503 })
    }

    // Build context strings
    const expText = (workExperience || [])
      .map((e: any) => `${e.title || ''} ${isVi ? 'tại' : 'at'} ${e.company || ''}: ${e.description || (e.bullets || []).join(', ')}`)
      .join('\n')
    const eduText = (education || [])
      .map((e: any) => `${e.degree || ''} ${isVi ? 'tại' : 'at'} ${e.school || ''}`)
      .join('\n')
    const skillsText = (skills || []).join(', ')

    const taskLine = mode === 'generate'
      ? (isVi
          ? 'Viết MỚI phần "Tóm tắt chuyên môn" (Professional Summary) đặt ở đầu CV, dựa trên thông tin dưới đây.'
          : 'Write a NEW professional summary (the introduction paragraph at the top of a CV) based on the information below.')
      : (isVi
          ? 'Viết lại phần "Tóm tắt chuyên môn" hiện có cho chuyên nghiệp và tự nhiên hơn.'
          : 'Rewrite the existing professional summary to sound more natural and professional.')

    const systemPrompt = isVi
      ? `Bạn là chuyên gia viết CV với 15 năm kinh nghiệm tuyển dụng tại Việt Nam.
${taskLine}

CẤU TRÚC BẮT BUỘC (mọi phương án phải tuân theo):
- Câu 1 — Mở đầu: vai trò/chức danh + số năm kinh nghiệm + lĩnh vực/ngành chuyên sâu.
- Câu 2 — Thế mạnh: kỹ năng / công nghệ / chuyên môn cụ thể (đề cập tên công nghệ, phương pháp, domain).
- Câu 3 — Thành tựu hoặc giá trị: 1 thành tựu nổi bật HOẶC giá trị mang lại cho công ty/team (chỉ dùng số liệu CÓ TRONG dữ liệu gốc).
- (Tùy chọn) Câu 4 — Định hướng: mục tiêu nghề nghiệp ngắn gọn.

PHONG CÁCH BẮT BUỘC:
- Văn xuôi liền mạch 3-4 câu, tổng cộng 250-500 ký tự — KHÔNG dùng bullet, KHÔNG dùng dấu •, -, *.
- Giọng kể tự nhiên, ngôi thứ ba (không "Tôi"), như cách người thật giới thiệu bản thân đầu CV.
- KHÔNG nhồi nhét từ khóa kỹ thuật rời rạc kiểu "Node.js, PostgreSQL, Docker, Redis".
- KHÔNG bịa số liệu, công ty, dự án không có trong dữ liệu gốc.
- KHÔNG bao gồm tên riêng người hoặc tên công ty cụ thể.
- KHÔNG bắt đầu bằng "Là một...", "Tôi là...", hoặc các cụm sáo mòn.

4 PHƯƠNG ÁN KHÁC NHAU VỀ GÓC NHÌN (không phải style cứng):
1. Hướng kết quả — nhấn vào thành tựu/đóng góp cụ thể.
2. Hướng chuyên môn — nhấn vào chiều sâu kỹ năng và kinh nghiệm thực chiến.
3. Hướng định hướng — nhấn vào mục tiêu nghề nghiệp và động lực phát triển.
4. Hướng cân bằng — pha trộn 3 góc trên một cách tự nhiên.

Cả 4 phương án đều phải đầy đủ 3-4 câu theo cấu trúc trên — không có phương án nào chỉ 1 câu cộc lốc.

Trả về JSON đúng format: { "alternatives": ["pa1", "pa2", "pa3", "pa4"] }`
      : `You are an expert CV writer with 15 years of recruiting experience.
${taskLine}

REQUIRED STRUCTURE (every alternative must follow this):
- Sentence 1 — Opening: role/title + years of experience + industry/domain.
- Sentence 2 — Strengths: specific skills, technologies, methodologies, or domain expertise.
- Sentence 3 — Achievement or value: one notable achievement OR the value you bring to teams (only use metrics PRESENT in the source data).
- (Optional) Sentence 4 — Direction: brief career goal or what you're looking for.

REQUIRED STYLE:
- Flowing prose of 3-4 sentences, total 250-500 characters — NO bullets, NO •, -, * markers.
- Natural narrative voice in third person (no "I"), like how a real person introduces themselves at the top of a CV.
- DO NOT cram disconnected technical keywords like "Node.js, PostgreSQL, Docker, Redis".
- DO NOT fabricate metrics, companies, or projects not in the source data.
- DO NOT include personal names or specific company names.
- DO NOT start with clichés like "As a...", "I am a...".

4 ALTERNATIVES DIFFERING IN ANGLE (not rigid style):
1. Results-oriented — emphasize concrete achievements/contributions.
2. Expertise-oriented — emphasize depth of skill and hands-on experience.
3. Direction-oriented — emphasize career goals and motivation for growth.
4. Balanced — naturally blend all three angles.

All 4 alternatives must be complete 3-4 sentence summaries following the structure above — no terse one-liners.

Return JSON exactly: { "alternatives": ["a1", "a2", "a3", "a4"] }`

    const userPrompt = isVi
      ? `Kinh nghiệm:
${expText || '(chưa có)'}

Kỹ năng: ${skillsText || '(chưa có)'}

Học vấn:
${eduText || '(chưa có)'}

Vị trí mục tiêu: ${targetJob || '(không xác định)'}

${mode === 'improve' ? `Tóm tắt hiện tại:\n"${existingContent}"\n\nViết lại thành 4 phương án khác nhau.` : 'Viết 4 phương án tóm tắt khác nhau.'}`
      : `Experience:
${expText || '(none)'}

Skills: ${skillsText || '(none)'}

Education:
${eduText || '(none)'}

Target role: ${targetJob || '(unspecified)'}

${mode === 'improve' ? `Current summary:\n"${existingContent}"\n\nRewrite into 4 different alternatives.` : 'Write 4 different summary alternatives.'}`

    let alternatives: string[] = []
    let openaiError: string | null = null

    if (!useLocalClaudeOnly) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000)

      try {
        const response = await fetch(OPENAI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 1500,
            temperature: 0.6,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(`OpenAI error ${response.status}: ${(err as any)?.error?.message || 'Unknown'}`)
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed.alternatives)) {
          alternatives = parsed.alternatives.filter((s: any) => typeof s === 'string' && s.trim())
        }
      } catch (err: any) {
        clearTimeout(timeoutId)
        openaiError = err?.message || 'OpenAI failed'
        console.error('OpenAI summary failed:', openaiError)
      }
    }

    if (alternatives.length === 0 && isLocalClaudeFallbackEnabled()) {
      try {
        const fallbackPrompt = `${systemPrompt}\n\n${userPrompt}`
        const raw = await runLocalClaude(fallbackPrompt, { timeoutMs: 60_000 })
        alternatives = parseAlternativesFromClaude(raw)
        console.log(`[local-claude-fallback] summary returned ${alternatives.length} alternatives`)
      } catch (err: any) {
        console.error('Local Claude fallback failed:', err?.message)
      }
    }

    if (alternatives.length === 0) {
      return NextResponse.json(
        { success: false, error: openaiError || 'AI did not return alternatives' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, alternatives })
  } catch (error: any) {
    console.error('Summary route error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
