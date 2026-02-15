export const cvUpload = {
  header: {
    title: "Tối ưu CV trong 5 phút",
    subtitle: "OkBuddy sẽ phân tích và giúp bạn cải thiện CV, tăng cơ hội phỏng vấn",
    exitButton: "Thoát",
    autoSaveStatus: "Đã lưu tự động",
    userAvatar: "N",
    backToWorkspace: "← Quay lại Workspace"
  },
  progress: {
    step1: "Tải CV & Mô tả công việc",
    step2: "Phân tích & đánh giá CV", 
    step3: "Áp dụng thay đổi"
  },
  upload: {
    title: "Kéo thả CV hoặc nhấn để chọn",
    supportedFormats: "Hỗ trợ PDF, DOCX • Tối đa 10MB",
    uploadButton: "Upload CV của bạn",
    privacyNote: "Dữ liệu được bảo mật và chỉ dùng để phân tích & tối ưu CV của bạn",
    uploadSuccess: "✅ Tải lên thành công",
    fileName: "CV_NguyenVanAn_Frontend.pdf",
    fileSize: "2.3 MB",
    removeFile: "×"
  },
  jobDescription: {
    title: "Mô tả công việc",
    subtitle: "Bạn đang apply cho một vị trí cụ thể?",
    description: "Thêm mô tả công việc để cải thiện & tối ưu CV, gia tăng lợi thế trước các ứng viên khác",
    urlPlaceholder: "Dán đường dẫn JD tại đây",
    textPlaceholder: "Copy paste mô tả công việc tại đây...",
    characterCount: "247/2000",
    sampleText: "Chúng tôi đang tìm kiếm một Frontend Developer có kinh nghiệm với React và TypeScript để tham gia vào đội ngũ phát triển sản phẩm. Ứng viên cần có khả năng làm việc độc lập, tư duy logic tốt và đam mê công nghệ..."
  },
  actions: {
    startAnalysis: "Bắt đầu phân tích",
    createNewCV: "Tạo CV mới",
    analyzeDisabled: "Vui lòng tải lên CV của bạn trước"
  },
  errors: {
    unsupportedFormat: "Định dạng file không được hỗ trợ. Vui lòng tải file PDF hoặc DOCX.",
    fileTooLarge: "File vượt quá 10MB. Vui lòng chọn file nhỏ hơn.",
    textTooLong: "Văn bản quá dài, hãy rút gọn mô tả (tối đa 2000 ký tự).",
    uploadFailed: "Tải file thất bại. Vui lòng thử lại.",
    invalidUrl: "URL không hợp lệ"
  },
  loading: {
    analyzing: "Đang phân tích CV…",
    comparing: "So sánh với JD…", 
    applying: "Áp dụng đề xuất thay đổi…",
    loadingMessage: "CV của bạn đang được phân tích bởi AI tiên tiến nhất của OkBuddy",
    processingMessage: "Chúng tôi đang so sánh CV với mô tả công việc và tối ưu từng chi tiết"
  },
  template: {
    title: "Dùng mẫu có sẵn",
    subtitle: "Bắt đầu với template chuyên nghiệp được tối ưu cho ATS",
    description: "Bắt đầu với template chuyên nghiệp được tối ưu cho ATS",
    startButton: "Bắt đầu",
    icon: "📄",
    atsCompliant: "✓ Chuẩn ATS",
    preview: {
      name: "John Doe",
      email: "john@doe",
      phone: "0123456789",
      location: "United States",
      summary: "Lorem Ipsum"
    }
  },
  freshGraduate: {
    title: "Sinh viên mới ra trường?",
    subtitle: "Tạo CV chuyên nghiệp từ đầu với hướng dẫn từng bước",
    createButton: "Tạo CV từ đầu",
    icon: "🎓"
  },
  divider: {
    text: "Hoặc:"
  }
} as const 