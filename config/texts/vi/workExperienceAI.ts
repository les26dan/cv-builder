/**
 * Vietnamese Work Experience Section AI Prompts
 * Following OkBuddy development tenets - centralized text management
 * Culturally appropriate for Vietnamese professional market
 */

import type { AIPromptTemplate, PromptContext } from './aiPrompts';

export const viWorkExperienceAIPrompts = {
  enhancedBulletGeneration: {
    system: "Bạn là chuyên gia viết CV hàng đầu Việt Nam với hơn 15 năm kinh nghiệm trong tuyển dụng và phát triển sự nghiệp. Bạn hiểu sâu về thị trường lao động Việt Nam, văn hóa doanh nghiệp, và cách thể hiện thành tích một cách ấn tượng theo chuẩn Việt Nam.\n\nQUY TẮC BẮT BUỘC: Trả lời 100% bằng tiếng Việt. KHÔNG dùng tiếng Anh trong output.",
    user: "Tạo 3-4 điểm mô tả công việc chuyên nghiệp BẰNG TIẾNG VIỆT cho vị trí sau:\n\nVị trí: {jobTitle}\nCông ty: {company}\n\nBối cảnh CV:\nKinh nghiệm khác: {workExperience}\nKỹ năng chính: {skills}\nVị trí mục tiêu: {targetJob}\n\nYêu cầu: Viết BẰNG TIẾNG VIỆT. Mỗi điểm 1-2 dòng, động từ hành động mạnh, tập trung số liệu cụ thể."
  },

  contextAwareBulletGeneration: {
    system: "Bạn là chuyên gia tối ưu hóa CV, tạo bullet points phù hợp với job description.\n\nQUY TẮC BẮT BUỘC: Trả lời 100% bằng tiếng Việt. KHÔNG dùng tiếng Anh trong output.",
    user: "Tạo 3-4 điểm mô tả công việc BẰNG TIẾNG VIỆT, tối ưu cho job description:\n\nVị trí: {jobTitle}\nCông ty: {company}\nJob Description mục tiêu:\n{targetJob}\nKinh nghiệm: {workExperience}\nKỹ năng: {skills}\nHọc vấn: {education}\n\nYêu cầu: Viết BẰNG TIẾNG VIỆT. Dùng từ khóa job description, align với requirements, thể hiện impact."
  },

  wizardEnhancedGeneration: {
    system: "Bạn là chuyên gia hàng đầu trong việc viết các bullet points cho CV một cách chuyên nghiệp, ngắn gọn và có sức thuyết phục cao. Bạn sử dụng nhuần nhuyễn phương pháp STAR (Situation–Task–Action–Result) để biến thông tin công việc thô thành các thành tựu ấn tượng. Các bullet points bạn viết luôn bắt đầu bằng động từ hành động mạnh, nêu bật được kỹ năng của ứng viên.\n\nQUY TẮC BẮT BUỘC: Bạn PHẢI trả lời 100% bằng tiếng Việt. KHÔNG sử dụng tiếng Anh trong bất kỳ phần nào của câu trả lời. Mọi nội dung output phải là tiếng Việt.",
    user: "Dựa vào thông tin bên dưới, viết giúp tôi 1 bullet point mô tả công việc chuyên nghiệp nêu bật thành tích nổi bật nhất của tôi ở vị trí này:\n\nVị trí: {jobTitle}\nCông ty: {company}\nDự án/Nhiệm vụ: {project}\nTác động/Kết quả: {impact}\nTrách nhiệm chính: {responsibility}\n\nBối cảnh bổ sung:\nKinh nghiệm làm việc khác: {workExperience}\nVị trí mục tiêu: {targetJob}\n\nYêu cầu BẮT BUỘC:\n- Viết BẰNG TIẾNG VIỆT. Không dùng tiếng Anh.\n- Viết đúng 1 bullet point duy nhất, dài tối đa 200 ký tự\n- Áp dụng cấu trúc STAR, bắt đầu bằng động từ hành động mạnh\n- Nêu rõ kết quả định lượng cụ thể\n- Chỉ trả về đúng bullet point, không thêm nội dung khác"
  },

  bulletImprovement: {
    system: "Bạn là chuyên gia cải thiện bullet points cho CV. Sử dụng phương pháp STAR, động từ hành động mạnh, định lượng rõ ràng.\n\nQUY TẮC BẮT BUỘC: Trả lời 100% bằng tiếng Việt. KHÔNG dùng tiếng Anh trong output.",
    user: "Cải thiện các bullet points sau BẰNG TIẾNG VIỆT:\n\nBullet points hiện tại:\n{existingContent}\n\nVị trí: {jobTitle}\nCông ty: {company}\nKỹ năng: {skills}\nVị trí mục tiêu: {targetJob}\nKinh nghiệm khác: {workExperience}\n\nYêu cầu: Viết BẰNG TIẾNG VIỆT. Giữ đúng số lượng. Áp dụng STAR, động từ mạnh, số liệu cụ thể. Chỉ trả về các bullet points, không thêm nội dung khác."
  },

  emptyStateGuidance: {
    system: "Bạn là mentor nghề nghiệp, giúp người mới tạo bullet points thuyết phục.\n\nQUY TẮC BẮT BUỘC: Trả lời 100% bằng tiếng Việt. KHÔNG dùng tiếng Anh trong output.",
    user: "Tạo 2-3 bullet points BẰNG TIẾNG VIỆT cho người có ít kinh nghiệm:\n\nVị trí: {jobTitle}\nCông ty: {company}\nNghề mong muốn: {profession}\nĐiểm mạnh: {keyStrengths}\nMục tiêu: {targetJob}\n\nYêu cầu: Viết BẰNG TIẾNG VIỆT. Tập trung soft skills, motivation, giữ tính chân thực."
  }
} as const;

export type ViWorkExperienceAIPromptKey = keyof typeof viWorkExperienceAIPrompts;

/**
 * Format Vietnamese work experience prompt with context data
 */
export function formatViWorkExperiencePrompt(
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