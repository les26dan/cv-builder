/**
 * Script tạo CV lập trình viên tiếng Việt mẫu
 * Chạy: node scripts/create-dev-cv.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Thiếu biến môi trường Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const cvData = {
  contact: {
    fullName: 'Trần Minh Khoa',
    email: 'tranminhkhoa.dev@gmail.com',
    phone: '0901234567',
    location: 'Hà Nội, Việt Nam',
    linkedin: 'linkedin.com/in/tranminhkhoa'
  },
  summary: {
    content: 'Lập trình viên Full-Stack với 3 năm kinh nghiệm phát triển ứng dụng web sử dụng React, Node.js và TypeScript. Có kinh nghiệm làm việc trong môi trường Agile, đam mê viết code sạch và tối ưu hiệu năng hệ thống. Từng tham gia xây dựng các sản phẩm SaaS phục vụ hơn 10.000 người dùng.'
  },
  experience: {
    items: [
      {
        id: 'exp-1',
        title: 'Lập trình viên Full-Stack',
        company: 'Công ty Cổ phần Công nghệ FPT Software',
        location: 'Hà Nội',
        startDate: '03/2023',
        endDate: '',
        current: true,
        bullets: [
          'Phát triển và duy trì hệ thống quản lý nội bộ sử dụng React 18, TypeScript và Node.js, phục vụ hơn 500 nhân viên.',
          'Tối ưu hoá API REST và truy vấn PostgreSQL, giảm thời gian phản hồi trung bình từ 800ms xuống 200ms.',
          'Tích hợp CI/CD pipeline với GitHub Actions, giảm thời gian deploy từ 30 phút xuống 8 phút.',
          'Mentoring 2 junior developer và review code hằng tuần.'
        ]
      },
      {
        id: 'exp-2',
        title: 'Lập trình viên Front-End',
        company: 'Startup TechViet',
        location: 'Hà Nội',
        startDate: '06/2021',
        endDate: '02/2023',
        current: false,
        bullets: [
          'Xây dựng giao diện người dùng cho ứng dụng thương mại điện tử B2B bằng React và Redux Toolkit.',
          'Phối hợp với UI/UX designer triển khai design system từ đầu, tăng tốc độ phát triển tính năng mới lên 40%.',
          'Tích hợp thanh toán trực tuyến với VNPay và Stripe cho hơn 200 đơn hàng/ngày.'
        ]
      }
    ]
  },
  skills: {
    items: [
      'JavaScript / TypeScript',
      'React.js / Next.js',
      'Node.js / Express.js',
      'PostgreSQL / MySQL',
      'Git / GitHub / GitLab',
      'Docker / CI-CD',
      'REST API / GraphQL',
      'HTML5 / CSS3 / Tailwind CSS',
      'Jest / Testing Library',
      'Tiếng Anh (B2 - đọc tài liệu kỹ thuật)'
    ]
  },
  education: {
    items: [
      {
        id: 'edu-1',
        degree: 'Kỹ sư Công nghệ Thông tin',
        institution: 'Đại học Bách Khoa Hà Nội',
        location: 'Hà Nội',
        graduationDate: '2021',
        description: 'Tốt nghiệp loại Khá, GPA 3.2/4.0. Đề tài tốt nghiệp: Xây dựng hệ thống gợi ý sản phẩm sử dụng Machine Learning.'
      }
    ]
  },
  projects: {
    items: [
      {
        id: 'proj-1',
        name: 'DevBlog Platform',
        description: 'Nền tảng blog kỹ thuật cho lập trình viên, tích hợp Markdown editor, tag hệ thống và tìm kiếm full-text.',
        technologies: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'],
        url: 'github.com/tranminhkhoa/devblog'
      },
      {
        id: 'proj-2',
        name: 'Task Manager CLI',
        description: 'Công cụ quản lý công việc chạy trên terminal, hỗ trợ đồng bộ với Google Calendar.',
        technologies: ['Node.js', 'Commander.js', 'SQLite', 'Google API'],
        url: 'github.com/tranminhkhoa/task-cli'
      }
    ]
  },
  certificates: {
    items: [
      {
        id: 'cert-1',
        name: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        date: '2023'
      },
      {
        id: 'cert-2',
        name: 'Meta Front-End Developer Professional Certificate',
        issuer: 'Coursera / Meta',
        date: '2022'
      }
    ]
  },
  languages: {
    items: [
      { id: 'lang-1', language: 'Tiếng Việt', level: 'Bản ngữ' },
      { id: 'lang-2', language: 'Tiếng Anh', level: 'B2 - Đọc hiểu tài liệu kỹ thuật' }
    ]
  },
  awards: { items: [] },
  sectionOrder: ['contact', 'summary', 'experience', 'skills', 'education', 'projects', 'certificates', 'languages'],
  sectionTitles: {
    contact: 'Thông Tin Liên Hệ',
    summary: 'Giới Thiệu Bản Thân',
    experience: 'Kinh Nghiệm Làm Việc',
    skills: 'Kỹ Năng',
    education: 'Học Vấn',
    projects: 'Dự Án Cá Nhân',
    certificates: 'Chứng Chỉ',
    languages: 'Ngoại Ngữ'
  }
};

async function main() {
  // Lấy user admin để gán CV
  console.log('🔍 Tìm user admin...');
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, email, full_name')
    .limit(5);

  if (userErr) {
    console.error('❌ Lỗi lấy danh sách user:', userErr.message);
    console.log('💡 Thử lấy từ bảng khác...');
  }

  console.log('👥 Users tìm thấy:', users);

  const userId = users && users.length > 0 ? users[0].id : null;
  if (!userId) {
    console.error('❌ Không tìm thấy user nào. Hãy đăng nhập vào app trước.');
    process.exit(1);
  }

  console.log(`✅ Sử dụng user: ${users[0].email} (${userId})`);

  // Tạo CV record
  const now = new Date().toISOString();
  const cvRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    title: 'CV Lập Trình Viên Full-Stack - Trần Minh Khoa',
    status: 'completed',
    score: 82,
    cv_data: cvData,
    workflow_current_step: 'completed',
    workflow_steps_completed: ['upload', 'analysis', 'editing', 'completed'],
    workflow_last_active_step: 'completed',
    workflow_time_spent: 1800,
    auto_save_enabled: true,
    ai_assistance_enabled: false,
    template_name: 'default',
    language: 'vi',
    version: 1,
    source: 'scratch',
    created_at: now,
    updated_at: now,
    last_saved_at: now
  };

  console.log('💾 Đang tạo CV...');
  const { data, error } = await supabase
    .from('cv_workflow')
    .insert(cvRecord)
    .select()
    .single();

  if (error) {
    console.error('❌ Lỗi tạo CV:', error.message);
    console.log('Chi tiết:', JSON.stringify(error, null, 2));
    process.exit(1);
  }

  console.log('✅ CV lập trình viên đã được tạo thành công!');
  console.log('📄 CV ID:', data.id);
  console.log('👤 Tên:', cvData.contact.fullName);
  console.log('🔗 Xem tại: http://localhost:3001/cv-workspace');
}

main().catch(err => {
  console.error('💥 Lỗi:', err);
  process.exit(1);
});
