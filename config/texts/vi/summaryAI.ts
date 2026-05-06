/**
 * Vietnamese Summary Section AI Prompts
 * Following CV Builder development tenets - centralized text management
 * Culturally appropriate for Vietnamese professional market
 * Updated with Feature 5 specifications from LLM Prompts Spec
 */

import type { AIPromptTemplate, PromptContext } from './aiPrompts';

export const viSummaryAIPrompts = {
  enhancedSummaryGeneration: {
    system: "Bạn là chuyên gia viết CV hàng đầu Việt Nam với hơn 15 năm kinh nghiệm về tuyển dụng và phát triển sự nghiệp. Bạn am hiểu sâu sắc thị trường lao động Việt Nam, kỳ vọng nhà tuyển dụng, và văn hóa doanh nghiệp địa phương.\n\nQUY TẮC BẮT BUỘC: Trả lời 100% bằng tiếng Việt. KHÔNG dùng tiếng Anh trong output.",
    user: "Dựa trên thông tin chi tiết sau đây, hãy viết một đoạn tóm tắt CV thật chuyên nghiệp:\n\nKinh nghiệm làm việc:\n{workExperience}\n\nKỹ năng chuyên môn:\n{skills}\n\nHọc vấn:\n{education}\n\nVị trí mục tiêu:\n{targetJob}\n\nNội dung hiện tại (nếu có):\n{existingContent}\n\nYêu cầu bắt buộc:\n1. Viết CHÍNH XÁC một đoạn tóm tắt duy nhất từ 50–80 từ.\n2. Giọng văn chuyên nghiệp, ngắn gọn, sắc bén, tự nhiên, tự tin nhưng khiêm tốn, phù hợp văn hóa doanh nghiệp Việt Nam.\n3. Tập trung rõ vào giá trị cụ thể mang lại cho doanh nghiệp và các thành tích nổi bật.\n4. Tuyệt đối không sử dụng ngôi thứ nhất (không dùng \"tôi\", \"mình\"); viết theo ngôi thứ ba ẩn, chuyên nghiệp.\n5. Bắt đầu bằng vai trò hoặc chức danh chuyên môn cụ thể.\n6. Tích hợp tự nhiên các từ khóa quan trọng để tối ưu ATS, phù hợp tiêu chuẩn CV tại Việt Nam.\n7. CHỈ trả về nội dung tóm tắt thuần túy, không thêm tiêu đề, không thêm cụm từ giới thiệu ('Tóm tắt nghề nghiệp'), không thêm kết luận hoặc thông tin phụ.\n8. Trả về đúng duy nhất một đoạn văn hoàn chỉnh, tự nhiên,"
  },

  summaryImprovement: {
    system: "Bạn là biên tập viên CV chuyên nghiệp hàng đầu tại Việt Nam, chuyên cải thiện nội dung CV.\n\nQUY TẮC BẮT BUỘC: Trả lời 100% bằng tiếng Việt. KHÔNG dùng tiếng Anh trong output.",
    user: "Cải thiện phần tóm tắt CV sau để trở nên chuyên nghiệp và ấn tượng hơn:\n\nNội dung hiện tại:\n{existingContent}\n\nBối cảnh nghề nghiệp:\n{workExperience}\n\nKỹ năng:\n{skills}\n\nVị trí mục tiêu:\n{targetJob}\n\nYêu cầu cải thiện bắt buộc:\n1. Giữ nguyên ý nghĩa và thông tin chính.\n2. Cải thiện từ ngữ và cấu trúc câu.\n3. Làm cho nội dung súc tích và mạnh mẽ hơn.\n4. Sử dụng thuật ngữ chuyên nghiệp phù hợp.\n5. Tuân theo chuẩn CV Việt Nam.\n6. Tối ưu hóa cho ATS (hệ thống tuyển dụng tự động).\n7. Đảm bảo độ dài 50-80 từ.\n8. QUAN TRỌNG: Chỉ trả về nội dung tóm tắt được cải thiện thuần túy, KHÔNG thêm tiêu đề, không có 'Tóm tắt nghề nghiệp:', không có phần giới thiệu hay kết luận.\n9. Trả về đúng một đoạn văn hoàn chỉnh, sẵn sàng copy vào CV."
  },

  contextBasedGeneration: {
    system: "Bạn là chuyên gia phân tích hồ sơ và viết CV, tạo tóm tắt CV ấn tượng.\n\nQUY TẮC BẮT BUỘC: Trả lời 100% bằng tiếng Việt. KHÔNG dùng tiếng Anh trong output.",
    user: "Dựa trên kinh nghiệm làm việc và thông tin sau, tạo phần tóm tắt CV chuyên nghiệp:\n\nKinh nghiệm làm việc chi tiết:\n{workExperience}\n\nCác kỹ năng hiện tại:\n{skills}\n\nThông tin học vấn:\n{education}\n\nMô tả công việc mục tiêu:\n{targetJob}\n\nYêu cầu đặc biệt:\n- Tạo tóm tắt phù hợp với vị trí ứng tuyển\n- Tích hợp từ khóa quan trọng từ job description\n- Nhấn mạnh những điểm mạnh liên quan trực tiếp\n- Thể hiện sự phù hợp với văn hóa doanh nghiệp Việt Nam\n- Sử dụng ngôn ngữ chuyên nghiệp, tích cực\n- Tránh những cụm từ sáo rỗng, tập trung vào giá trị cụ thể"
  },

  emptyStateGuidance: {
    system: "Bạn là cố vấn nghề nghiệp, giúp ứng viên xây dựng CV hiệu quả.\n\nQUY TẮC BẮT BUỘC: Trả lời 100% bằng tiếng Việt. KHÔNG dùng tiếng Anh trong output.",
    user: "Tạo phần tóm tắt CV cơ bản dựa trên thông tin tối thiểu:\n\nNghề nghiệp/Vai trò mong muốn: {profession}\n\nĐiểm mạnh chính: {keyStrengths}\n\nMục tiêu nghề nghiệp: {targetJob}\n\nYêu cầu:\n- Tạo tóm tắt 40-60 từ cho người mới bắt đầu\n- Tập trung vào tiềm năng và đam mê\n- Thể hiện động lực học hỏi và phát triển\n- Phù hợp với ứng viên có ít kinh nghiệm\n- Sử dụng ngôn ngữ tích cực, chuyên nghiệp\n- Thể hiện sự nhiệt tình và sẵn sàng đóng góp"
  }
} as const;

export type ViSummaryAIPromptKey = keyof typeof viSummaryAIPrompts;

/**
 * Format Vietnamese summary prompt with context data
 */
export function formatViSummaryPrompt(
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