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
      privacyLink: "chính sách bảo mật",
      linkSeparator: " và ",
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
    lastUpdated: "Cập nhật lần cuối: 3/8/2025",
    sections: [
      {
        title: "1. Chấp thuận Điều khoản",
        content: "Chào mừng bạn đến với OkBuddy! Khi sử dụng trang web, ứng dụng hoặc dịch vụ của OkBuddy, điều đó có nghĩa là bạn đã đọc và đồng ý với Điều khoản Dịch vụ này cũng như Chính sách Bảo mật của chúng tôi. Nếu bạn không đồng ý với bất kỳ nội dung nào, vui lòng không sử dụng OkBuddy. Việc bạn tiếp tục sử dụng OkBuddy sau khi chúng tôi cập nhật các điều khoản (xem Mục 8) đồng nghĩa với việc bạn chấp nhận những thay đổi đó. OkBuddy là một công cụ chuẩn bị CV sử dụng công nghệ trí tuệ nhân tạo (AI) và mô hình ngôn ngữ lớn (LLM). Chúng tôi tuân thủ các quy định pháp luật hiện hành tại Việt Nam, Singapore, Thái Lan, Hoa Kỳ… nhằm đảm bảo dịch vụ an toàn và phù hợp cho tất cả mọi người."
      },
      {
        title: "2. Tài khoản, Điều kiện sử dụng và Đăng nhập qua bên thứ ba",
        content: "Bạn có thể cần tạo một tài khoản để sử dụng OkBuddy. Bạn có thể đăng ký bằng email và mật khẩu hoặc đăng nhập thông qua các nhà cung cấp bên thứ ba như Google hoặc LinkedIn. Nếu bạn đăng ký/đăng nhập bằng Google hoặc LinkedIn, bạn cho phép OkBuddy truy cập một số thông tin từ tài khoản đó (ví dụ: tên và địa chỉ email của bạn). Chúng tôi sử dụng các thông tin này để thiết lập và quản lý tài khoản OkBuddy của bạn theo Chính sách Bảo mật. Độ tuổi sử dụng: OkBuddy dành cho mọi người dùng, không giới hạn độ tuổi, nhưng nếu bạn được xem là người chưa thành niên theo pháp luật quốc gia của bạn (ví dụ: dưới 13 tuổi tại Mỹ, dưới 16 tuổi tại Việt Nam, hoặc dưới 20 tuổi tại Thái Lan), bạn phải sử dụng OkBuddy với sự đồng ý và giám sát của cha/mẹ hoặc người giám hộ hợp pháp."
      },
      {
        title: "3. Nội dung Người dùng và Quyền Sở hữu Trí tuệ",
        content: "Nội dung của bạn: Quá trình sử dụng OkBuddy có thể bao gồm việc bạn nhập các thông tin cá nhân, chi tiết CV và nội dung khác (\"Nội dung Người dùng\"). Bạn giữ quyền sở hữu đối với Nội dung Người dùng của mình – OkBuddy không sở hữu các thông tin/tài liệu mà bạn cung cấp. Tuy nhiên, để vận hành dịch vụ, bạn cấp cho OkBuddy một giấy phép (license) sử dụng nội dung của bạn. Cụ thể, bạn đồng ý cho chúng tôi quyền sử dụng, sao chép, chỉnh sửa, tạo các tác phẩm phái sinh, xuất bản và hiển thị nội dung CV/hồ sơ của bạn trên toàn cầu, miễn phí bản quyền, không độc quyền và có thời hạn vĩnh viễn nhằm mục đích vận hành và cải thiện dịch vụ OkBuddy."
      },
      {
        title: "4. Sử dụng Dịch vụ và Hành vi Của Bạn",
        content: "Chúng tôi mong muốn duy trì OkBuddy là một dịch vụ hữu ích và an toàn cho tất cả mọi người. Khi sử dụng OkBuddy, bạn đồng ý tuân thủ những quy định sau: • Sử dụng Đúng Mục Đích: Chỉ sử dụng OkBuddy vào mục đích chính đáng là tạo và cải thiện CV/hồ sơ nghề nghiệp. • Không Sử Dụng Sai Trái: Bạn sẽ không lợi dụng dịch vụ để thực hiện các hành vi xấu. Cụ thể, bạn cam kết không tìm cách tấn công, xâm nhập trái phép, gây quá tải hay phá hoại hệ thống của chúng tôi; không sử dụng OkBuddy để tạo nội dung spam, lừa đảo hoặc vi phạm pháp luật; và không tìm cách dịch ngược mã nguồn, xâm phạm vào phần mềm hay thuật toán của chúng tôi. • Tôn Trọng Người Khác: Không quấy rối, xúc phạm người dùng khác hoặc nhân viên của chúng tôi. Không cố truy cập trái phép tài khoản hoặc dữ liệu của người khác."
      },
      {
        title: "5. Dịch vụ Bên Thứ Ba và Liên kết Ngoài",
        content: "OkBuddy có thể tích hợp hoặc chứa đường liên kết đến các dịch vụ bên thứ ba. Ví dụ: bạn có thể đăng nhập thông qua Google hoặc LinkedIn; OkBuddy cũng sử dụng API của các đối tác AI bên ngoài để tạo nội dung. Ngoài ra, website của chúng tôi có thể chứa liên kết đến trang việc làm hoặc nguồn tham khảo của bên khác nhằm thuận tiện cho bạn. Tài khoản Bên Thứ Ba: Nếu bạn liên kết tài khoản của mình với dịch vụ bên thứ ba, chúng tôi sẽ nhận một số thông tin từ dịch vụ đó và xử lý các thông tin này theo Chính sách Bảo mật. Đối tác AI: OkBuddy sử dụng các dịch vụ AI từ bên thứ ba để cung cấp một số tính năng thông minh. Điều này có nghĩa là khi bạn yêu cầu OkBuddy phân tích hoặc soạn thảo nội dung, phần dữ liệu đó có thể được gửi tới nhà cung cấp AI (ví dụ: OpenAI hoặc dịch vụ tương tự) để xử lý."
      },
      {
        title: "6. Miễn trừ Trách nhiệm và Giới hạn Trách nhiệm",
        content: "Dịch vụ \"Nguyên trạng\": OkBuddy luôn nỗ lực cung cấp dịch vụ tốt nhất, nhưng chúng tôi không thể đảm bảo kết quả cụ thể. Ví dụ, chúng tôi không thể đảm bảo rằng CV bạn tạo với sự trợ giúp của OkBuddy sẽ chắc chắn giúp bạn có được công việc mong muốn, hoặc nội dung do AI gợi ý sẽ hoàn toàn chính xác, không có sai sót. Bạn đồng ý rằng sử dụng OkBuddy đồng nghĩa với việc tự chịu rủi ro. Dịch vụ được cung cấp dựa trên tình trạng \"nguyên trạng\" và \"sẵn có\", không có bất kỳ đảm bảo nào rõ ràng hay ngụ ý. Không phải Tư vấn nghề nghiệp: Nội dung OkBuddy cung cấp (bao gồm bản nháp CV do AI tạo hoặc các nhận xét góp ý) chỉ mang tính tham khảo, cung cấp thông tin, không phải là tư vấn nghề nghiệp chuyên nghiệp."
      },
      {
        title: "7. Luật Áp dụng và Giải quyết Tranh chấp",
        content: "OkBuddy hoạt động trên phạm vi toàn cầu, do đó chúng tôi cố gắng tuân thủ pháp luật tại nhiều quốc gia. Điều khoản này sẽ được điều chỉnh và giải thích phù hợp với các nguyên tắc công bằng chung và pháp luật của các quốc gia/vùng lãnh thổ mà chúng tôi hoạt động, đặc biệt là pháp luật Việt Nam, Singapore, Thái Lan, cũng như các luật liên bang hiện hành của Hoa Kỳ. Nếu bạn là người tiêu dùng tại một quốc gia có các quy định bảo vệ người tiêu dùng hoặc dữ liệu bắt buộc, các quy định đó sẽ được ưu tiên áp dụng trong trường hợp xung đột với Điều khoản này."
      },
      {
        title: "8. Thay đổi đối với Điều khoản",
        content: "Chúng tôi có thể sửa đổi hoặc cập nhật Điều khoản Dịch vụ này theo thời gian cho phù hợp với sự phát triển của dịch vụ hoặc thay đổi của pháp luật. Nếu có thay đổi quan trọng, chúng tôi sẽ thông báo cho bạn bằng cách đăng Điều khoản mới trên trang web và/hoặc gửi thông báo qua ứng dụng hoặc email. Ngày \"Cập nhật lần cuối\" ở đầu Điều khoản sẽ cho biết thời điểm Điều khoản có hiệu lực. Vui lòng kiểm tra định kỳ. Khi Điều khoản mới được công bố và có hiệu lực, việc bạn tiếp tục sử dụng OkBuddy đồng nghĩa với việc bạn chấp nhận các Điều khoản đã sửa đổi. Nếu bạn không đồng ý với thay đổi, bạn nên ngừng sử dụng OkBuddy."
      }
    ]
  },

  // Privacy Policy page
  privacy: {
    title: "Chính sách Bảo mật",
    backButton: "← Quay lại",
    lastUpdated: "Cập nhật lần cuối: 3/8/2025",
    sections: [
      {
        title: "1. Thông tin Chúng tôi Thu thập",
        content: "Để cung cấp và cải thiện dịch vụ OkBuddy, chúng tôi thu thập các loại thông tin sau: • Thông tin bạn cung cấp trực tiếp: Khi bạn tạo tài khoản hoặc sử dụng OkBuddy, bạn có thể cung cấp cho chúng tôi một số thông tin cá nhân, chẳng hạn như thông tin tài khoản (tên, địa chỉ email và các thông tin hồ sơ bạn chọn cung cấp), nội dung CV và dữ liệu bạn nhập (kinh nghiệm làm việc, học vấn, kỹ năng), và liên lạc với chúng tôi (nếu bạn liên hệ qua email hỗ trợ). • Thông tin từ các tài khoản liên kết: Nếu bạn đăng ký hoặc đăng nhập thông qua các dịch vụ bên thứ ba (Google, LinkedIn), chúng tôi sẽ nhận được một số thông tin từ nhà cung cấp đăng nhập. • Dữ liệu sử dụng và phân tích: Chúng tôi tự động thu thập một số dữ liệu về cách bạn tương tác với OkBuddy, bao gồm hoạt động sử dụng, thông tin thiết bị và kỹ thuật, và thông tin vị trí sơ bộ."
      },
      {
        title: "2. Cách Chúng tôi Sử dụng Thông tin",
        content: "Chúng tôi sử dụng thông tin thu thập được cho các mục đích sau: • Cung cấp dịch vụ: Chúng tôi sử dụng thông tin tài khoản và nội dung CV của bạn để vận hành các tính năng cốt lõi của OkBuddy (cho phép bạn tạo, chỉnh sửa, lưu trữ CV trực tuyến và sử dụng dữ liệu để cung cấp gợi ý bằng AI). • Nâng cấp và phát triển tính năng mới: Chúng tôi phân tích hành vi và phản hồi của người dùng để phát triển OkBuddy ngày càng tốt hơn. Chúng tôi có thể sử dụng một phần dữ liệu người dùng để huấn luyện các mô hình AI và thuật toán của chúng tôi. • Phân tích và nghiên cứu: Chúng tôi sử dụng dữ liệu để tiến hành phân tích, thống kê nhằm hiểu cộng đồng người dùng. • Cá nhân hóa trải nghiệm: Dựa trên thông tin và cách bạn sử dụng, chúng tôi có thể tùy chỉnh một số khía cạnh của dịch vụ. • Liên lạc với bạn: Chúng tôi sử dụng thông tin liên hệ (email) để giao tiếp khi cần thiết. • Bảo mật và phòng chống lạm dụng: Thông tin thu thập được sử dụng để bảo vệ người dùng và OkBuddy."
      },
      {
        title: "3. Cách Chúng tôi Chia sẻ Thông tin",
        content: "OkBuddy coi việc bảo mật thông tin người dùng là ưu tiên cao. Chúng tôi không bán thông tin cá nhân của bạn cho bên thứ ba để thu lợi. Chúng tôi chỉ chia sẻ thông tin trong những trường hợp sau đây: • Với các nhà cung cấp dịch vụ: Chúng tôi sử dụng một số công ty/dịch vụ bên ngoài đáng tin cậy để hỗ trợ vận hành OkBuddy (dịch vụ lưu trữ đám mây, dịch vụ email/SMS, công cụ phân tích). • Với đối tác AI để xử lý yêu cầu của bạn: Khi bạn sử dụng các tính năng AI, nội dung bạn cung cấp sẽ được gửi đến máy chủ AI của đối tác để xử lý. • Với các chi nhánh và đối tác liên kết: Chúng tôi có thể chia sẻ dữ liệu đã được ẩn danh hoặc tổng hợp cho các đối tác, nhà nghiên cứu. • Vì lý do pháp lý: Chúng tôi có thể tiết lộ thông tin của bạn nếu việc đó là cần thiết để tuân thủ pháp luật hoặc bảo vệ quyền lợi. • Chuyển giao kinh doanh: Trong trường hợp OkBuddy trải qua thay đổi về cơ cấu doanh nghiệp, thông tin người dùng có thể được chuyển giao. • Với sự đồng ý của bạn: Trong mọi trường hợp khác, nếu chúng tôi muốn chia sẻ thông tin cá nhân của bạn, chúng tôi sẽ thông báo và chỉ chia sẻ khi có sự đồng ý của bạn."
      },
      {
        title: "4. Lưu trữ và Bảo mật Thông tin",
        content: "Nơi lưu trữ dữ liệu: Dữ liệu của bạn được lưu trữ trên máy chủ an toàn. Tùy thuộc vào vị trí địa lý và cơ sở hạ tầng, dữ liệu có thể được lưu tại các trung tâm dữ liệu khác nhau. Biện pháp bảo mật: Chúng tôi áp dụng nhiều biện pháp kỹ thuật và tổ chức để bảo vệ dữ liệu cá nhân của bạn, bao gồm mã hóa (giao thức HTTPS/TLS được sử dụng cho mọi truyền thông), kiểm soát truy cập (chỉ những nhân viên thực sự cần truy cập dữ liệu để vận hành dịch vụ mới được cấp quyền), tường lửa và bảo vệ mạng, sao lưu định kỳ và kiểm thử bảo mật. Dù vậy, xin hiểu rằng không phương thức bảo mật nào là tuyệt đối 100%. Chúng tôi không thể đảm bảo hoàn toàn rằng dữ liệu của bạn sẽ không bị truy cập, tiết lộ hoặc phá hủy bởi những hành động xâm nhập trái phép vượt quá các biện pháp bảo vệ của chúng tôi."
      },
      {
        title: "5. Chuyển giao Dữ liệu Quốc tế",
        content: "OkBuddy hoạt động trực tuyến và có người dùng ở nhiều quốc gia. Do đó, thông tin của bạn có thể được chuyển đến hoặc lưu trữ tại các quốc gia khác với nơi bạn sinh sống. Các quốc gia khác nhau có luật bảo vệ dữ liệu khác nhau. Khi dữ liệu cá nhân được chuyển ra khỏi quốc gia của bạn, luật nơi dữ liệu được lưu trữ có thể khác với luật của nước bạn. Tuy nhiên, chúng tôi cam kết bảo vệ dữ liệu của bạn theo tiêu chuẩn cao bất kể dữ liệu nằm ở đâu. Cụ thể, khi chúng tôi chuyển dữ liệu xuyên biên giới, chúng tôi tuân thủ quy định pháp luật địa phương, sử dụng điều khoản hợp đồng mẫu (SCC), đánh giá bảo mật và rủi ro, và áp dụng mã hóa và biện pháp kỹ thuật mạnh."
      },
      {
        title: "6. Quyền và Lựa chọn của Bạn",
        content: "Chúng tôi tin rằng bạn nên có quyền kiểm soát thông tin cá nhân của mình. Tùy theo luật áp dụng, bạn có thể có một số quyền sau đối với dữ liệu của mình: • Quyền truy cập: Bạn có quyền yêu cầu chúng tôi xác nhận xem OkBuddy có đang xử lý dữ liệu cá nhân của bạn hay không, và nếu có, bạn có thể yêu cầu một bản sao các dữ liệu cá nhân đó. • Quyền chỉnh sửa: Nếu bạn phát hiện bất kỳ thông tin nào của bạn không chính xác hoặc không đầy đủ, bạn có quyền yêu cầu chúng tôi sửa lại. • Quyền xóa dữ liệu: Bạn có thể yêu cầu chúng tôi xóa hoặc loại bỏ dữ liệu cá nhân của bạn trong những trường hợp nhất định. • Quyền phản đối xử lý: Nếu chúng tôi xử lý dữ liệu của bạn dựa trên lợi ích hợp pháp hoặc vì mục đích tiếp thị trực tiếp, bạn có quyền phản đối việc xử lý đó. • Quyền hạn chế xử lý: Bạn có quyền yêu cầu chúng tôi tạm ngừng xử lý dữ liệu của bạn trong một số trường hợp. • Quyền di chuyển dữ liệu: Với những dữ liệu cá nhân bạn đã cung cấp cho chúng tôi, bạn có quyền yêu cầu nhận lại dưới định dạng có cấu trúc. • Quyền rút lại sự đồng ý: Bạn luôn có quyền rút lại đồng ý bất cứ lúc nào."
      },
      {
        title: "7. Quyền Riêng tư Của Trẻ Em",
        content: "OkBuddy không hướng đến đối tượng trẻ nhỏ nếu không có sự giám sát của người lớn. Nếu bạn chưa đủ tuổi tự mình đồng ý với các điều khoản trực tuyến (độ tuổi này tùy theo luật từng nước, ví dụ: dưới 13 tuổi ở Mỹ, dưới 16 ở Việt Nam và EU, dưới 13 ở Singapore, dưới 10 ở Thái Lan để cần cha mẹ đồng ý…), bạn nên sử dụng OkBuddy dưới sự giám sát của cha mẹ hoặc người giám hộ hợp pháp. Chúng tôi không cố ý thu thập thông tin cá nhân từ trẻ em dưới độ tuổi cho phép. Nếu chúng tôi biết được rằng mình đã vô tình thu thập thông tin cá nhân của trẻ dưới độ tuổi cho phép mà không có sự đồng ý của phụ huynh, chúng tôi sẽ nhanh chóng thực hiện các bước xóa dữ liệu đó khỏi hệ thống của mình."
      },
      {
        title: "8. Thay đổi đối với Chính sách Bảo mật",
        content: "Chúng tôi có thể cập nhật Chính sách Bảo mật này thỉnh thoảng nhằm phản ánh những thay đổi trong hoạt động của OkBuddy hoặc khi có quy định pháp luật mới. Khi chúng tôi thực hiện thay đổi quan trọng, chúng tôi sẽ thông báo rõ ràng cho bạn bằng cách đăng thông báo trên trang chủ hoặc gửi email thông báo đến địa chỉ email đã đăng ký, và cập nhật ngày \"Cập nhật lần cuối\" ở đầu Chính sách. Chính sách Bảo mật mới sẽ có hiệu lực kể từ ngày được thông báo, trừ khi có quy định khác. Việc bạn tiếp tục sử dụng OkBuddy sau khi chính sách mới có hiệu lực đồng nghĩa với việc bạn chấp nhận các thay đổi đó."
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
    loginFailed: "Email hoặc mật khẩu không chính xác",
    incorrectPassword: "Email hoặc mật khẩu không chính xác",
    emailPasswordRequired: "Email và mật khẩu là bắt buộc",
    invalidEmailFormat: "Email không hợp lệ",
    userNotFound: "Không tìm thấy tài khoản với email này",
    loginError: "Đăng nhập thất bại. Vui lòng kiểm tra thông tin.",
    rateLimitExceeded: "Quá nhiều lần đăng nhập. Vui lòng thử lại sau",
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