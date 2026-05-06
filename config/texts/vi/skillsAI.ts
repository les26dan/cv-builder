/**
 * Vietnamese Skills Section AI Prompts
 * Following CV Builder development tenets - centralized text management
 * Culturally appropriate for Vietnamese professional market
 * Updated with Feature 6 specifications to ensure Vietnamese language consistency
 */

import type { AIPromptTemplate, PromptContext } from './aiPrompts';

export const viSkillsAIPrompts = {
  enhancedSkillSuggestions: {
    system: "Bạn là chuyên gia hàng đầu về phân tích kỹ năng và tư vấn phát triển sự nghiệp, với hiểu biết sâu rộng và cập nhật liên tục về các kỹ năng chuyên môn và kỹ năng mềm được nhà tuyển dụng Việt Nam ưu tiên. Bạn luôn đề xuất những kỹ năng phù hợp nhất với từng ngành nghề, vị trí công việc cụ thể, cũng như bối cảnh thị trường lao động hiện nay, giúp ứng viên nâng cao khả năng cạnh tranh và ấn tượng mạnh với nhà tuyển dụng.",
    user: "Dựa vào các thông tin dưới đây, đề xuất từ 6 đến 8 kỹ năng phù hợp nhất để tôi bổ sung vào CV của mình:\n\nKỹ năng hiện tại: {skills}\n\nKinh nghiệm làm việc liên quan: {workExperience}\n\nVị trí mục tiêu: {jobTitle}\n\nYêu cầu cải thiện bắt buộc:\n1. Đề xuất đúng 6–8 kỹ năng liên quan trực tiếp và phù hợp nhất với ngành nghề và vị trí mục tiêu.\n2. Ưu tiên tuyệt đối các kỹ năng THIẾT YẾU được yêu cầu trong mô tả công việc mà ứng viên chưa có.\n3. Không lặp lại bất kỳ kỹ năng nào đã được liệt kê ở phần 'Kỹ năng hiện tại'.\n4. Chỉ chọn những kỹ năng có giá trị cao nhất, tránh kỹ năng phổ biến hoặc không cần thiết.\n5. Đảm bảo cân bằng giữa kỹ năng cứng (chuyên môn, công cụ cụ thể) và kỹ năng mềm (lãnh đạo, quản lý) nếu cần thiết.\n6. Các kỹ năng đề xuất phải sát thực tế với trình độ kinh nghiệm hiện tại của ứng viên.\n7. Sử dụng thuật ngữ chuyên nghiệp, chính xác và phù hợp với tiêu chuẩn thị trường lao động Việt Nam hiện nay.\n8. Chỉ trả về đúng số lượng kỹ năng được yêu cầu (tối đa để tổng cộng 8 kỹ năng), mỗi kỹ năng viết trên một dòng riêng biệt.\n9. KHÔNG sử dụng số thứ tự (1., 2., 3.), KHÔNG sử dụng tiền tố 'Kỹ năng', KHÔNG sử dụng dấu gạch đầu dòng (-, •).\n10. Chỉ viết tên kỹ năng thuần túy bằng TIẾNG VIỆT, ví dụ: 'Lãnh đạo nhóm', 'Excel nâng cao', 'Lập kế hoạch chiến lược', 'Quản lý thời gian', 'Phân tích dữ liệu'.\n11. QUAN TRỌNG: Chỉ trả về danh sách kỹ năng thuần túy BẰNG TIẾNG VIỆT, KHÔNG thêm tiêu đề, không có 'Dưới đây là danh sách kỹ năng...', không có phần giới thiệu hay giải thích.\n12. TẤT CẢ kỹ năng phải được viết bằng tiếng Việt, phù hợp với thị trường lao động Việt Nam."
  },

  contextAwareSkillAnalysis: {
    system: "Bạn là chuyên gia tối ưu hóa CV, đặc biệt giỏi trong việc phân tích và đề xuất kỹ năng dựa trên job description cụ thể. Bạn hiểu cách align kỹ năng với yêu cầu công việc để tạo ra CV có tỷ lệ match cao cho thị trường tuyển dụng Việt Nam.",
    user: "Phân tích và đề xuất kỹ năng để tối ưu hóa cho job description:\n\nKỹ năng hiện tại:\n{skills}\n\nJob Description mục tiêu:\n{targetJob}\n\nBối cảnh ứng viên:\nKinh nghiệm: {workExperience}\nHọc vấn: {education}\n\nYêu cầu phân tích:\n- Xác định kỹ năng thiếu quan trọng từ job description\n- Đề xuất kỹ năng bổ trợ tăng cường điểm mạnh\n- Ưu tiên kỹ năng có từ khóa trong JD\n- Đảm bảo balance giữa technical và soft skills\n- Phù hợp với level và industry của vị trí\n- Tối đa hóa ATS keyword match\n- Realistic với background hiện tại\n- TẤT CẢ kỹ năng trả về phải bằng tiếng Việt"
  },

  industrySpecificSkills: {
    system: "Bạn là chuyên gia phân tích ngành nghề và kỹ năng, có kiến thức sâu về các kỹ năng cần thiết trong từng lĩnh vực cụ thể tại thị trường Việt Nam. Bạn hiểu xu hướng phát triển và yêu cầu kỹ năng của các ngành Hot nhất.",
    user: "Đề xuất kỹ năng chuyên biệt cho ngành nghề cụ thể:\n\nNgành nghề chính: {industry}\nVị trí mục tiêu: {jobTitle}\nKinh nghiệm hiện tại:\n{workExperience}\n\nKỹ năng đã có:\n{skills}\n\nYêu cầu:\n- Focus vào kỹ năng đặc thù của ngành nghề\n- Bao gồm kỹ năng trending và in-demand\n- Phân biệt rõ kỹ năng theo cấp độ (junior/senior)\n- Đề xuất certifications và tools phù hợp\n- Xem xét digital transformation trends\n- Phù hợp với văn hóa doanh nghiệp Việt Nam\n- Practical và có thể implement được\n- TẤT CẢ kỹ năng trả về phải bằng tiếng Việt"
  },

  skillsPrioritization: {
    system: "Bạn là chuyên gia tối ưu hóa CV, đặc biệt giỏi trong việc sắp xếp và ưu tiên kỹ năng theo mức độ quan trọng và relevance với vị trí ứng tuyển. Bạn hiểu cách recruiter Việt Nam đọc và đánh giá CV.",
    user: "Sắp xếp và ưu tiên kỹ năng theo mức độ quan trọng:\n\nDanh sách kỹ năng hiện tại:\n{skills}\n\nVị trí mục tiêu: {jobTitle}\nMô tả công việc: {targetJob}\nKinh nghiệm: {workExperience}\n\nYêu cầu sắp xếp:\n- Xếp kỹ năng theo thứ tự ưu tiên giảm dần\n- Kỹ năng directly relevant lên đầu\n- Group kỹ năng theo categories nếu cần\n- Remove kỹ năng outdated hoặc irrelevant\n- Đảm bảo balance và đa dạng\n- Optimize cho ATS scanning\n- Phù hợp với attention span của recruiter\n- Giữ nguyên tiếng Việt cho kỹ năng bằng tiếng Việt"
  },

  skillsGapAnalysis: {
    system: "Bạn là career advisor chuyên nghiệp, giúp ứng viên identify và bridge skill gaps để đạt được mục tiêu nghề nghiệp. Bạn hiểu roadmap phát triển kỹ năng trong từng ngành tại Việt Nam.",
    user: "Phân tích khoảng cách kỹ năng và đưa ra roadmap phát triển:\n\nKỹ năng hiện tại:\n{skills}\n\nVị trí mục tiêu: {jobTitle}\nYêu cầu công việc: {targetJob}\nKinh nghiệm: {workExperience}\nHọc vấn: {education}\n\nYêu cầu phân tích:\n- Identify critical missing skills\n- Prioritize skill development theo timeline\n- Suggest learning resources và cách acquire\n- Realistic timeline để develop skills\n- Quick wins vs long-term investments\n- Consider budget và time constraints\n- Actionable next steps\n- TẤT CẢ kỹ năng đề xuất phải bằng tiếng Việt"
  },

  emptyStateSkillGuidance: {
    system: "Bạn là mentor nghề nghiệp, giúp những người mới bắt đầu hoặc chuyển ngành xác định những kỹ năng cần thiết đầu tiên cho sự nghiệp của họ tại thị trường Việt Nam.",
    user: "Đề xuất kỹ năng cơ bản cho người mới bắt đầu:\n\nNghề nghiệp mong muốn: {profession}\nHọc vấn: {education}\nMục tiêu nghề nghiệp: {targetJob}\nSở thích/Điểm mạnh: {keyStrengths}\n\nYêu cầu:\n- 8-12 kỹ năng foundational quan trọng nhất\n- Balance giữa technical và soft skills\n- Kỹ năng có thể học được trong 3-6 tháng\n- Phù hợp với entry-level positions\n- Include basic digital literacy skills\n- Transferable skills từ kinh nghiệm khác\n- Motivation và learning mindset\n- TẤT CẢ kỹ năng trả về phải bằng tiếng Việt"
  }
} as const;

export type ViSkillsAIPromptKey = keyof typeof viSkillsAIPrompts;

/**
 * Format Vietnamese skills prompt with context data
 */
export function formatViSkillsPrompt(
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