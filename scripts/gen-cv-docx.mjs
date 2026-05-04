import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, UnderlineType, Tab, TabStopType, TabStopPosition
} from '/Users/dale/pmf/node_modules/docx/build/index.mjs';
import { writeFileSync } from 'fs';

// ---- Helper tạo đường kẻ ngang ----
const divider = () => new Paragraph({
  border: { bottom: { color: '2563EB', size: 6, style: BorderStyle.SINGLE } },
  spacing: { after: 80 }
});

// ---- Helper tiêu đề section ----
const sectionTitle = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, size: 26, color: '1E3A5F', font: 'Calibri' })],
  spacing: { before: 240, after: 60 },
  border: { bottom: { color: '2563EB', size: 4, style: BorderStyle.SINGLE } }
});

// ---- Helper dòng thông tin liên hệ ----
const contactLine = (label, value) => new Paragraph({
  children: [
    new TextRun({ text: `${label}: `, bold: true, size: 20, font: 'Calibri', color: '374151' }),
    new TextRun({ text: value, size: 20, font: 'Calibri' })
  ],
  spacing: { after: 40 }
});

// ---- Helper bullet point ----
const bullet = (text) => new Paragraph({
  children: [new TextRun({ text, size: 20, font: 'Calibri' })],
  bullet: { level: 0 },
  spacing: { after: 60 }
});

// ---- Helper dòng kinh nghiệm ----
const expHeader = (title, company, time) => new Paragraph({
  children: [
    new TextRun({ text: title, bold: true, size: 22, font: 'Calibri', color: '1E3A5F' }),
    new TextRun({ text: `  •  ${company}`, size: 20, font: 'Calibri', color: '6B7280' }),
    new TextRun({ text: `    [${time}]`, size: 20, font: 'Calibri', color: '9CA3AF', italics: true })
  ],
  spacing: { before: 160, after: 60 }
});

// ---- Helper skill tag ----
const skillLine = (skills) => new Paragraph({
  children: skills.flatMap((s, i) => [
    new TextRun({ text: `▪ ${s}`, size: 20, font: 'Calibri', color: '1E3A5F' }),
    ...(i < skills.length - 1 ? [new TextRun({ text: '   ', size: 20 })] : [])
  ]),
  spacing: { after: 60 }
});

