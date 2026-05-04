import { NextRequest, NextResponse } from 'next/server'
import {
  isLocalClaudeFallbackEnabled,
  runLocalClaudeAlternatives,
  parseAlternativesFromClaude,
} from '@/lib/localClaudeFallback'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bullet, jobTitle, company, language = 'vi' } = body

    if (!bullet?.trim()) {
      return NextResponse.json({ success: false, error: 'Missing bullet text' }, { status: 400 })
    }

    const isVietnamese = language === 'vi'

    // If no OpenAI key but local Claude fallback is enabled, skip OpenAI entirely.
    const useLocalClaudeOnly = !OPENAI_API_KEY && isLocalClaudeFallbackEnabled()

    if (!OPENAI_API_KEY && !useLocalClaudeOnly) {
      return NextResponse.json({ success: false, error: 'AI không khả dụng' }, { status: 503 })
    }

    const systemPrompt = isVietnamese
      ? `Bạn là chuyên gia viết CV với 15 năm kinh nghiệm tuyển dụng tại Việt Nam.
Nhiệm vụ: Viết lại 1 bullet point kinh nghiệm làm việc thành 4 phương án KHÁC NHAU để người dùng chọn.

Mỗi phương án phải khác về phong cách:
1. Tập trung vào động từ hành động mạnh + kết quả định lượng (%, con số)
2. Nhấn mạnh tác động kinh doanh / business impact
3. Ngắn gọn, súc tích (≤ 100 ký tự)
4. Chi tiết kỹ thuật rõ ràng (≤ 180 ký tự)

Quy tắc chung:
- KHÔNG bịa số liệu, sự kiện không có trong câu gốc
- Giữ nguyên thông tin kỹ thuật đã nêu
- Mỗi phương án 1 câu, tự nhiên, chuyên nghiệp

Trả về JSON: { "alternatives": ["pa1", "pa2", "pa3", "pa4"] }`
      : `You are an expert CV writer with 15 years of recruiting experience.
Task: Rewrite the work experience bullet into 4 DIFFERENT alternatives for the user to pick from.

Each alternative must differ in style:
1. Strong action verb + quantified result (%, numbers)
2. Emphasize business impact
3. Concise (≤ 100 characters)
4. Clear technical detail (≤ 180 characters)

General rules:
- Do NOT fabricate metrics or events not in the original
- Keep existing technical details
- Each alternative is 1 natural, professional sentence

Return JSON: { "alternatives": ["a1", "a2", "a3", "a4"] }`

    const userPrompt = isVietnamese
      ? `Vị trí: ${jobTitle || 'Không rõ'} tại ${company || 'Không rõ'}

Bullet gốc:
"${bullet}"

Viết lại bullet này thành 4 phương án khác nhau.`
      : `Position: ${jobTitle || 'Unknown'} at ${company || 'Unknown'}

Original bullet:
"${bullet}"

Rewrite into 4 different alternatives.`

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
        } else if (typeof parsed.rewritten === 'string' && parsed.rewritten.trim()) {
          alternatives = [parsed.rewritten]
        }
      } catch (err: any) {
        clearTimeout(timeoutId)
        openaiError = err?.message || 'OpenAI failed'
        console.error('OpenAI rewrite-bullet failed:', openaiError)
      }
    }

    // Fallback to local Claude CLI if OpenAI failed/skipped and fallback is enabled.
    if (alternatives.length === 0 && isLocalClaudeFallbackEnabled()) {
      try {
        const fallbackPrompt = `${systemPrompt}\n\n${userPrompt}`
        alternatives = await runLocalClaudeAlternatives(fallbackPrompt, { timeoutMs: 60_000 })
        console.log(`[local-claude-fallback] returned ${alternatives.length} alternatives`)
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

    return NextResponse.json({
      success: true,
      alternatives,
      rewritten: alternatives[0],
    })
  } catch (error: any) {
    console.error('Rewrite bullet error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
