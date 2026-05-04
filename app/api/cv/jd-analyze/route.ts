import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function cvDataToText(cvData: any): string {
  const parts: string[] = []
  const c = cvData.contact || {}
  parts.push(`=== THÔNG TIN LIÊN HỆ ===`)
  parts.push(`Họ tên: ${c.fullName || ''}`)

  parts.push(`\n=== TÓM TẮT CHUYÊN MÔN ===`)
  parts.push(cvData.summary?.content || '[Chưa có]')

  const exp = cvData.experience?.items || []
  parts.push(`\n=== KINH NGHIỆM LÀM VIỆC (${exp.length} mục) ===`)
  exp.forEach((item: any, i: number) => {
    parts.push(`[${i + 1}] ${item.title || ''} tại ${item.company || ''} (${item.startDate || ''} - ${item.current ? 'Hiện tại' : item.endDate || ''})`)
    const bullets = (item.bullets || []).filter((b: string) => b?.trim())
    bullets.forEach((b: string) => parts.push(`  - ${b}`))
  })

  const skills = cvData.skills?.items || []
  const skillNames = skills.map((s: any) => typeof s === 'string' ? s : s?.name || '').filter(Boolean)
  parts.push(`\n=== KỸ NĂNG (${skillNames.length}) ===`)
  parts.push(skillNames.join(', ') || '[Chưa có]')

  const edu = cvData.education?.items || []
  parts.push(`\n=== HỌC VẤN (${edu.length} mục) ===`)
  edu.forEach((item: any, i: number) => {
    parts.push(`[${i + 1}] ${item.degree || ''} - ${item.institution || ''} (${item.graduationDate || ''})`)
  })

  return parts.join('\n')
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

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
        max_tokens: 3000,
        temperature: 0.3,
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
    return data.choices?.[0]?.message?.content || ''
  } finally {
    clearTimeout(timeoutId)
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction from JD text
  const stopWords = new Set(['và', 'hoặc', 'của', 'để', 'với', 'trong', 'các', 'có', 'là', 'được', 'cho', 'về', 'từ', 'the', 'and', 'or', 'of', 'to', 'with', 'in', 'for', 'a', 'an', 'be', 'is', 'are', 'will', 'have', 'has'])
  const words = text.toLowerCase().match(/\b[a-zA-ZÀ-ỹ][a-zA-ZÀ-ỹ+#.]{2,}\b/g) || []
  const freq: Record<string, number> = {}
  for (const w of words) {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([w]) => w)
}

function generateFallback(jdText: string, cvData: any) {
  const jdKeywords = extractKeywords(jdText)
  const cvText = cvDataToText(cvData).toLowerCase()
  const matchedKeywords = jdKeywords.filter(kw => cvText.includes(kw))
  const missingKeywords = jdKeywords.filter(kw => !cvText.includes(kw))
  const score = Math.round((matchedKeywords.length / Math.max(jdKeywords.length, 1)) * 100)

  return {
    analysisId: `fallback-${Date.now()}`,
    jobMatch: {
      overallScore: score,
      matchedKeywords,
      missingKeywords: missingKeywords.slice(0, 10),
      strengthAreas: [],
      improvementAreas: missingKeywords.slice(0, 3).map(kw => `Bổ sung từ khóa: ${kw}`)
    },
    suggestions: {
      skills: missingKeywords.length > 0 ? [{
        id: 'fallback-skills-1',
        type: 'optimization',
        title: 'Bổ sung từ khóa kỹ năng',
        description: `JD yêu cầu các kỹ năng chưa có trong CV: ${missingKeywords.slice(0, 5).join(', ')}`,
        priority: 'high' as const,
        addedKeywords: missingKeywords.slice(0, 5),
        confidence: 60,
        reasoning: 'Các từ khóa này xuất hiện trong JD nhưng không có trong CV'
      }] : []
    },
    globalRecommendations: [
      'Thêm các từ khóa từ JD vào CV để tăng tỉ lệ ATS',
      'Điều chỉnh phần tóm tắt để phù hợp với yêu cầu vị trí'
    ]
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jdText, cvData, language = 'vi' } = body

    if (!jdText?.trim()) {
      return NextResponse.json({ success: false, error: 'Missing jdText' }, { status: 400 })
    }
    if (!cvData) {
      return NextResponse.json({ success: false, error: 'Missing cvData' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ success: true, data: generateFallback(jdText, cvData), source: 'fallback' })
    }

    const cvText = cvDataToText(cvData)

    const systemPrompt = language === 'vi'
      ? `Bạn là chuyên gia HR Việt Nam với 15 năm kinh nghiệm tuyển dụng và tối ưu hóa CV.
Nhiệm vụ: So sánh mô tả công việc (JD) với CV của ứng viên, đưa ra phân tích chi tiết và gợi ý cụ thể để tối ưu CV.
Trả về JSON hợp lệ, phản hồi bằng tiếng Việt.`
      : `You are an experienced HR professional with 15 years of recruiting experience.
Task: Compare the job description (JD) with the candidate's CV, provide detailed analysis and specific suggestions to optimize the CV.
Return valid JSON.`

    const userPrompt = `=== MÔ TẢ CÔNG VIỆC (JD) ===
${jdText}

=== CV ỨNG VIÊN ===
${cvText}

Phân tích và trả về JSON với cấu trúc chính xác sau:
{
  "analysisId": "<unique-id>",
  "jobMatch": {
    "overallScore": <0-100, điểm phù hợp tổng thể>,
    "matchedKeywords": ["<từ khóa có trong cả JD và CV>"],
    "missingKeywords": ["<từ khóa quan trọng trong JD nhưng thiếu trong CV>"],
    "strengthAreas": ["<điểm mạnh của CV so với JD>"],
    "improvementAreas": ["<lĩnh vực cần cải thiện>"]
  },
  "suggestions": {
    "summary": [
      {
        "id": "sum-1",
        "type": "optimization",
        "title": "<tiêu đề gợi ý ngắn gọn>",
        "description": "<mô tả chi tiết cần làm gì>",
        "priority": "<high|medium|low>",
        "suggestedText": "<nội dung đề xuất cụ thể nếu có>",
        "originalText": "<nội dung gốc nếu có>",
        "addedKeywords": ["<từ khóa được thêm>"],
        "confidence": <0-100>,
        "reasoning": "<lý do gợi ý này quan trọng>"
      }
    ],
    "experience": [
      {
        "id": "exp-1",
        "type": "optimization",
        "title": "<tiêu đề>",
        "description": "<mô tả>",
        "priority": "<high|medium|low>",
        "suggestedText": "<nội dung đề xuất>",
        "addedKeywords": [],
        "confidence": <0-100>,
        "reasoning": "<lý do>"
      }
    ],
    "skills": [
      {
        "id": "ski-1",
        "type": "optimization",
        "title": "<tiêu đề>",
        "description": "<mô tả>",
        "priority": "<high|medium|low>",
        "addedKeywords": ["<kỹ năng cần thêm>"],
        "confidence": <0-100>,
        "reasoning": "<lý do>"
      }
    ],
    "education": []
  },
  "globalRecommendations": [
    "<khuyến nghị tổng thể 1>",
    "<khuyến nghị tổng thể 2>",
    "<khuyến nghị tổng thể 3>"
  ]
}

Lưu ý:
- Chỉ thêm gợi ý khi có giá trị thực sự, mỗi section tối đa 3 gợi ý
- Nếu một section không cần cải thiện, để mảng rỗng []
- analysisId dùng format: "ai-<timestamp>" ví dụ "ai-1712345678"`

    try {
      const aiResponse = await callOpenAI(systemPrompt, userPrompt)
      const parsed = JSON.parse(aiResponse)

      // Ensure analysisId exists
      if (!parsed.analysisId) {
        parsed.analysisId = `ai-${Date.now()}`
      }

      // Ensure required structure exists
      if (!parsed.jobMatch) parsed.jobMatch = { overallScore: 0, matchedKeywords: [], missingKeywords: [], strengthAreas: [], improvementAreas: [] }
      if (!parsed.suggestions) parsed.suggestions = {}
      if (!parsed.globalRecommendations) parsed.globalRecommendations = []

      return NextResponse.json({ success: true, data: parsed, source: 'ai' })
    } catch {
      return NextResponse.json({ success: true, data: generateFallback(jdText, cvData), source: 'fallback' })
    }
  } catch (error: any) {
    console.error('JD analyze error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
