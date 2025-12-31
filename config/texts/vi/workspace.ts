export const workspace = {
  header: {
    logo: 'OkBuddy',
    autosave: {
      saving: 'Đang lưu...',
      saved: 'Đã lưu tự động',
    },
    userAvatar: 'N', // Will be dynamically set based on user's first name
  },
  page: {
    title: 'CV của tôi',
    subtitle: 'Quản lý và tối ưu hóa CV cho từng vị trí ứng tuyển',
    createButton: 'Tạo CV mới',
  },
  empty: {
    title: 'Bạn chưa có CV nào!',
    subtitle: 'Hãy bắt đầu bằng cách tạo CV đầu tiên của bạn ngay bây giờ.',
    cta: 'Bắt đầu ngay',
  },
  cvCard: {
    status: {
      inProgress: 'ĐANG TIẾN BỘ',
      completed: 'HOÀN THIỆN',
      new: 'MỚI BẮT ĐẦU',
    },
    actions: {
      continue: 'Tiếp tục',
      edit: 'Chỉnh sửa',
      download: 'Tải xuống',
      delete: 'Xóa',
    },
    lastUpdated: {
      minutes: (n: number) => `${n} phút trước`,
      hours: (n: number) => `${n} giờ trước`,
      days: (n: number) => `${n} ngày trước`,
      weeks: (n: number) => `${n} tuần trước`,
      years: 'Hơn 1 năm trước',
    },
    score: (score: number) => `${score}%`,
  },
  modals: {
    deleteConfirm: {
      title: 'Xác nhận xóa CV',
      message: 'Bạn có chắc chắn muốn xoá CV này?',
      cancel: 'Hủy',
      confirm: 'Xóa',
    },
  },
} as const 