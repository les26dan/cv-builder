export const userDrawer = {
  // User information section
  userInfo: {
    welcome: "Xin chào",
    email: "Email",
    role: {
      admin: "Quản trị viên",
      user: "Người dùng"
    }
  },
  
  // Language toggle section
  language: {
    title: "Ngôn ngữ",
    options: {
      vi: "Tiếng Việt",
      en: "English"
    },
    current: "Hiện tại"
  },
  
  // Actions section
  actions: {
    signOut: "Đăng xuất",
    profile: "Hồ sơ cá nhân",
    settings: "Cài đặt",
    admin: "Quản trị hệ thống"
  },
  
  // Navigation section
  navigation: {
    workspace: "CV Workspace",
    admin: "Trang quản trị",
    landing: "Trang chủ"
  },
  
  // Confirmation messages
  confirmations: {
    signOut: "Bạn có chắc chắn muốn đăng xuất?",
    languageChange: "Ngôn ngữ sẽ được thay đổi sau khi tải lại trang",
    cancel: "Hủy"
  },
  
  // Status messages
  status: {
    signingOut: "Đang đăng xuất...",
    changingLanguage: "Đang thay đổi ngôn ngữ..."
  },
  
  // Error messages
  errors: {
    logoutFailed: "Đăng xuất thất bại. Vui lòng thử lại.",
    logoutError: "Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại."
  }
} as const 