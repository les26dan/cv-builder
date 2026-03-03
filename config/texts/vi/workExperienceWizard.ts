export const workExperienceWizardTexts = {
  // Modal titles and headers
  modalTitle: 'Thêm kinh nghiệm làm việc',
  aiModalTitle: 'Tạo mô tả công việc AI',
  
  // New simplified wizard texts
  newWizard: {
    modalTitle: 'Thêm kinh nghiệm làm việc',
    subtitles: {
      basicInfo: 'Thông tin cơ bản',
      optionalDetails: 'Thông tin chi tiết (tùy chọn)'
    },
    steps: {
      basicInfo: {
        title: 'Nhập thông tin cơ bản',
        description: 'AI sẽ tự động tạo mô tả công việc chuyên nghiệp từ thông tin này.'
      },
      optionalDetails: {
        title: 'Thêm chi tiết (tùy chọn)',
        description: 'Bổ sung thông tin để AI tạo mô tả công việc chi tiết và ấn tượng hơn.'
      }
    },
    aiPreview: {
      title: 'AI sẽ tạo ra nội dung như thế này:',
      subtitle: 'Dựa trên vị trí và công ty bạn nhập',
      generatedBy: 'Được tạo bởi AI'
    },
    jobTitleSuggestions: ['Software Engineer', 'Marketing Manager', 'Sales Executive'],
    tips: {
      shortInput: 'Mẹo: Chỉ cần nhập 3-5 từ cho mỗi mục và để AI hoàn thiện phần còn lại!',
      wordCount: '3-5 từ là đủ'
    },
    fields: {
      jobTitle: {
        label: 'Chức danh công việc của bạn là gì?',
        placeholder: 'Ví dụ: Software Engineer, Marketing Manager...',
        helper: 'Nhập chính xác chức danh để AI có thể tạo mô tả phù hợp nhất.'
      },
      company: {
        label: 'Tên công ty hoặc tổ chức?',
        placeholder: 'Ví dụ: Google, Vingroup, FPT Software'
      },
      project: {
        label: 'Dự án hoặc trách nhiệm chính',
        placeholder: 'Ví dụ: Ứng dụng di động, Chiến dịch marketing...'
      },
      impact: {
        label: 'Kết quả hoặc tác động',
        placeholder: 'Ví dụ: Tăng doanh thu 30%, Giảm chi phí...',
        badge: '+ Điểm mạnh'
      }
    }
  },
  
  // Step titles
  stepTitles: {
    jobTitle: 'Chức danh công việc',
    company: 'Công ty tuyển dụng',
    dates: 'Thời gian làm việc',
    location: 'Địa điểm (tùy chọn)',
    project: 'Dự án/Công việc chính',
    impact: 'Tác động/Kết quả',
    responsibility: 'Vai trò/Trách nhiệm'
  },

  // Step questions/prompts
  stepPrompts: {
    jobTitle: 'Chức danh công việc của bạn là gì?',
    company: 'Tên công ty hoặc tổ chức?',
    dates: 'Thời gian làm việc',
    location: 'Địa điểm làm việc (tùy chọn)',
    project: 'Dự án hoặc trách nhiệm chính',
    impact: 'Kết quả hoặc tác động',
    responsibility: 'Vai trò và phạm vi trách nhiệm (tùy chọn)'
  },

  // Placeholders
  placeholders: {
    jobTitle: 'Ví dụ: Chuyên viên kinh doanh, Software Engineer...',
    company: 'Ví dụ: Công ty cổ phần ABC, Ngân hàng XYZ...',
    startDate: '12/2023 hoặc 2023',
    endDate: '12/2024 hoặc 2024',
    location: 'Ví dụ: Hồ Chí Minh, Hà Nội, Remote...',
    project: 'Ví dụ: Phát triển hệ thống CRM mới cho bộ phận kinh doanh',
    impact: 'Ví dụ: Tăng hiệu suất bán hàng 25%, giảm thời gian xử lý đơn hàng 40%',
    responsibility: 'Ví dụ: Lãnh đạo nhóm 5 người, quản lý ngân sách 500 triệu, phụ trách khu vực miền Nam...'
  },

  // Helper text and guidance
  helperTexts: {
    jobTitle: 'Nhập chính xác chức danh để AI có thể tạo mô tả phù hợp nhất.',
    company: 'AI sẽ sử dụng thông tin này để tạo mô tả công việc phù hợp với ngành nghề.',
    location: 'Bạn có thể bỏ trống nếu không muốn hiển thị địa điểm trên CV.',
    project: 'Mô tả ngắn gọn một dự án, nhiệm vụ hoặc trách nhiệm quan trọng bạn đã đảm nhận.',
    impact: 'Mô tả kết quả cụ thể, có thể là con số, cải thiện quy trình, hoặc lợi ích mang lại.',
    responsibility: 'Mô tả vai trò lãnh đạo, phạm vi trách nhiệm hoặc quy mô công việc để AI tạo mô tả toàn diện hơn.'
  },

  // Info banners and tips
  infoBanners: {
    aiIntro: {
      title: '🎯 Tạo mô tả công việc với AI',
      description: 'AI sẽ giúp bạn tạo gạch đầu dòng chuyên nghiệp dựa trên thông tin bạn cung cấp.'
    },
    impactTip: {
      title: '💡 Mẹo: Sử dụng số liệu cụ thể',
      description: 'Ví dụ: "Tăng doanh thu 30%", "Giảm thời gian xử lý 50%", "Quản lý ngân sách 2 tỷ đồng"'
    }
  },

  // Labels
  labels: {
    startDate: 'Ngày bắt đầu *',
    endDate: 'Ngày kết thúc *',
    currentJob: 'Tôi hiện đang làm việc ở đây',
    required: '*',
    optional: '(tùy chọn)'
  },

  // Progress indicators
  progress: {
    step: 'Bước',
    of: '/',
    loading: 'Đang tạo...'
  },

  // Buttons
  buttons: {
    cancel: 'Hủy',
    back: 'Quay lại',
    next: 'Tiếp theo',
    skip: 'Bỏ qua',
    skipAI: 'Bỏ qua AI',
    generateWithAI: 'Tạo với AI',
    close: 'Đóng'
  },

  // Validation errors
  errors: {
    jobTitleRequired: 'Vui lòng nhập chức danh công việc',
    companyRequired: 'Vui lòng nhập tên công ty',
    startDateRequired: 'Vui lòng nhập ngày bắt đầu',
    endDateRequired: 'Vui lòng nhập ngày kết thúc hoặc chọn "Công việc hiện tại"',
    endDateBeforeStart: 'Ngày kết thúc phải sau ngày bắt đầu',
    projectRequired: 'Vui lòng mô tả dự án hoặc trách nhiệm chính',
    impactRequired: 'Vui lòng mô tả kết quả hoặc tác động'
  },

  // Confirmation dialogs
  confirmations: {
    closeWizard: 'Bạn có chắc chắn muốn hủy? Tất cả thông tin đã nhập sẽ bị mất.',
    skipAI: 'Bỏ qua AI sẽ yêu cầu bạn tự viết gạch đầu dòng. Bạn có chắc chắn?'
  },

  // Success messages
  success: {
    experienceAdded: 'Đã thêm kinh nghiệm làm việc thành công!',
    bulletGenerated: 'Đã tạo mô tả công việc với AI thành công!'
  },

  // Error messages
  apiErrors: {
    failedToGenerate: 'Không thể tạo gạch đầu dòng. Vui lòng thử lại.',
    networkError: 'Có lỗi xảy ra khi tạo gạch đầu dòng. Vui lòng thử lại.',
    aiUnavailable: 'AI hiện không khả dụng. Bạn có thể tự viết mô tả công việc.'
  },

  // Accessibility labels
  aria: {
    close: 'Đóng',
    wizardDialog: 'Thêm kinh nghiệm làm việc',
    progressBar: 'Tiến trình hoàn thành'
  }
};

export default workExperienceWizardTexts; 