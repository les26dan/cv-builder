export const mobileBlocking = {
  vi: {
    title: "Trải nghiệm tốt hơn trên máy tính",
    description: "Công cụ chỉnh sửa CV của chúng tôi hoạt động tốt nhất trên màn hình lớn để có trải nghiệm chính xác và hiệu quả nhất.",
    featuresTitle: "Bạn vẫn có thể làm trên điện thoại:",
    features: {
      workspace: "Xem và quản lý CV trong Workspace",
      upload: "Tải lên CV và mô tả công việc", 
      download: "Tải xuống CV đã hoàn thành"
    },
    actions: {
      backButton: "Quay lại",
      tabletSuggestion: "Hoặc chuyển sang máy tính bảng để có trải nghiệm di động tốt hơn"
    }
  },
  en: {
    title: "Better Experience on Desktop",
    description: "Our CV editing tools work best on larger screens for the most precise and efficient experience.",
    featuresTitle: "What you can still do on mobile:",
    features: {
      workspace: "View and manage CVs in Workspace",
      upload: "Upload CV and job descriptions",
      download: "Download completed CVs"
    },
    actions: {
      backButton: "Go Back",
      tabletSuggestion: "Or switch to a tablet for a better mobile experience"
    }
  }
} as const

// Default to Vietnamese
export const mobileBlockingTexts = mobileBlocking.vi 