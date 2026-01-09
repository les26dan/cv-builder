export interface CVData {
  id?: string; // Optional ID for CV identification
  sectionOrder: string[];
  sectionTitles?: Record<string, string>;
  contact: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  summary: {
    content: string;
  };
  experience: {
    items: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      startDate: string;
      endDate: string;
      current: boolean;
      bullets: string[];
    }>;
  };
  skills: {
    items: string[];
  };
  education: {
    items: Array<{
      id: string;
      degree: string;
      institution: string;
      location: string;
      graduationDate: string;
      description: string;
    }>;
  };
  certificates?: {
    items: Array<{
      id: string;
      name: string;
      issuer: string;
      date: string;
      url?: string;
    }>;
  };
  languages?: {
    items: Array<{
      id: string;
      language: string;
      level: string;
    }>;
  };
  projects?: {
    items: Array<{
      id: string;
      name: string;
      description: string;
      technologies: string[];
      url?: string;
    }>;
  };
  awards?: {
    items: Array<{
      id: string;
      title: string;
      issuer: string;
      date: string;
      description?: string;
    }>;
  };
}

// Function to get user data from authentication
const getUserData = () => {
  try {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('okbuddy_user');
      if (userData) {
        return JSON.parse(userData);
      }
    }
  } catch (error) {
    console.log('No user data found:', error);
  }
  return null;
};

// Development helper: simulate user login (for testing)
const simulateUserLogin = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Only simulate in development
    const existingUser = localStorage.getItem('okbuddy_user');
    if (!existingUser) {
      // Simulate a logged-in user for development
      const mockUser = {
        id: 'dev-user-1',
        fullName: 'Nguyễn Văn A',
        email: 'admin@example.com',
        emailVerified: true
      };
      localStorage.setItem('okbuddy_user', JSON.stringify(mockUser));
      console.log('🔧 Development: Simulated user login:', mockUser);
    }
  }
};

// Function to prefill contact data with user info
const getContactDataWithUserInfo = (baseContact: CVData['contact']) => {
  const user = getUserData();
  if (user && (user.fullName || user.email)) {
    return {
      ...baseContact,
      fullName: user.fullName || baseContact.fullName,
      email: user.email || baseContact.email
    };
  }
  return baseContact;
};

// Run simulation in development
if (typeof window !== 'undefined') {
  simulateUserLogin();
}

export const initialCV: CVData = {
  id: 'initial-cv', // Add default ID
  sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
  sectionTitles: {},
  contact: getContactDataWithUserInfo({
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    phone: '0912345678',
    location: 'Hồ Chí Minh, Việt Nam',
    linkedin: 'linkedin.com/in/nguyenvana'
  }),
  summary: {
    content: 'Với hơn 3 năm kinh nghiệm làm việc tại vị trí Nhân viên kinh doanh, tôi có nền tảng vững chắc về quy trình bán hàng, kỹ năng nắm bắt tâm lý khách hàng và kinh nghiệm chốt sales. Tại công ty gần nhất, tôi đã tư vấn và xây dựng mối quan hệ bền vững với hơn 200 khách hàng lớn, đạt danh hiệu Nhân viên kinh doanh xuất sắc năm 2024.'
  },
  experience: {
    items: [{
      id: 'exp-1',
      title: 'Chuyên viên kinh doanh',
      company: 'Công ty cổ phần nội thất HLT',
      location: 'Hồ Chí Minh',
      startDate: '01/2024',
      endDate: '',
      current: true,
      bullets: ['Tìm kiếm khách hàng mới thông qua các kênh: LinkedIn, Facebook, Zalo, Email Marketing & phát triển mạng lưới khách hàng và tăng doanh thu.', 'Phân tích nhu cầu khách hàng để đưa ra các đề xuất về quy trình bán hàng, tối ưu hóa chăm sóc khách hàng.', 'Quản lý và phát triển mối quan hệ với hơn 200 khách hàng lớn, giảm các nhóm khách hàng chiến lược trong ngành để gia tăng và mở rộng doanh thu.']
    }, {
      id: 'exp-2',
      title: 'Nhân viên kinh doanh',
      company: 'Công ty cổ phần MML',
      location: 'Hà Nội',
      startDate: '01/2022',
      endDate: '01/2023',
      current: false,
      bullets: ['Tìm kiếm và phát triển mối quan hệ với khách hàng tiềm năng, đồng thời duy trì kết nối với khách hàng cũ, hỗ trợ giải đáp thắc mắc và xử lý các khiếu nại liên quan đến sản phẩm/dịch vụ.', 'Tham gia phân tích, đánh giá tình hình kinh doanh của đối thủ, đề xuất phương án triển khai chiến dịch bán hàng cho doanh nghiệp.']
    }]
  },
  skills: {
    items: ['Kỹ năng bán hàng B2B', 'Phát triển khách hàng', 'Đàm phán hợp đồng', 'Chăm sóc khách hàng', 'Microsoft Office', 'CRM', 'Tiếng Anh giao tiếp']
  },
  education: {
    items: [{
      id: 'edu-1',
      degree: 'Cử nhân Quản trị Kinh doanh',
      institution: 'Đại học Kinh tế TP.HCM',
      location: 'Hồ Chí Minh',
      graduationDate: '2021',
      description: 'Tốt nghiệp loại Khá, điểm trung bình 7.8/10'
    }]
  },
  certificates: { items: [] },
  languages: { items: [] },
  projects: { items: [] },
  awards: { items: [] }
};

// Empty CV data for testing UX from scratch
export const emptyCV: CVData = {
  sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education'],
  sectionTitles: {},
  contact: getContactDataWithUserInfo({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: ''
  }),
  summary: {
    content: ''
  },
  experience: {
    items: [{
      id: 'exp-1',
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: ['']
    }]
  },
  skills: {
    items: []
  },
  education: {
    items: [{
      id: 'edu-1',
      degree: '',
      institution: '',
      location: '',
      graduationDate: '',
      description: ''
    }]
  },
  certificates: { items: [] },
  languages: { items: [] },
  projects: { items: [] },
  awards: { items: [] }
}; 