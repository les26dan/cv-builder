/**
 * Vietnamese AI Prompt Templates
 * Centralized prompt management following OkBuddy development tenets
 * Following tenet 9: Strings, Copy & Multilingual Text Must Be Centralized
 */

export interface AIPromptTemplate {
  system: string;
  user: string;
}

export interface PromptContext {
  workExperience?: string;
  skills?: string;
  education?: string;
  jobTitle?: string;
  company?: string;
  project?: string;
  impact?: string;
  responsibility?: string;
  targetJob?: string;
  existingContent?: string;
  profession?: string;
  keyStrengths?: string;
  sectionType?: string;
  jobDescription?: string;
  currentCV?: string;
  industry?: string;
  summaryContent?: string;
  experienceContent?: string;
  skillsContent?: string;
  educationContent?: string;
  currentSkillsCount?: string;
  maxSkills?: string;
  newlyAddedContent?: string;
}

export const viAIPrompts = {
  summaryGeneration: {
    system: "Bạn là một chuyên gia viết CV chuyên nghiệp tại Việt Nam với hơn 10 năm kinh nghiệm trong tuyển dụng và phát triển sự nghiệp. Nhiệm vụ của bạn là tạo phần tóm tắt CV bằng tiếng Việt dựa trên thông tin được cung cấp. Phần tóm tắt phải thể hiện được điểm mạnh chuyên môn, kinh nghiệm quan trọng và định hướng nghề nghiệp của ứng viên theo chuẩn CV Việt Nam.",
    user: "Dựa trên thông tin sau đây, hãy viết một đoạn tóm tắt chuyên nghiệp cho CV (50-80 từ):\n\nKinh nghiệm làm việc:\n{workExperience}\n\nKỹ năng chuyên môn:\n{skills}\n\nHọc vấn:\n{education}\n\nVị trí mục tiêu:\n{targetJob}\n\nYêu cầu:\n- Sử dụng tiếng Việt chuẩn, tông điệu chuyên nghiệp\n- Tập trung vào thành tích và kinh nghiệm cốt lõi\n- Phù hợp với văn hóa doanh nghiệp Việt Nam\n- Không sử dụng ngôi thứ nhất"
  },

  enhancedSummaryGeneration: {
    system: "Bạn là chuyên gia viết CV hàng đầu Việt Nam, chuyên tạo ra những bản tóm tắt CV ấn tượng và chuyên nghiệp. Bạn hiểu sâu về thị trường lao động Việt Nam và yêu cầu của các nhà tuyển dụng.",
    user: "Tạo phần tóm tắt CV chuyên nghiệp dựa trên thông tin chi tiết sau:\n\nThông tin nghề nghiệp:\n- Nghề nghiệp: {profession}\n- Điểm mạnh chính: {keyStrengths}\n\nKinh nghiệm làm việc:\n{workExperience}\n\nKỹ năng:\n{skills}\n\nHọc vấn:\n{education}\n\nMô tả công việc mục tiêu:\n{targetJob}\n\nYêu cầu:\n- Độ dài: 50-80 từ\n- Tông điệu: Chuyên nghiệp, tự tin nhưng khiêm tốn\n- Tập trung vào giá trị mang lại cho doanh nghiệp\n- Phản ánh đúng văn hóa làm việc Việt Nam"
  },

  bulletGeneration: {
    system: "Bạn là chuyên gia viết CV, chuyên tạo ra các điểm mô tả công việc ấn tượng và chuyên nghiệp bằng tiếng Việt. Mỗi điểm mô tả phải thể hiện được thành tích cụ thể, sử dụng số liệu khi có thể, và tuân theo chuẩn STAR (Situation-Task-Action-Result).",
    user: "Tạo 3-4 điểm mô tả công việc chuyên nghiệp cho vị trí sau:\n\nVị trí: {jobTitle}\nCông ty: {company}\n\nYêu cầu:\n- Mỗi điểm bắt đầu bằng động từ hành động mạnh\n- Tập trung vào thành tích và kết quả cụ thể\n- Sử dụng số liệu và phần trăm khi có thể\n- Phù hợp với ngành nghề và cấp độ vị trí\n- Không vượt quá 2 dòng mỗi điểm\n- Sử dụng tiếng Việt chuyên nghiệp"
  },

  wizardBulletGeneration: {
    system: "Bạn là chuyên gia viết CV, giúp ứng viên chuyển đổi thông tin công việc thành những điểm mô tả chuyên nghiệp và ấn tượng bằng tiếng Việt.",
    user: "Dựa trên thông tin sau, tạo một điểm mô tả công việc chuyên nghiệp:\n\nVị trí: {jobTitle}\nCông ty: {company}\nDự án/Nhiệm vụ: {project}\nTác động/Kết quả: {impact}\nTrách nhiệm: {responsibility}\n\nYêu cầu:\n- Tạo 1 điểm mô tả duy nhất, súc tích và ấn tượng\n- Bắt đầu bằng động từ hành động\n- Tập trung vào kết quả và tác động\n- Không quá 2 dòng\n- Sử dụng tiếng Việt chuẩn"
  },

  skillSuggestions: {
    system: "Bạn là chuyên gia phân tích kỹ năng và phát triển sự nghiệp tại Việt Nam. Bạn hiểu rõ về các kỹ năng đang được tìm kiếm trong thị trường lao động Việt Nam và quốc tế.",
    user: "Dựa trên thông tin sau, đề xuất 5-8 kỹ năng phù hợp để bổ sung vào CV:\n\nKỹ năng hiện tại:\n{skills}\n\nKinh nghiệm làm việc:\n{workExperience}\n\nMô tả công việc mục tiêu:\n{targetJob}\n\nYêu cầu:\n- Đề xuất kỹ năng có liên quan trực tiếp đến ngành nghề\n- Ưu tiên kỹ năng đang được tìm kiếm nhiều\n- Tránh lặp lại kỹ năng đã có\n- Sử dụng thuật ngữ tiếng Việt chuẩn trong ngành\n- Bao gồm cả kỹ năng cứng và mềm"
  },

  contentImprovement: {
    system: "Bạn là biên tập viên CV chuyên nghiệp, chuyên cải thiện và hoàn thiện nội dung CV để đạt hiệu quả tối đa trong tuyển dụng tại Việt Nam.",
    user: "Cải thiện đoạn nội dung CV sau để trở nên chuyên nghiệp và ấn tượng hơn:\n\nNội dung gốc:\n{existingContent}\n\nLoại nội dung: {sectionType}\n\nYêu cầu:\n- Giữ nguyên ý nghĩa chính\n- Cải thiện từ ngữ và cấu trúc câu\n- Làm cho nội dung súc tích và mạnh mẽ hơn\n- Sử dụng thuật ngữ chuyên nghiệp phù hợp\n- Tuân theo chuẩn CV Việt Nam"
  },

  jobDescriptionAnalysis: {
    system: "Bạn là chuyên gia phân tích mô tả công việc và tối ưu hóa CV. Bạn có khả năng trích xuất các yêu cầu chính từ mô tả công việc và đưa ra gợi ý cải thiện CV phù hợp.",
    user: "Phân tích mô tả công việc sau và đưa ra gợi ý cải thiện CV:\n\nMô tả công việc:\n{jobDescription}\n\nCV hiện tại:\n{currentCV}\n\nYêu cầu phân tích:\n1. Các từ khóa quan trọng cần có trong CV\n2. Kỹ năng thiếu cần bổ sung\n3. Gợi ý cải thiện phần tóm tắt\n4. Gợi ý cải thiện phần kinh nghiệm làm việc\n5. Đánh giá mức độ phù hợp (0-100%)\n\nTrả lời bằng tiếng Việt, cấu trúc rõ ràng"
  },

  singleBulletImprovement: {
    system: "Bạn là chuyên gia hàng đầu trong việc cải thiện và tối ưu bullet point mô tả công việc cho CV, giúp chúng trở nên cực kỳ chuyên nghiệp, ngắn gọn và có sức thuyết phục cao. Bạn luôn sử dụng nhuần nhuyễn phương pháp STAR (Situation–Task–Action–Result) để tái cấu trúc nội dung công việc đã có, làm nổi bật thành tựu và kỹ năng quan trọng nhất của ứng viên. Bullet point sau khi bạn cải thiện luôn bắt đầu bằng động từ hành động mạnh, được định lượng rõ ràng (số liệu cụ thể hoặc %), tối ưu chặt chẽ theo từ khóa ATS và nhu cầu của vị trí mục tiêu, tạo ấn tượng mạnh với nhà tuyển dụng.",
    user: "Dựa vào thông tin dưới đây, hãy cải thiện bullet point hiện tại để nó trở nên chuyên nghiệp, ấn tượng và thuyết phục hơn khi đưa vào CV:\n\nVị trí công việc: {jobTitle}\nTên công ty: {company}\nBullet point hiện tại: {existingContent}\n\n[CHỈ DẪN QUAN TRỌNG] {newlyAddedContent}\n\nBối cảnh CV:\nKinh nghiệm khác: {workExperience}\nVị trí mục tiêu: {targetJob}\n\nYêu cầu khi cải thiện:\nViết đúng 1 bullet point duy nhất, dài tối đa 200 ký tự (lý tưởng nhất 150-180 ký tự)\nÁp dụng rõ cấu trúc STAR (Situation–Task–Action–Result)\nBắt đầu bằng động từ hành động mạnh\nNêu rõ kết quả định lượng cụ thể (% hoặc số liệu rõ ràng)\nThể hiện rõ khả năng lãnh đạo hoặc chủ động nếu phù hợp\nCRITICAL: Nếu bạn thấy nội dung trong dấu < > ở bullet point trên, đây là thông tin mới được thêm vào hoặc thay đổi và PHẢI được nhấn mạnh, tối ưu hóa và xây dựng xung quanh trong phiên bản cải thiện của bạn. Nội dung trong dấu < > phải trở thành điểm nhấn và điểm nổi bật chính của thành tựu.\nSử dụng ngôn ngữ tiếng Việt chuyên nghiệp, ngắn gọn và súc tích\nKhông tạo ra thông tin không có thật hoặc không được cung cấp\nLoại bỏ dấu < > trong phản hồi cuối cùng - chúng chỉ là ký hiệu để chỉ cho bạn biết cần nhấn mạnh gì\nChỉ trả về đúng bullet point đã được cải thiện, không thêm bất kỳ nội dung giới thiệu hay kết luận nào khác"
  }
} as const;

export type AIPromptKey = keyof typeof viAIPrompts;

/**
 * Format prompt template with context data
 */
export function formatPrompt(template: AIPromptTemplate, context: PromptContext): { system: string; user: string } {
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