// ---- Tạo Document ----
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 20, color: '111827' }
      }
    }
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 720, bottom: 720, left: 900, right: 900 }
      }
    },
    children: [

      // ==== HEADER: Tên & chức danh ====
      new Paragraph({
        children: [new TextRun({ text: 'TRẦN MINH KHOA', bold: true, size: 52, font: 'Calibri', color: '1E3A5F' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Lập Trình Viên Full-Stack  |  3 Năm Kinh Nghiệm', size: 24, font: 'Calibri', color: '2563EB', italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '📧 tranminhkhoa.dev@gmail.com   ', size: 20, font: 'Calibri' }),
          new TextRun({ text: '📞 0901 234 567   ', size: 20, font: 'Calibri' }),
          new TextRun({ text: '📍 Hà Nội, Việt Nam   ', size: 20, font: 'Calibri' }),
          new TextRun({ text: '🔗 github.com/tranminhkhoa', size: 20, font: 'Calibri', color: '2563EB' })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),

      // ==== GIỚI THIỆU ====
      sectionTitle('GIỚI THIỆU BẢN THÂN'),
      new Paragraph({
        children: [new TextRun({
          text: 'Lập trình viên Full-Stack với 3 năm kinh nghiệm phát triển ứng dụng web sử dụng React, Node.js và TypeScript. Có kinh nghiệm làm việc trong môi trường Agile, đam mê viết code sạch và tối ưu hiệu năng hệ thống. Từng tham gia xây dựng các sản phẩm SaaS phục vụ hơn 10.000 người dùng. Mong muốn đóng góp vào các dự án có quy mô lớn và tác động thực tế.',
          size: 20, font: 'Calibri'
        })],
        spacing: { after: 120 }
      }),

      // ==== KỸ NĂNG ====
      sectionTitle('KỸ NĂNG KỸ THUẬT'),
      skillLine(['JavaScript / TypeScript', 'React.js / Next.js', 'Node.js / Express.js', 'PostgreSQL / MySQL']),
      skillLine(['REST API / GraphQL', 'Docker / CI-CD', 'Git / GitHub / GitLab', 'Jest / Testing Library']),
      skillLine(['HTML5 / CSS3 / Tailwind CSS', 'AWS (EC2, S3, Lambda)', 'Redis', 'Tiếng Anh (B2)']),

      // ==== KINH NGHIỆM ====
      sectionTitle('KINH NGHIỆM LÀM VIỆC'),

      expHeader('Lập Trình Viên Full-Stack', 'FPT Software', '03/2023 – Hiện tại'),
      bullet('Phát triển và duy trì hệ thống quản lý nội bộ bằng React 18, TypeScript và Node.js, phục vụ hơn 500 nhân viên.'),
      bullet('Tối ưu hoá API REST và truy vấn PostgreSQL, giảm thời gian phản hồi trung bình từ 800ms xuống 200ms (giảm 75%).'),
      bullet('Thiết lập CI/CD pipeline với GitHub Actions, rút ngắn thời gian deploy từ 30 phút xuống 8 phút.'),
      bullet('Mentoring 2 junior developer, tổ chức code review hằng tuần và hướng dẫn best practices.'),

      expHeader('Lập Trình Viên Front-End', 'Startup TechViet', '06/2021 – 02/2023'),
      bullet('Xây dựng giao diện ứng dụng thương mại điện tử B2B bằng React và Redux Toolkit từ giai đoạn đầu.'),
      bullet('Phối hợp với UI/UX designer xây dựng design system, tăng tốc độ phát triển tính năng mới lên 40%.'),
      bullet('Tích hợp cổng thanh toán VNPay và Stripe, xử lý hơn 200 đơn hàng/ngày ổn định.'),
      bullet('Viết unit test với Jest và React Testing Library, đạt coverage 80% trên các module chính.'),

      // ==== HỌC VẤN ====
      sectionTitle('HỌC VẤN'),
      new Paragraph({
        children: [
          new TextRun({ text: 'Kỹ Sư Công Nghệ Thông Tin', bold: true, size: 22, font: 'Calibri', color: '1E3A5F' }),
          new TextRun({ text: '  –  Đại học Bách Khoa Hà Nội', size: 20, font: 'Calibri' }),
          new TextRun({ text: '    [2017 – 2021]', size: 20, font: 'Calibri', color: '9CA3AF', italics: true })
        ],
        spacing: { before: 100, after: 60 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Tốt nghiệp loại Khá, GPA 3.2/4.0. Đề tài: Hệ thống gợi ý sản phẩm bằng Collaborative Filtering.', size: 20, font: 'Calibri', color: '6B7280', italics: true })],
        spacing: { after: 120 }
      }),

      // ==== DỰ ÁN ====
      sectionTitle('DỰ ÁN CÁ NHÂN'),

      new Paragraph({
        children: [
          new TextRun({ text: 'DevBlog Platform', bold: true, size: 22, font: 'Calibri', color: '1E3A5F' }),
          new TextRun({ text: '  –  github.com/tranminhkhoa/devblog', size: 20, font: 'Calibri', color: '2563EB' })
        ],
        spacing: { before: 100, after: 60 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Nền tảng blog kỹ thuật cho lập trình viên với Markdown editor, tag hệ thống, tìm kiếm full-text.', size: 20, font: 'Calibri' })],
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Stack: Next.js, TypeScript, Supabase, Tailwind CSS', size: 20, font: 'Calibri', color: '6B7280', italics: true })],
        spacing: { after: 100 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: 'Task Manager CLI', bold: true, size: 22, font: 'Calibri', color: '1E3A5F' }),
          new TextRun({ text: '  –  github.com/tranminhkhoa/task-cli', size: 20, font: 'Calibri', color: '2563EB' })
        ],
        spacing: { before: 60, after: 60 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Công cụ quản lý công việc trên terminal, đồng bộ với Google Calendar, hỗ trợ offline.', size: 20, font: 'Calibri' })],
        spacing: { after: 40 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Stack: Node.js, Commander.js, SQLite, Google Calendar API', size: 20, font: 'Calibri', color: '6B7280', italics: true })],
        spacing: { after: 100 }
      }),

      // ==== CHỨNG CHỈ ====
      sectionTitle('CHỨNG CHỈ'),
      new Paragraph({
        children: [
          new TextRun({ text: '▪ AWS Certified Cloud Practitioner', size: 20, font: 'Calibri', bold: true }),
          new TextRun({ text: '  –  Amazon Web Services  (2023)', size: 20, font: 'Calibri', color: '6B7280' })
        ],
        spacing: { before: 80, after: 60 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '▪ Meta Front-End Developer Certificate', size: 20, font: 'Calibri', bold: true }),
          new TextRun({ text: '  –  Coursera / Meta  (2022)', size: 20, font: 'Calibri', color: '6B7280' })
        ],
        spacing: { after: 60 }
      }),

    ]
  }]
});

// ---- Export file ----
const buffer = await Packer.toBuffer(doc);
writeFileSync('/Users/dale/pmf/CV_LapTrinhVien_TranMinhKhoa.docx', buffer);
console.log('✅ Đã tạo file: CV_LapTrinhVien_TranMinhKhoa.docx');
