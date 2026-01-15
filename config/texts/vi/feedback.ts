/**
 * Vietnamese Feedback Text Configuration
 * Following OkBuddy Tenet 9: Centralized text management
 */

export const feedback = {
  title: 'Feedback',
  description: 'Hãy chia sẻ với chúng tôi ý kiến, góp ý hoặc báo cáo lỗi để giúp OkBuddy ngày càng tốt hơn.',
  
  form: {
    feedbackLabel: 'Nội dung feedback',
    feedbackRequired: '*',
    feedbackPlaceholder: 'Chia sẻ ý kiến của bạn về OkBuddy...',
    
    emailLabel: 'Email',
    emailOptional: '(tùy chọn)',
    emailLoggedIn: '(đã đăng nhập)',
    emailPlaceholder: 'email@example.com',
    emailHelp: 'Để lại email nếu bạn muốn chúng tôi phản hồi.',
    emailHelpLoggedIn: 'Chúng tôi sẽ phản hồi qua email này nếu cần thiết.',
    
    characterCount: 'ký tự',
    overLimit: 'Vượt quá giới hạn',
    characterLimit: '5000'
  },
  
  buttons: {
    cancel: 'Hủy',
    submit: 'Gửi feedback',
    submitting: 'Đang gửi...'
  },
  
  success: {
    title: 'Cảm ơn bạn đã gửi feedback!',
    message: 'Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.'
  },
  
  validation: {
    required: 'Vui lòng nhập nội dung feedback',
    tooLong: 'Nội dung không được vượt quá 5000 ký tự',
    emailInvalid: 'Định dạng email không hợp lệ'
  },
  
  aria: {
    closeButton: 'Đóng feedback',
    feedbackButton: 'Gửi feedback'
  }
} as const;