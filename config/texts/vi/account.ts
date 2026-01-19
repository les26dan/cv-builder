export const account = {
  // Common elements
  logo: "OkBuddy",
  nav: {
    feedback: "Góp ý",
    features: "Tính năng",
    pricing: "Giá cả", 
    about: "Giới thiệu",
    login: "Đăng nhập",
    signup: "Đăng ký"
  },

  // Register page
  register: {
    title: "Đăng ký tài khoản",
    subtitle: "Tạo tài khoản OkBuddy của bạn",
    social: {
      google: {
        button: "Đăng ký với Google",
        icon: "google"
      },
      linkedin: {
        button: "Đăng ký với LinkedIn",
        icon: "linkedin"
      },
      divider: "hoặc"
    },
    form: {
      fullName: {
        label: "Họ và tên",
        placeholder: "Nhập họ và tên"
      },
      email: {
        label: "Email",
        placeholder: "Nhập email của bạn"
      },
      password: {
        label: "Mật khẩu",
        placeholder: "Nhập mật khẩu"
      },
      confirmPassword: {
        label: "Xác nhận mật khẩu",
        placeholder: "Nhập lại mật khẩu"
      },
      tosCheckbox: "Tôi đồng ý với",
      tosLink: "điều khoản dịch vụ",
      submitButton: "Đăng ký",
      loading: "Đang xử lý...",
      signupLink: {
        text: "Đã có tài khoản?",
        link: "Đăng nhập ngay"
      }
    }
  },

  // Login page
  login: {
    title: "Đăng nhập",
    subtitle: "Chào mừng bạn quay lại",
    social: {
      google: {
        button: "Tiếp tục với Google",
        icon: "google"
      },
      linkedin: {
        button: "Tiếp tục với LinkedIn",
        icon: "linkedin"
      },
      divider: "hoặc"
    },
    form: {
      email: {
        label: "Email",
        placeholder: "Nhập email của bạn"
      },
      password: {
        label: "Mật khẩu",
        placeholder: "Nhập mật khẩu"
      },
      rememberMe: "Ghi nhớ đăng nhập",
      forgotPassword: "Quên mật khẩu?",
      submitButton: "Đăng nhập",
      loading: "Đang xử lý...",
      signupLink: {
        text: "Chưa có tài khoản?",
        link: "Đăng ký ngay"
      }
    }
  },

  // CAPTCHA component
  captcha: {
    title: "Xác thực bảo mật",
    answerLabel: "Đáp án:",
    placeholder: "Nhập đáp án",
    loading: "Đang tải CAPTCHA...",
    refreshTooltip: "Làm mới câu hỏi",
    retryButton: "Thử lại",
    successMessage: "Xác thực thành công",
    errors: {
      loadFailed: "Không thể tải CAPTCHA. Vui lòng thử lại.",
      networkError: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại."
    }
  },

  // Terms of Service page
  terms: {
    title: "Điều khoản dịch vụ",
    backButton: "← Quay lại",
    sections: [
      {
        title: "1. Bảo mật và Bảo vệ Dữ liệu Cá nhân",
        content: "OkBuddy cam kết bảo vệ tuyệt đối thông tin cá nhân của bạn. Mọi dữ liệu cá nhân bạn cung cấp khi sử dụng nền tảng của chúng tôi sẽ được bảo vệ nghiêm ngặt và chỉ lưu trữ nội bộ tại OkBuddy. Chúng tôi tuyệt đối không chia sẻ, bán hoặc tiết lộ bất kỳ thông tin cá nhân nào của bạn cho bên thứ ba dưới bất kỳ hình thức nào, trừ trường hợp có yêu cầu cụ thể từ pháp luật."
      },
      {
        title: "2. Quyền riêng tư của người dùng",
        content: "Bạn có quyền truy cập, chỉnh sửa và xóa thông tin cá nhân của mình bất kỳ lúc nào. Nếu bạn muốn yêu cầu truy cập hoặc thay đổi dữ liệu cá nhân, vui lòng liên hệ trực tiếp với chúng tôi qua email hoặc hệ thống hỗ trợ khách hàng của OkBuddy. Chúng tôi cam kết tôn trọng và bảo vệ quyền riêng tư của người dùng trong suốt quá trình sử dụng dịch vụ."
      },
      {
        title: "3. Mục đích và phạm vi thu thập thông tin",
        content: "Thông tin cá nhân thu thập từ bạn sẽ được sử dụng với mục đích hỗ trợ bạn tối ưu hóa hồ sơ ứng tuyển, cung cấp các đề xuất việc làm phù hợp, và cải thiện chất lượng dịch vụ của OkBuddy. Dữ liệu của bạn chỉ được thu thập và xử lý trong phạm vi cần thiết, minh bạch và có sự đồng thuận rõ ràng từ bạn."
      },
      {
        title: "4. Cam kết bảo mật dữ liệu",
        content: "Chúng tôi sử dụng các công nghệ và biện pháp bảo mật tiên tiến nhất để bảo vệ dữ liệu cá nhân của bạn trước các nguy cơ truy cập, chỉnh sửa, hoặc tiết lộ trái phép. Mọi dữ liệu cá nhân đều được mã hóa và bảo mật theo tiêu chuẩn quốc tế, đảm bảo thông tin của bạn luôn an toàn và riêng tư tuyệt đối."
      }
    ]
  },

  // Error messages
  errors: {
    required: "Trường này là bắt buộc",
    invalidEmail: "Email không hợp lệ",
    passwordMismatch: "Mật khẩu không khớp",
    captchaIncorrect: "Đáp án CAPTCHA không chính xác",
    registrationFailed: "Đăng ký thất bại. Vui lòng thử lại.",
    loginFailed: "Đăng nhập thất bại. Vui lòng kiểm tra thông tin.",
    oauthCancelled: "Đăng nhập đã bị hủy. Vui lòng thử lại.",
    oauthFailed: "Đăng nhập thất bại. Vui lòng thử lại.",
    oauthInvalidGrant: "Mã xác thực không hợp lệ. Vui lòng thử lại.",
    oauthRateLimit: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
    oauthNetworkError: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.",
    oauthGenericError: "Đã xảy ra lỗi. Vui lòng thử lại sau."
  },

  // Success messages
  success: {
    registrationComplete: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
    loginComplete: "Đăng nhập thành công!",
    oauthRegistrationComplete: "Đăng ký thành công! Tài khoản của bạn đã được tạo.",
    oauthLoginComplete: "Đăng nhập thành công!"
  },

  // OAuth specific messages
  oauth: {
    loading: {
      redirecting: "Đang chuyển hướng...",
      authenticating: "Đang xác thực...",
      processing: "Đang xử lý...",
      completing: "Hoàn tất đăng nhập..."
    },
    messages: {
      cancelled: "Đăng nhập đã bị hủy",
      failed: "Đăng nhập thất bại",
      success: "Đăng nhập thành công",
      accountLinked: "Tài khoản đã được liên kết thành công",
      accountCreated: "Tài khoản mới đã được tạo"
    }
  }
}; 