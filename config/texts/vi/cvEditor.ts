export const cvEditor = {
  sectionTitles: {
    contact: 'Thông tin liên hệ',
    summary: 'Tóm tắt chuyên môn',
    experience: 'Kinh nghiệm làm việc',
    skills: 'Kỹ năng',
    education: 'Học vấn',
    projects: 'Dự án',
    achievements: 'Thành tích',
    languages: 'Ngôn ngữ',
    certifications: 'Chứng chỉ',
  },
  header: {
    backToWorkspace: 'Quay lại CV Workspace',
    autoSave: {
      saving: 'Đang lưu...',
      saved: 'Đã lưu tự động',
      error: 'Lưu thất bại',
      offline: 'Chế độ offline',
    },
    userMenu: {
      profile: 'Hồ sơ',
      settings: 'Cài đặt',
      logout: 'Đăng xuất',
    },
  },

  editorPanel: {
    title: 'Chỉnh sửa CV',
    addSection: 'Thêm phần mới',
    deleteSection: 'Xóa phần',
    reorderSections: 'Kéo để sắp xếp lại các phần',
    addSectionModal: {
      title: 'Thêm phần mới',
      subtitle: 'Chọn loại phần bạn muốn thêm vào CV',
      cancel: 'Hủy',
    },
    cvScore: {
      title: 'Độ hoàn thiện CV',
      outOf: 'trên 100',
      improving: 'Tiếp tục cải thiện!',
    },
    jobAnalysis: {
      title: 'Phân tích JD',
      subtitle: 'OkBuddy giúp bạn phân tích mô tả công việc và đưa ra gợi ý tối ưu CV của bạn',
      placeholder: 'Dán mô tả công việc vào đây để nhận đề xuất tối ưu hóa...',
      analyzeButton: 'Phân tích',
      analyzing: 'Đang phân tích...',
      maxLength: 'Tối đa 5000 ký tự',
      errors: {
        required: 'Vui lòng nhập mô tả công việc để phân tích',
        tooLong: 'Mô tả công việc quá dài (tối đa 5000 ký tự)',
        analysisFailed: 'Đã xảy ra lỗi khi phân tích JD. Vui lòng thử lại.',
      },
    },
    suggestions: {
      title: 'Đề xuất tối ưu hóa',
      apply: 'Áp dụng',
      dismiss: 'Bỏ qua',
      noSuggestions: 'Không có đề xuất nào',
    },
    loadingEditor: 'Đang tải trình chỉnh sửa CV...',
    editorError: 'Trình chỉnh sửa CV gặp sự cố. Vui lòng thử lại sau.',
  },
  sections: {
    contact: {
      title: 'Thông tin liên hệ',
      fields: {
        fullName: 'Họ và tên',
        email: 'Email',
        phone: 'Số điện thoại',
        location: 'Địa chỉ',
        linkedin: 'LinkedIn',
        website: 'Website',
      },
      placeholders: {
        fullName: 'Nguyễn Văn A',
        email: 'email@example.com',
        phone: '+84 123 456 789',
        location: 'Thành phố, Tỉnh/Quốc gia',
        linkedin: 'linkedin.com/in/yourprofile',
        website: 'website.com',
      },
      validation: {
        requiredField: 'Vui lòng điền',
        invalidEmail: 'Vui lòng nhập địa chỉ email hợp lệ',
        invalidPhone: 'Vui lòng nhập số điện thoại hợp lệ',
      },
    },
    summary: {
      title: 'Tóm tắt chuyên môn',
      guidance: 'Viết 2-4 câu ngắn gọn & đầy năng lượng để thu hút sự quan tâm! Trình bày vai trò, kinh nghiệm & quan trọng nhất là - thành tựu lớn nhất, kỹ năng và phẩm chất tốt nhất của bạn.',
      placeholder: 'Tóm tắt ngắn gọn về kinh nghiệm và mục tiêu nghề nghiệp của bạn...',
      placeholderSimple: 'Viết tóm tắt về kinh nghiệm và mục tiêu nghề nghiệp của bạn...',
      aiHelper: 'Tạo bằng AI',
      aiImprove: 'Cải thiện tóm tắt',
      characterCount: 'ký tự',
      recommended: 'Khuyến nghị: 150-300 ký tự',
      generating: 'Đang tạo nội dung...',
      generateWithAI: 'Tạo tóm tắt với AI',
      improveError: 'Không thể cải thiện tóm tắt. Vui lòng thử lại.',
      emptyState: {
        title: 'Bắt đầu dễ dàng hơn!',
        description: 'Hãy bắt đầu với kinh nghiệm làm việc để AI có thể hỗ trợ viết tóm tắt tốt hơn',
        navigateButton: 'Đi đến Kinh nghiệm làm việc',
        orAlternative: 'Hoặc bạn có thể viết tóm tắt trực tiếp'
      },
    },
    experience: {
      title: 'Kinh nghiệm làm việc',
      addExperience: 'Thêm kinh nghiệm làm việc',
      guidance: 'Chỉ cần nhập chức danh và tên công ty - OkBuddy AI giúp bạn tạo mô tả kinh nghiệm làm việc ngay lập tức.',
      aiGuidance: 'Điền chức danh và tên công ty để AI có thể hỗ trợ tạo mô tả công việc hoàn hảo cho bạn.',
      fields: {
        title: 'Chức danh',
        company: 'Công ty',
        location: 'Địa điểm',
        startDate: 'Ngày bắt đầu',
        endDate: 'Ngày kết thúc',
        current: 'Tôi hiện đang làm việc ở đây',
        description: 'Mô tả công việc',
        achievements: 'Thành tích chính',
      },
      placeholders: {
        title: 'vd: Kỹ sư phần mềm',
        company: 'Công ty cổ phần ABC',
        location: 'vd: Hồ Chí Minh, Việt Nam',
        startDate: 'MM/YYYY',
        endDate: 'MM/YYYY',
        description: 'Mô tả trách nhiệm và nhiệm vụ chính của bạn...',
        achievements: 'Liệt kê những thành tích và hoàn thành chính...',
      },
      bullets: {
        add: 'Thêm thành tích',
        placeholder: 'Mô tả một thành tích hoặc trách nhiệm cụ thể...',
        remove: 'Xóa',
        aiGenerate: 'Cải thiện với OkBuddy AI',
        characterLimit: {
          tooLong: 'Gạch đầu dòng này khá dài ({length}/200 ký tự). Hãy cân nhắc chia thành hai gạch đầu dòng.',
          canShorten: '💡 {length}/200 ký tự',
        },
        templateSelection: {
          title: 'Chọn mẫu gạch đầu dòng',
          description: 'Chọn một mẫu phù hợp với kinh nghiệm của bạn. Bạn có thể điền vào các phần [trong ngoặc] với thông tin cụ thể của mình.',
          closeLabel: 'Đóng',
          jobTitleHint: 'Gợi ý cho vị trí:',
          selectButton: 'Chọn',
          exampleLabel: 'Ví dụ:',
          templates: {
            achievement: {
              title: 'Thành tựu với kết quả',
              content: 'Dẫn dắt [nhóm/dự án] để [đạt được mục tiêu], mang lại [tác động cụ thể].',
              example: 'Dẫn dắt nhóm 5 kỹ sư để triển khai hệ thống CRM mới, mang lại cải thiện hiệu suất 30%.'
            },
            implementation: {
              title: 'Triển khai dự án',
              content: 'Triển khai [dự án/sáng kiến] giúp [kết quả đạt được].',
              example: 'Triển khai quy trình tự động hóa báo cáo giúp giảm thời gian xử lý 50%.'
            },
            improvement: {
              title: 'Cải thiện quy trình',
              content: 'Cải thiện [quy trình/chỉ số] bằng [X%] thông qua [hành động cụ thể].',
              example: 'Cải thiện tỷ lệ chuyển đổi khách hàng bằng 25% thông qua tối ưu hóa quy trình bán hàng.'
            },
            collaboration: {
              title: 'Hợp tác nhóm',
              content: 'Hợp tác với [bộ phận/nhóm] để [đạt được mục tiêu], mang lại [kết quả tích cực].',
              example: 'Hợp tác với nhóm thiết kế và phát triển để ra mắt tính năng mới, tăng sự hài lòng của khách hàng 20%.'
            },
            management: {
              title: 'Quản lý và lãnh đạo',
              content: 'Quản lý [nhóm/tài nguyên] để [đạt được mục tiêu], đảm bảo [kết quả chất lượng].',
              example: 'Quản lý nhóm 8 nhân viên để hoàn thành dự án đúng hạn, đảm bảo chất lượng cao và ngân sách.'
            },
            problemSolving: {
              title: 'Giải quyết vấn đề',
              content: 'Giải quyết [vấn đề/thách thức] bằng cách [phương pháp], dẫn đến [kết quả tích cực].',
              example: 'Giải quyết vấn đề hiệu suất hệ thống bằng cách tối ưu hóa database, giảm thời gian phản hồi 60%.'
            }
          }
        }
      },
      validation: {
        titleRequired: 'Vui lòng nhập chức danh công việc',
        companyRequired: 'Vui lòng nhập tên công ty',
        endBeforeStart: 'Ngày kết thúc phải sau ngày bắt đầu',
        startAfterEnd: 'Ngày bắt đầu phải trước ngày kết thúc',
        aiRequirement: 'Vui lòng điền chức danh và công ty để sử dụng AI hỗ trợ',
        aiDescription: 'Vui lòng nhập chức danh và công ty trước khi tạo mô tả',
      },
      messages: {
        deleteConfirm: 'Bạn có chắc chắn muốn xóa kinh nghiệm này?',
        aiRequiredAlert: 'Vui lòng điền chức danh và công ty để sử dụng AI hỗ trợ',
        aiGenerationRequiredAlert: 'Vui lòng nhập chức danh và công ty trước khi sử dụng AI',
        aiDescriptionRequiredAlert: 'Vui lòng nhập chức danh và công ty trước khi tạo mô tả',
        improveDescriptionError: 'Không thể cải thiện mô tả. Vui lòng thử lại.',
        improveDescriptionGeneralError: 'Có lỗi xảy ra khi cải thiện mô tả. Vui lòng thử lại.',
        basicInfoHint: 'Bắt đầu với thông tin cơ bản',
        buildExperienceTitle: 'Xây Dựng Kinh Nghiệm Làm Việc Ấn Tượng Trong 5 Giây!',
      },
    },
    skills: {
      title: 'Kỹ năng',
      addSkill: 'Thêm kỹ năng',
      guidance: 'Chọn 5-10 kỹ năng phù hợp nhất với vị trí ứng tuyển.',
      categories: {
        technical: 'Kỹ năng kỹ thuật',
        soft: 'Kỹ năng mềm',
        languages: 'Ngôn ngữ',
        tools: 'Công cụ & Phần mềm',
      },
      placeholder: 'Thêm kỹ năng... (ví dụ: Python, Kỹ năng quản lý thời gian, Adobe Photoshop)',
      aiSuggestions: 'Gợi ý kỹ năng',
      clearAll: 'Xóa tất cả',
      clearAllTitle: 'Xóa tất cả kỹ năng',
      removeSkillTitle: 'Xóa kỹ năng này',
      validation: {
        alreadyAdded: 'Kỹ năng này đã được thêm',
        tooLong: 'Kỹ năng quá dài, vui lòng rút gọn (tối đa 50 ký tự)',
        longWarning: 'Kỹ năng này hơi dài, hãy cân nhắc rút gọn',
        limitReached: 'Đã đạt giới hạn 8 kỹ năng. Vui lòng xóa bớt kỹ năng ít quan trọng trước khi thêm mới.',
        allSuggestionsExist: 'Tất cả kỹ năng gợi ý đã có trong danh sách',
        generateError: 'Không thể tạo gợi ý kỹ năng. Vui lòng thử lại.',
        generalError: 'Có lỗi xảy ra khi tạo gợi ý kỹ năng. Vui lòng thử lại.',
      },
      confirmations: {
        clearAll: 'Bạn có chắc chắn muốn xóa tất cả kỹ năng? Hành động này không thể hoàn tác.',
      },
    },
    education: {
      title: 'Học vấn',
      addEducation: 'Thêm học vấn',
      itemTitle: 'Học vấn',
      fields: {
        degree: 'Bằng cấp và chuyên ngành',
        institution: 'Trường học',
        location: 'Địa điểm',
        graduationDate: 'Ngày tốt nghiệp',
        gpa: 'GPA (tùy chọn)',
        description: 'Mô tả',
      },
      placeholders: {
        degree: 'vd: Cử nhân Khoa học Máy tính',
        institution: 'vd: Đại học Bách Khoa',
        location: 'vd: Hà Nội, Việt Nam',
        graduationDate: 'MM/YYYY',
        gpa: 'vd: 3.8/4.0',
        description: 'Khóa học liên quan, danh hiệu, hoạt động...',
      },
      validation: {
        degreeRequired: 'Vui lòng nhập bằng cấp và chuyên ngành',
      },
      confirmations: {
        delete: 'Bạn có chắc chắn muốn xóa học vấn này?',
      },
    },
  },
  preview: {
    title: 'Xem trước CV',
    pageCounter: 'Trang {{current}} / {{total}}',
    actions: {
      download: 'Tải PDF',
      print: 'In',
      share: 'Chia sẻ',
    },
    downloading: 'Đang chuẩn bị tải...',
    formats: {
      pdf: 'PDF',
      word: 'Word',
    },
  },
  notifications: {
    aiSuccess: '✨ Thành công!',
    parsing: {
      success: 'Phân tích CV thành công!',
      successMessage: 'CV của bạn đã được phân tích và điền tự động.',
      error: 'Phân tích thất bại',
      errorMessage: 'Không thể trích xuất thông tin CV. Vui lòng điền thủ công.',
    },
    save: {
      success: 'CV đã được lưu thành công',
      error: 'Lưu CV thất bại',
      offline: 'Thay đổi đã được lưu cục bộ (offline)',
    },
  },
  errors: {
    loadFailed: 'Không thể tải dữ liệu CV',
    saveFailed: 'Không thể lưu CV',
    validationFailed: 'Vui lòng điền vào các trường bắt buộc',
    networkError: 'Lỗi mạng. Vui lòng kiểm tra kết nối.',
  },
  availableSections: {
    projects: { name: 'Dự án', description: 'Các dự án đã thực hiện' },
    volunteer: { name: 'Hoạt động tình nguyện', description: 'Kinh nghiệm tình nguyện và xã hội' },
    certifications: { name: 'Chứng chỉ', description: 'Các chứng chỉ chuyên môn' },
    languages: { name: 'Ngôn ngữ', description: 'Các ngôn ngữ biết sử dụng' },
    hobbies: { name: 'Sở thích', description: 'Sở thích cá nhân' },
    custom: { name: 'Phần tùy chỉnh', description: 'Tạo phần mới với nội dung tùy ý' },
  },
  common: {
    required: 'bắt buộc',
    optional: 'tùy chọn',
    add: 'Thêm',
    remove: 'Xóa',
    edit: 'Chỉnh sửa',
    delete: 'Xóa',
    save: 'Lưu',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    yes: 'Có',
    no: 'Không',
  },
} as const