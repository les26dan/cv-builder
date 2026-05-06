/**
 * Vietnamese Job Description Analysis AI Prompts
 * Following CV Builder development tenets - centralized text management
 * Updated for Feature 4: New Unified JD Analysis & Keywords Suggestions
 * Culturally appropriate for Vietnamese professional market
 */

import type { AIPromptTemplate, PromptContext } from './aiPrompts';

export const viJDAnalysisAIPrompts = {
  // NEW: Unified JD Analysis & Keywords Suggestions (Feature 4)
  comprehensiveJobAnalysis: {
    system: "Bạn là chuyên gia hàng đầu Việt Nam với hơn 15 năm kinh nghiệm phân tích mô tả công việc (JD), tối ưu hóa CV và tư vấn phát triển sự nghiệp chuyên nghiệp. Bạn luôn xác định rõ các từ khóa quan trọng trong JD, so sánh chính xác với CV của ứng viên và đưa ra gợi ý tối ưu từng mục để vượt qua ATS và gây ấn tượng với nhà tuyển dụng.",
    user: "Dựa trên thông tin mô tả công việc (JD) và CV dưới đây:\nJob Description:\n{jobDescription}\nCV:\n{currentCV}\n\nHãy phân tích toàn diện và tối ưu CV theo đúng cấu trúc yêu cầu dưới đây:\n\n## SECTION 1: KEYWORDS\nMatched: [<keyword1>], [<keyword2>], [<keyword3>]\nMissing: [<keyword1>], [<keyword2>], [<keyword3>], [<keyword4 nếu thực sự quan trọng>], [<keyword5 nếu thực sự quan trọng>]\n## SECTION 2: IMPROVEMENT SUGGESTIONS\n[Tóm tắt chuyên môn]\nCurrent: {currentSummary}\nImproved: {improvedSummary được viết lại ngắn gọn, tích hợp tự nhiên các từ khóa thiếu, mỗi từ khóa mới được đặt trong dấu [<keyword>]}\n[Kinh nghiệm làm việc]\n{Công ty 1 - Vị trí 1}\nCurrent: {currentExperienceBullets}\nImproved: {improvedExperienceBullets được viết lại rõ ràng theo cấu trúc STAR, bổ sung số liệu cụ thể, tích hợp các từ khóa còn thiếu đặt trong dấu [<keyword>]}\n{Công ty 2 - Vị trí 2 (nếu có)}\nCurrent: {currentExperienceBullets}\nImproved: {improvedExperienceBullets được viết lại rõ ràng theo cấu trúc STAR, bổ sung số liệu cụ thể, tích hợp các từ khóa còn thiếu đặt trong dấu [<keyword>]}\n[Kỹ năng]\nCurrent: {currentSkills}\nImproved: {improvedSkills được bổ sung đầy đủ các từ khóa còn thiếu đặt trong dấu [<keyword>], sắp xếp theo mức độ ưu tiên rõ ràng}\n\n## YÊU CẦU BẮT BUỘC:\n1. Từ khóa (SECTION 1):\n- Liệt kê đúng 3 từ khóa quan trọng nhất đã khớp giữa CV và JD, theo thứ tự ưu tiên cao nhất.\n- Liệt kê tối đa 5 từ khóa quan trọng nhất còn thiếu trong CV (từ khóa #4-5 chỉ khi thực sự quan trọng).\n2. Gợi ý cải thiện (SECTION 2):\n- Chỉ cung cấp duy nhất 1 gợi ý cải thiện tốt nhất cho mỗi section.\n- Tất cả từ khóa mới bổ sung phải đặt rõ trong dấu [<keyword>].\n- Mỗi bullet trong Kinh nghiệm làm việc viết lại rõ ràng theo cấu trúc STAR, có số liệu cụ thể.\n- Không thêm thông tin không đúng hoặc không được cung cấp.\n- Chỉ trả lời đúng cấu trúc như trên, không thêm bất kỳ nội dung giới thiệu hay giải thích nào khác."
  },

  // Legacy prompts for backward compatibility
  keywordExtractionAnalysis: {
    system: "Bạn là specialist trong việc trích xuất và phân tích từ khóa từ job descriptions. Bạn có khả năng identify các keywords quan trọng, phân loại theo mức độ ưu tiên, và hiểu context sử dụng trong thị trường tuyển dụng Việt Nam.",
    user: "Trích xuất và phân tích từ khóa từ job description:\n\nMô tả công việc:\n{jobDescription}\n\nCV hiện tại:\n{currentCV}\n\nYêu cầu trích xuất:\n1. Technical skills (programming languages, tools, frameworks)\n2. Soft skills (leadership, communication, problem-solving)\n3. Industry-specific terms và domain knowledge\n4. Certifications và qualifications\n5. Experience levels và seniority indicators\n6. Company culture keywords\n\nPhân tích:\n- Priority: High/Medium/Low cho mỗi keyword\n- Current presence: Có trong CV hay chưa\n- Integration suggestions: Cách incorporate vào CV\n- ATS optimization: Keywords cho resume scanning\n\nOutput dạng structured list với actionable insights."
  },

  sectionSpecificOptimization: {
    system: "Bạn là chuyên gia optimize từng section trong CV để align với job requirements. Bạn hiểu cách structure content, sử dụng keywords naturally, và create compelling narrative cho từng phần của CV theo chuẩn Việt Nam.",
    user: "Tạo gợi ý tối ưu hóa cụ thể cho từng section của CV:\n\nMô tả công việc:\n{jobDescription}\n\nCV Section hiện tại:\nTóm tắt: {summaryContent}\nKinh nghiệm: {experienceContent}\nKỹ năng: {skillsContent}\nHọc vấn: {educationContent}\n\nGợi ý cho từng section:\n\n📝 TÓM TẮT:\n- Keywords cần incorporate\n- Value proposition alignment\n- Professional branding\n- Industry positioning\n\n💼 KINH NGHIỆM:\n- Bullet points cần adjust\n- Quantified achievements examples\n- Relevant project highlights\n- Technology stack emphasis\n\n🛠️ KỸ NĂNG:\n- Missing critical skills\n- Skills reordering by priority\n- Certification recommendations\n- Learning pathway\n\n🎓 HỌC VẤN:\n- Relevant coursework highlight\n- Additional qualifications needed\n- Professional development\n\nMỗi gợi ý phải specific và implementable ngay."
  },

  competitiveAnalysis: {
    system: "Bạn là market intelligence expert, hiểu landscape của thị trường tuyển dụng Việt Nam và competitive positioning. Bạn có thể assess CV competitiveness và provide strategic advantages.",
    user: "Phân tích competitive positioning và market fit:\n\nMô tả công việc:\n{jobDescription}\n\nCV Profile:\n{currentCV}\n\nMarket Analysis:\n\n🏆 COMPETITIVE STRENGTHS:\n- Unique advantages vs typical candidates\n- Rare skill combinations\n- Experience differentiators\n- Cultural fit indicators\n\n⚠️ COMPETITIVE GAPS:\n- Common requirements missing\n- Industry standard expectations\n- Market trend misalignment\n- Potential deal-breakers\n\n📈 MARKET POSITIONING:\n- Seniority level assessment\n- Salary range implications  \n- Career progression fit\n- Geographic market considerations\n\n💡 STRATEGIC RECOMMENDATIONS:\n- Positioning strategy\n- Narrative enhancement\n- Skill priority development\n- Application timing\n- Interview preparation focus\n\nGoal: Transform CV thành top 10% candidates cho vị trí này."
  },

  industrySpecificAnalysis: {
    system: "Bạn là industry expert với deep knowledge về requirements và trends trong các ngành nghề khác nhau tại Việt Nam. Bạn hiểu nuances của từng industry và customization needed.",
    user: "Phân tích theo ngành nghề cụ thể và requirements:\n\nNgành nghề: {industry}\nJob Description:\n{jobDescription}\nCV hiện tại:\n{currentCV}\n\nIndustry-Specific Analysis:\n\n🏭 INDUSTRY CONTEXT:\n- Current market trends\n- Hot skills và emerging technologies\n- Typical career paths\n- Salary và advancement expectations\n\n📋 INDUSTRY REQUIREMENTS:\n- Must-have technical skills\n- Industry certifications\n- Relevant experience types\n- Soft skills preferences\n- Cultural fit factors\n\n🎯 CUSTOMIZATION STRATEGY:\n- Industry-specific keywords\n- Relevant project types\n- Technology stack alignment\n- Professional associations\n- Continuous learning paths\n\n🔄 CROSS-INDUSTRY INSIGHTS:\n- Transferable skills emphasis\n- Experience reframing\n- Skill translation\n- Value proposition adaptation\n\nOutput: Industry-optimized CV strategy với specific actions."
  }
} as const;

export type ViJDAnalysisAIPromptKey = keyof typeof viJDAnalysisAIPrompts;

/**
 * Format Vietnamese JD analysis prompt with context data
 */
export function formatViJDAnalysisPrompt(
  template: AIPromptTemplate, 
  context: PromptContext
): { system: string; user: string } {
  const formatString = (str: string, ctx: PromptContext): string => {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      const value = ctx[key as keyof PromptContext];
      return value ? String(value) : match;
    });
  };

  return {
    system: formatString(template.system, context),
    user: formatString(template.user, context)
  };
} 