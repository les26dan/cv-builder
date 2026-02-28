/**
 * JD Analysis Text Configuration
 * Centralized strings for JD Analysis and CV Optimization features
 * Following tenet #9: All UI strings must be centralized
 */

export const jdAnalysisTexts = {
  // Section Headers
  sectionTitle: 'Phân tích JD & Tối ưu hóa',
  sectionSubtitle: 'Tối ưu hóa CV dựa trên mô tả công việc mục tiêu',
  
  // Input Labels
  jobDescriptionLabel: 'Mô tả công việc mục tiêu',
  jobDescriptionPlaceholder: 'Paste job description here to get AI-powered suggestions for optimizing your CV...',
  
  // Buttons
  analyzeButton: 'Phân tích JD',
  analyzingButton: 'Đang phân tích...',
  reAnalyzeButton: '🔄 Phân tích lại',
  applyButton: 'Áp dụng',
  applyAllButton: 'Áp dụng tất cả',
  applyAllButtonPro: 'Áp dụng tất cả',
  proLabel: 'PRO',
  
  // Progress Indicators
  progressLabel: 'Tiến độ tối ưu hóa',
  progressApplying: (current: number, total: number) => `Đang áp dụng (${current}/${total})`,
  progressApplied: (current: number, total: number) => `${current}/${total} gợi ý đã áp dụng`,
  suggestionsCount: (count: number) => `${count} gợi ý tổng cộng`,
  sectionSuggestions: (count: number) => `${count} gợi ý`,
  
  // AI Suggestions
  aiSuggestionsTitle: 'Gợi ý tối ưu hóa từ AI',
  aiSuggestionsSubtitle: 'Cải thiện CV của bạn dựa trên phân tích JD',
  suggestionsPrompt: 'Áp dụng tất cả gợi ý để tối ưu hóa CV của bạn',
  suggestionsBySection: 'Gợi ý theo từng phần',
  
  // Section Names
  sectionNames: {
    summary: 'Tóm tắt hồ sơ',
    experience: 'Kinh nghiệm làm việc',
    skills: 'Kỹ năng',
    education: 'Học vấn',
    other: 'Khác'
  },
  
  // Section Icons (emojis)
  sectionIcons: {
    summary: '👤',
    experience: '💼',
    skills: '🛠️',
    education: '🎓',
    other: '📝'
  },
  
  // Priority Labels
  priorityLabels: {
    high: 'Quan trọng',
    medium: 'Trung bình',
    low: 'Thấp'
  },
  
  // Missing Keywords
  missingKeywordsTitle: 'Từ khóa quan trọng còn thiếu',
  keywordMoreCount: (count: number) => `+${count} khác`,
  
  // Match score configuration removed - focusing on keyword matching only
  
  // Apply suggestions
  
  // Error Messages
  errors: {
    emptyJobDescription: 'Vui lòng nhập mô tả công việc để phân tích',
    jobDescriptionTooLong: 'Mô tả công việc quá dài (tối đa 3000 ký tự)',
    analysisGeneral: 'Đã xảy ra lỗi khi phân tích JD. Vui lòng thử lại.',
    applyAllGeneral: 'Đã xảy ra lỗi khi áp dụng gợi ý. Vui lòng thử lại.'
  },
  
  // Character Count
  characterCount: (current: number, max: number) => `${current}/${max}`,
  
  // Boost Indicators
  scoreBoost: (boost: number) => `+${boost}%`,
  
  // Loading States
  loadingStates: {
    analyzing: 'Đang phân tích...',
    applying: 'Đang áp dụng...',
    applyingProgress: (current: number, total: number) => `Áp dụng tất cả (${current}/${total})`
  },
  
  // Monetization
  monetization: {
    premiumOnly: 'Premium',
    upgradeRequired: 'Nâng cấp để sử dụng',
    creditsRemaining: (count: number) => `${count} lượt còn lại`,
    noCreditsLeft: 'Hết lượt sử dụng',
    useCredit: 'Sử dụng 1 credit',
    applyAllPremium: 'Áp dụng tất cả (Premium)',
    premiumFeature: 'Tính năng Premium',
    limitedAccess: 'Truy cập hạn chế cho gói miễn phí',
    upgradeModal: {
      title: 'Nâng cấp lên Premium',
      subtitle: 'Mở khóa tính năng cao cấp để tối ưu hóa CV hiệu quả hơn',
      upgradeNow: 'Nâng cấp ngay',
      later: 'Để sau'
    }
  }
} as const;

export type JDAnalysisTexts = typeof jdAnalysisTexts; 