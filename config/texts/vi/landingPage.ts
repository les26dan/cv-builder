export const landingPage = {
  header: {
    logo: "OkBuddy",
    nav: {
      features: "Tính năng",
      pricing: "Giá cả", 
      about: "Giới thiệu"
    },
    auth: {
      login: "Đăng nhập",
      signup: "Đăng ký"
    }
  },
  hero: {
    title: "75% CV bị loại tự động trước khi đến tay nhà tuyển dụng. CV của bạn thì sao?",
    subtitle: "Chỉ 2% CV chiến thắng. CV của bạn sẽ là một trong số đó.",
    cta: "Dùng thử miễn phí ngay"
  },
  problems: {
    ats: {
      label: "CHUẨN HOÁ CV CỦA BẠN" ,
      title: "75% CV bị loại bởi hệ thống lọc tự động ATS trước khi đến tay nhà tuyển dụng",
      description: "Đừng để CV của bạn bị từ chối vì lỗi định dạng và thiếu từ khóa quan trọng. OkBuddy giúp bạn tối ưu CV để luôn lọt vào mắt xanh nhà tuyển dụng.",
      scoreCard: {
        title: "Điểm CV",
        score: "60",
        description: "CV của bạn chỉ phù hợp 60% với yêu cầu công việc",
        issuesTitle: "12 vấn đề được tìm thấy",
        issues: [
          "Định dạng phức tạp, có thể gây nhầm lẫn cho ATS",
          "Thiếu từ khóa đặc thù cho công việc", 
          "Phát hiện lỗi font và lỗi chính tả"
        ],
        cta: "Sửa tất cả vấn đề ngay"
      }
    },
    keywords: {
      label: "BỔ SUNG TỪ KHÓA QUAN TRỌNG",
      title: "60% CV bị loại vì thiếu các từ khóa quan trọng mà công việc yêu cầu",
      description: "Mỗi công việc yêu cầu những từ khóa cụ thể. OkBuddy phân tích nhanh và chỉ rõ từ khóa nào CV bạn còn đang thiếu, tăng mạnh cơ hội phỏng vấn.",
      analysis: {
        title: "Đối chiếu từ khóa",
        matchIndicator: "Yếu - 2/5",
        jobRequirements: "Yêu cầu công việc",
        presentKeywords: ["React", "JavaScript"],
        missingKeywords: ["TypeScript", "AWS", "Docker"],
        missingTitle: "Từ khóa còn thiếu",
        missingList: [
          "TypeScript",
          "AWS",
          "Docker"
        ],
        cta: "Thêm từ khóa còn thiếu ngay"
      }
    },
    massCV: {
      label: "ỨNG TUYỂN NHANH CHÓNG",
      title: "Ứng tuyển hơn 50 công việc mỗi ngày, không còn vất vả chỉnh sửa CV thủ công!",
      description: "Ngừng lãng phí thời gian chỉnh sửa từng CV một. OkBuddy tự động tùy chỉnh CV phù hợp với từng vị trí, giúp bạn nộp đơn nhanh hơn và thông minh hơn.",
      cta: "Bắt đầu ứng tuyển hàng loạt",
      massApplication: {
        title: "Ứng tuyển hàng loạt",
        subtitle: "Nộp đơn nhiều vị trí nhanh chóng với CV tối ưu",
        jobs: [
          {
            title: "Frontend Developer tại Zalo",
            match: "92%",
            cta: "Ứng tuyển ngay"
          },
          {
            title: "React Developer tại MoMo", 
            match: "88%",
            cta: "Tối ưu CV & ứng tuyển"
          },
          {
            title: "Web Developer tại NAB",
            match: "65%",
            cta: "Tối ưu CV & ứng tuyển"
          }
        ]
      }
    },
    coverLetters: {
      label: "TẠO THƯ XIN VIỆC NỔI BẬT",
      title: "Thư xin việc tốt tăng ngay 55% cơ hội phỏng vấn, nhưng bạn đang mất hàng giờ để viết?",
      description: "OkBuddy phân tích mô tả công việc, văn hoá công ty và lịch sử làm việc của bạn để tạo thư xin việc phù hợp trong 30 giây thay vì 30 phút, giúp bạn nổi bật giữa hàng trăm ứng viên cạnh tranh!",
      coverLetterUI: {
        title: "Thư xin việc",
        subtitle: "Tạo thư xin việc tùy chỉnh ngay lập tức",
        greeting: "Kính gửi Nhà tuyển dụng,",
        customization: "Ứng tuyển vị trí: Frontend Developer tại Zalo",
        cta: "Tạo thư xin việc"
      }
    }
  },
  waitlist: {
    title: "Sẵn sàng thay đổi cách bạn tìm việc?",
    description: "Tham gia danh sách ưu tiên để là một trong những người đầu tiên trải nghiệm OkBuddy.",
    emailPlaceholder: "Nhập email của bạn",
    cta: "Tham gia ngay"
  },
  testimonials: {
    title: "Hơn 1000+ người đã tìm được việc mơ ước nhờ OkBuddy",
    items: [
      {
        name: "Nguyễn Văn A",
        role: "Kỹ sư phần mềm",
        content: "OkBuddy giúp tôi có được phỏng vấn tại 3 công ty công nghệ hàng đầu bằng cách tối ưu hóa CV cho hệ thống ATS. Công cụ tạo thư xin việc đã tiết kiệm cho tôi hàng giờ làm việc!"
      },
      {
        name: "Trần Thị B", 
        role: "Frontend Developer",
        content: "Tôi đã bỏ sót các từ khóa quan trọng trong CV khiến hồ sơ bị từ chối tự động. OkBuddy đã xác định chúng và giúp tôi điều chỉnh hồ sơ một cách hoàn hảo."
      },
      {
        name: "Lê Văn C",
        role: "Sinh viên mới tốt nghiệp", 
        content: "Là sinh viên mới ra trường, tôi đã gặp khó khăn trong việc có được phỏng vấn. OkBuddy giúp tôi ứng tuyển hơn 30 vị trí với CV tùy chỉnh chỉ trong một ngày. Tôi nhận được 5 cuộc gọi phản hồi!"
      }
    ]
  },
  footer: {
    logo: "OkBuddy",
    description: "Trợ lý AI giúp bạn tối ưu hóa CV và tìm việc hiệu quả hơn.",
    links: {
      product: {
        title: "Sản phẩm",
        items: ["Tính năng", "Giá cả", "Câu hỏi thường gặp"]
      },
      company: {
        title: "Công ty", 
        items: ["Giới thiệu", "Blog", "Liên hệ"]
      },
      legal: {
        title: "Pháp lý",
        items: ["Chính sách bảo mật", "Điều khoản dịch vụ"]
      }
    },
    copyright: "© 2025 OkBuddy. Tất cả quyền được bảo lưu."
  },
  resume: {
    preview: {
      name: "Nguyễn Văn Đức",
      role: "Kỹ sư phần mềm",
      experience: "Kinh nghiệm",
      skills: "Kỹ năng",
      skillsList: ["React", "JavaScript", "Node.js"]
    },
    aiSuggestions: {
      title: "Gợi ý từ AI",
      subtitle: "Tối ưu hóa CV cho hệ thống ATS",
      suggestions: [
        "Thêm \"Python\" vào phần kỹ năng",
        "Nêu rõ vai trò của bạn trong dự án X", 
        "Thiếu từ khóa \"Điện toán đám mây\""
      ],
      cta: "Áp dụng tất cả gợi ý"
    }
  }
}; 