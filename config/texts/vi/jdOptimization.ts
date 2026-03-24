/**
 * Vietnamese JD Optimization Text Configuration
 * Following OkBuddy development tenets - centralized text management
 * Optimized for Vietnamese professional markets and culture
 */

export const viJDOptimizationTexts = {
  // Prerequisite validation
  prerequisite: {
    ctaPrompt: "Muốn tối ưu hóa CV cho một tin tuyển dụng cụ thể? Dán mô tả công việc để nhận gợi ý từ AI.",
    ctaButton: "Tối ưu hóa CV theo JD",
    incompleteMessage: "Vui lòng hoàn thiện thông tin liên hệ và ít nhất một kinh nghiệm làm việc để sử dụng tính năng này.",
    completeTooltip: "Hoàn thiện CV để mở khóa tính năng tối ưu hóa JD"
  },

  // JD Input
  input: {
    placeholder: "Dán nội dung mô tả công việc (tối đa 5000 ký tự)...",
    label: "Phân tích JD",
    charLimit: "ký tự",
    submitButton: "Phân tích và tạo gợi ý",
    viewButton: "Xem JD",
    removeButton: "Xóa JD",
    changeButton: "Thay đổi JD"
  },

  // Processing states
  processing: {
    analyzing: "Đang phân tích mô tả công việc và quét CV để tối ưu hóa...",
    generatingSuggestions: "Đang tạo gợi ý cho từng phần của CV...",
    completed: "Hoàn thành! Kiểm tra các gợi ý bên dưới."
  },

  // Error messages
  errors: {
    tooShort: "Mô tả công việc quá ngắn. Vui lòng cung cấp thêm chi tiết.",
    tooLong: "Mô tả công việc vượt quá 5000 ký tự. Vui lòng rút gọn.",
    invalid: "Nội dung không hợp lệ. Vui lòng kiểm tra lại.",
    networkError: "Lỗi kết nối. Vui lòng thử lại sau.",
    analysisError: "Không thể phân tích JD. Vui lòng thử lại.",
    retryButton: "Thử lại"
  },

  // Success messages
  success: {
    jdSubmitted: "Đã lưu mô tả công việc thành công",
    jdRemoved: "Đã xóa mô tả công việc",
    suggestionsGenerated: "Đã tạo gợi ý tối ưu hóa"
  },

  // Guidance
  guidance: {
    optimalLength: "Để có kết quả tốt nhất, mô tả công việc nên có 200-2000 ký tự",
    includeDetails: "Hãy bao gồm: yêu cầu kỹ năng, kinh nghiệm, trách nhiệm công việc",
    privacyNote: "Thông tin JD chỉ được sử dụng để tạo gợi ý và không được lưu trữ"
  },

  // Section headers
  sections: {
    summary: "Gợi ý từ AI cho phần Tóm tắt Hồ sơ",
    workExperience: "Gợi ý từ AI cho Kinh nghiệm làm việc",
    skills: "Gợi ý từ AI cho Kỹ năng", 
    education: "Gợi ý từ AI cho Học vấn",
    noSuggestions: "Không có gợi ý cho phần này"
  },

  // Apply actions
  apply: {
    individualButton: "Áp dụng",
    allButton: "Áp dụng tất cả",
    applied: "Đã áp dụng",
    applying: "Đang áp dụng...",
    failed: "Lỗi áp dụng"
  }
} as const;

export type ViJDOptimizationTextKey = keyof typeof viJDOptimizationTexts; 