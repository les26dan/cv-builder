import { NextRequest, NextResponse } from 'next/server'
import {
  isLocalClaudeFallbackEnabled,
  runLocalClaude,
  parseAlternativesFromClaude,
} from '@/lib/localClaudeFallback'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * Generate 4 bullet alternatives from a wizard's structured input.
 * Input: { jobTitle, company, project, impact, responsibility?, language? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      jobTitle = '',
      company = '',
      project = '',
      impact = '',
      responsibility = '',
      language = 'vi',
    } = body

    if (!project?.trim() || !impact?.trim()) {
      return NextResponse.json({ success: false, error: 'Missing project or impact' }, { status: 400 })
    }

    const isVi = language === 'vi'
    const useLocalClaudeOnly = !OPENAI_API_KEY && isLocalClaudeFallbackEnabled()

    if (!OPENAI_API_KEY && !useLocalClaudeOnly) {
      return NextResponse.json({ success: false, error: 'AI không khả dụng' }, { status: 503 })
    }

    const systemPrompt = isVi
      ? `Bạn là chuyên gia viết CV với 15 năm kinh nghiệm tuyển dụng tại Việt Nam.
Nhiệm vụ: Tạo 1 bullet point kinh nghiệm làm việc thành 4 phương án KHÁC NHAU để người dùng chọn.

Mỗi phương án phải khác về phong cách:
1. Tập trung vào động từ hành động mạnh + kết quả định lượng
2. Nhấn mạnh tác động kinh doanh / business impact
3. Ngắn gọn, súc tích (≤ 100 ký tự)
4. Chi tiết kỹ thuật rõ ràng (≤ 180 ký tự)

Quy tắc:
- KHÔNG bịa số liệu, sự kiện không có trong dữ liệu gốc
- Giữ nguyên thông tin kỹ thuật đã nêu
- Mỗi phương án 1 câu, tự nhiên, chuyên nghiệp

Trả về JSON: { "alternatives": ["pa1", "pa2", "pa3", "pa4"] }`
      : `You are an expert CV writer with 15 years of recruiting experience.
Task: Create 1 work experience bullet as 4 DIFFERENT alternatives for the user to pick from.

Each alternative must differ in style:
1. Strong action verb + quantified result
2. Emphasize business impact
3. Concise (≤ 100 chars)
4. Clear technical detail (≤ 180 chars)

Rules:
- Do NOT fabricate metrics or facts not in the source data
- Keep existing technical details
- Each alternative is 1 natural, professional sentence

Return JSON: { "alternatives": ["a1", "a2", "a3", "a4"] }`

    const userPrompt = isVi
      ? `Vị trí: ${jobTitle} tại ${company}
Dự án/Công việc: ${project}
Trách nhiệm: ${responsibility || '(không nêu)'}
Tác động/Kết quả: ${impact}

Viết bullet thành 4 phương án khác nhau.`
      : `Position: ${jobTitle} at ${company}
Project/Work: ${project}
Responsibility: ${responsibility || '(none)'}
Impact/Result: ${impact}

Write the bullet as 4 different alternatives.`

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
            max_tokens: 600,
            temperature: 0.5,
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
        console.error('OpenAI wizard-bullet failed:', openaiError)
      }
    }

    if (alternatives.length === 0 && isLocalClaudeFallbackEnabled()) {
      try {
        const fallbackPrompt = `${systemPrompt}\n\n${userPrompt}`
        const raw = await runLocalClaude(fallbackPrompt, { timeoutMs: 60_000 })
        alternatives = parseAlternativesFromClaude(raw)
        console.log(`[local-claude-fallback] wizard-bullet returned ${alternatives.length} alternatives`)
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
    console.error('Wizard-bullet route error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
