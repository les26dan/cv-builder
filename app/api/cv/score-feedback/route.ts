import { NextRequest, NextResponse } from 'next/server'
import type { SectionFeedback, CVFeedbackResult } from '../../../../types/cvFeedback'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function cvDataToText(cvData: any): string {
  const parts: string[] = []
  const c = cvData.contact || {}
  parts.push(`=== THÔNG TIN LIÊN HỆ ===`)
  parts.push(`Họ tên: ${c.fullName || ''}`)
  parts.push(`Email: ${c.email || ''}`)
  parts.push(`Điện thoại: ${c.phone || ''}`)
  parts.push(`Địa chỉ: ${c.location || ''}`)
  parts.push(`LinkedIn: ${c.linkedin || ''}`)

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
        max_tokens: 2000,
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

function generateFallbackFeedback(cvData: any): CVFeedbackResult {
  const contact = cvData.contact || {}
  const hasName = !!(contact.fullName?.trim())
  const hasEmail = !!(contact.email?.trim())
  const hasPhone = !!(contact.phone?.trim())
  const hasLocation = !!(contact.location?.trim())
  const hasLinkedIn = !!(contact.linkedin?.trim())
  const summary = cvData.summary?.content || ''
  const wordCount = summary.trim().split(/\s+/).filter(Boolean).length
  const exp = (cvData.experience?.items || []).filter((e: any) => e.title?.trim() && e.company?.trim())
  const skills = (cvData.skills?.items || []).filter((s: any) => typeof s === 'string' ? s.trim() : s?.name?.trim())
  const edu = (cvData.education?.items || []).filter((e: any) => e.degree?.trim() || e.institution?.trim())

  const contactScore = ([hasName, hasEmail, hasPhone, hasLocation, hasLinkedIn].filter(Boolean).length / 5) * 100
  const summaryScore = wordCount === 0 ? 0 : wordCount < 10 ? 30 : wordCount >= 50 && wordCount <= 150 ? 90 : 70
  const expScore = exp.length === 0 ? 0 : Math.min(90, 50 + exp.length * 15)
  const skillsScore = skills.length === 0 ? 0 : skills.length >= 8 ? 90 : skills.length >= 5 ? 75 : skills.length >= 3 ? 60 : 40
  const eduScore = edu.length === 0 ? 0 : 75
  const overall = Math.round((contactScore + summaryScore + expScore + skillsScore + eduScore) / 5)

  return {
    overallScore: overall,
    overallGrade: getGrade(overall),
    overallSummary: overall >= 70
      ? 'CV có nền tảng tốt, cần cải thiện thêm để nổi bật hơn.'
      : 'CV cần bổ sung nhiều thông tin hơn để tạo ấn tượng với nhà tuyển dụng.',
    sections: {
      contact: {
        score: Math.round(contactScore), grade: getGrade(contactScore),
        strengths: [hasName && 'Có đầy đủ tên', hasEmail && 'Có email liên hệ', hasPhone && 'Có số điện thoại'].filter(Boolean) as string[],
        improvements: [!hasLinkedIn && 'Thêm LinkedIn để tăng độ tin cậy', !hasLocation && 'Thêm địa điểm làm việc'].filter(Boolean) as string[],
        quickFix: !hasLinkedIn ? 'Thêm URL LinkedIn profile' : !hasLocation ? 'Thêm thành phố / địa điểm' : undefined,
      },
      summary: {
        score: Math.round(summaryScore), grade: getGrade(summaryScore),
        strengths: wordCount >= 50 ? ['Độ dài tóm tắt phù hợp (50-150 từ)'] : wordCount >= 30 ? ['Có phần tóm tắt chuyên môn'] : [],
        improvements: wordCount === 0
          ? ['Chưa có phần tóm tắt — đây là phần đầu tiên nhà tuyển dụng đọc']
          : wordCount < 50 ? ['Tóm tắt quá ngắn, nên viết 50-150 từ', 'Nêu rõ số năm kinh nghiệm, kỹ năng nổi bật, mục tiêu']
          : wordCount > 150 ? ['Tóm tắt quá dài, nên rút gọn còn 50-150 từ'] : [],
        quickFix: wordCount === 0 ? 'Viết 3-4 câu tóm tắt kinh nghiệm và thế mạnh' : undefined,
      },
      experience: {
        score: Math.round(expScore), grade: getGrade(expScore),
        strengths: exp.length >= 2 ? [`Có ${exp.length} mục kinh nghiệm làm việc`] : exp.length === 1 ? ['Có kinh nghiệm làm việc'] : [],
        improvements: exp.length === 0
          ? ['Chưa có kinh nghiệm — đây là phần quan trọng nhất của CV']
          : exp.some((e: any) => !(e.bullets || []).filter((b: string) => b?.trim()).length)
          ? ['Một số vị trí chưa có mô tả công việc', 'Mỗi vị trí nên có 3-5 bullet points với số liệu cụ thể']
          : ['Thêm số liệu định lượng vào bullet points (%, con số, quy mô)'],
        quickFix: exp.length === 0 ? 'Thêm ít nhất 1 kinh nghiệm làm việc' : 'Dùng nút "AI Viết lại" tại mỗi bullet để cải thiện',
      },
      skills: {
        score: Math.round(skillsScore), grade: getGrade(skillsScore),
        strengths: skills.length >= 8 ? [`${skills.length} kỹ năng — đa dạng và đầy đủ`] : skills.length >= 5 ? [`Có ${skills.length} kỹ năng`] : [],
        improvements: skills.length < 8
          ? [`Nên có 8-15 kỹ năng (hiện có ${skills.length})`, 'Bổ sung cả kỹ năng kỹ thuật lẫn kỹ năng mềm']
          : ['Cân nhắc phân loại kỹ năng theo nhóm (Frontend, Backend, Tools...)'],
        quickFix: skills.length < 5 ? 'Thêm ít nhất 5 kỹ năng nữa' : undefined,
      },
      education: {
        score: Math.round(eduScore), grade: getGrade(eduScore),
        strengths: edu.length > 0 ? ['Có thông tin học vấn'] : [],
        improvements: edu.length === 0
          ? ['Chưa có thông tin học vấn']
          : ['Thêm GPA nếu >= 3.2/4.0', 'Thêm các chứng chỉ, khóa học liên quan'],
        quickFix: edu.length === 0 ? 'Thêm trường, ngành học và năm tốt nghiệp' : undefined,
      },
    },
    topPriorities: [
      exp.length === 0 && 'Thêm kinh nghiệm làm việc',
      wordCount < 30 && 'Viết phần tóm tắt chuyên môn',
      skills.length < 5 && 'Bổ sung thêm kỹ năng',
      !hasLinkedIn && 'Thêm LinkedIn profile',
    ].filter(Boolean).slice(0, 3) as string[],
    atsScore: Math.round(overall * 0.9),
    atsTips: [
      'Dùng từ khóa từ mô tả công việc (JD) trong CV',
      'Tránh bảng biểu, hình ảnh — ATS không đọc được',
      'Dùng định dạng đơn giản, font chữ chuẩn',
    ],
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cvData } = body

    if (!cvData) {
      return NextResponse.json({ success: false, error: 'Missing cvData' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ success: true, data: generateFallbackFeedback(cvData), source: 'fallback' })
    }

    const cvText = cvDataToText(cvData)

    const systemPrompt = `Bạn là chuyên gia HR Việt Nam với 15 năm kinh nghiệm tuyển dụng.
Chấm điểm CV và đưa ra feedback cấu trúc tổng thể — KHÔNG sửa từng câu cụ thể.
Tập trung vào: độ đầy đủ thông tin, cấu trúc, những phần còn thiếu hoặc cần bổ sung.
Trả về JSON hợp lệ, phản hồi bằng tiếng Việt.`

    const userPrompt = `Phân tích CV sau và trả về JSON:

${cvText}

Trả về JSON với cấu trúc:
{
  "overallScore": <0-100>,
  "overallGrade": <"A"|"B"|"C"|"D"|"F">,
  "overallSummary": "<nhận xét tổng thể 1-2 câu về cấu trúc và độ đầy đủ>",
  "sections": {
    "contact": {
      "score": <0-100>,
      "grade": "<A-F>",
      "strengths": ["<điểm mạnh về thông tin liên hệ>"],
      "improvements": ["<thiếu thông tin gì, nên bổ sung gì>"],
      "quickFix": "<việc cần làm ngay hoặc null>"
    },
    "summary": {
      "score": <0-100>, "grade": "<A-F>",
      "strengths": ["<điểm mạnh>"],
      "improvements": ["<nên bổ sung/cải thiện gì về cấu trúc, nội dung tổng thể>"],
      "quickFix": "<...>"
    },
    "experience": {
      "score": <0-100>, "grade": "<A-F>",
      "strengths": ["<điểm mạnh>"],
      "improvements": ["<thiếu gì, nên bổ sung phần nào, cấu trúc có ổn không>"],
      "quickFix": "<...>"
    },
    "skills": {
      "score": <0-100>, "grade": "<A-F>",
      "strengths": ["<điểm mạnh>"],
      "improvements": ["<nên thêm kỹ năng gì, có thiếu nhóm nào không>"],
      "quickFix": "<...>"
    },
    "education": {
      "score": <0-100>, "grade": "<A-F>",
      "strengths": ["<điểm mạnh>"],
      "improvements": ["<nên bổ sung gì>"],
      "quickFix": "<...>"
    }
  },
  "topPriorities": ["<ưu tiên 1>", "<ưu tiên 2>", "<ưu tiên 3>"],
  "atsScore": <0-100>,
  "atsTips": ["<tip ATS 1>", "<tip ATS 2>", "<tip ATS 3>"]
}`

    try {
      const aiResponse = await callOpenAI(systemPrompt, userPrompt)
      const parsed = JSON.parse(aiResponse) as CVFeedbackResult
      return NextResponse.json({ success: true, data: parsed, source: 'ai' })
    } catch {
      return NextResponse.json({ success: true, data: generateFallbackFeedback(cvData), source: 'fallback' })
    }
  } catch (error: any) {
    console.error('CV score-feedback error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
